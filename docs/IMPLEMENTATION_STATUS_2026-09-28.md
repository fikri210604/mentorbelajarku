# Implementation Status — Security & Integrity Hardening
**Tanggal:** 28 September 2026
**Dasar:** `docs/PROJECT_REVIEW_2026-09-28.md` (temuan P0–P3).
**Keputusan bisnis:** `docs/BUSINESS_RULES.md` §11 (dikonfirmasi 28 September 2026).

Dokumen ini mencatat apa yang sudah diimplementasikan pada sesi hardening ini, beserta bukti file dan hal yang masih tersisa.

---

## 1. P0 — Keamanan & Integritas

### 1.1. Guard otorisasi terpusat untuk API
- Baru: `requireApiUser`, `requireManagementApi(permission?)`, `requireTutorApi(permission?)`, `apiJsonError` di `lib/auth/guards.ts`.
- Semua Route Handler `app/api/v1/management/*` dan `app/api/v1/tutor/*` kini memanggil guard. Endpoint yang sebelumnya tanpa guard (programs, bimbel-types, students GET, enrollments, schedules, sessions, attendance, generate, dll.) sudah diproteksi.
- `app/api/v1/management/sessions/generate` memakai `session:create`; attendance memakai `attendance:create`/`attendance:read`; payroll, tarif, audit, dll. memakai permission masing-masing.

### 1.2. Identitas server-side untuk Server Action
- `submitSessionAttendance` (tutor) tidak lagi menerima `currentUser`; identitas diambil dari `getCurrentUser()`.
- `updateTutorProfile` dan `changeTutorPassword` tidak lagi menerima `userId` dari client; password benar-benar diubah via Better Auth `changePassword`.
- Server Action Management (student, tutor, schedule) memakai `checkPermission(...)` di server.
- `promoteTutorToManagement` memakai `roles:manage`.

### 1.3. IDOR tutor
- `requireTutorApi` fail-closed: akun tanpa `tutorId` ditolak.
- `/api/v1/tutor/students`, `/schedules`, `/dashboard`, `/payroll` membatasi query pada `tutor_id` aktif.
- `/api/v1/tutor/sessions/[sessionId]` dan `/attendance/[attendanceId]` memverifikasi kepemilikan sesi lewat `eq('tutor_id', tutorId)`.
- `/api/v1/tutor/students/[studentId]` memverifikasi murid terhubung ke jadwal tutor.

### 1.4. Bypass jendela presensi
- `allowTimeBypass` dihapus dari `submitSessionAttendanceSchema`.
- Form presensi tidak lagi mengaktifkan bypass; validasi jendela murni di server.
- Pengecualian baru: `overrideAttendanceWindow` (Management, `attendance:update`, wajib alasan, diaudit).

### 1.5. Transaksi attendance atomik
- Migration `supabase/migrations/0001_initial_schema.sql` mendefinisikan RPC `submit_session_attendance` yang memvalidasi peserta/enrollment, upsert attendance, learning record, menandai sesi `completed`, dan menulis audit **dalam satu transaksi**.
- Model data diselaraskan: `attendance.enrollment_id` (bukan `student_program_id`), materi di `learning_records` (bukan `attendance.material`).

### 1.6. Validasi & penyimpanan foto
- Baru: `lib/utils/image-validation.ts` — estimasi ukuran pre-decode, deteksi magic bytes (JPEG/PNG/WebP), penolakan file spoofed.
- `lib/storage/index.ts` disatukan ke satu bucket `attendance`; helper `signAttendancePhotoPath`.
- `getAuthorizedAttendancePhotoUrl(attendanceId)` hanya menandatangani foto setelah otorisasi attendance.

### 1.7. RLS & storage
- Schema `0001` mengaktifkan RLS **tanpa** policy allow-all (deny-by-default bagi anon/authenticated; server memakai service_role).
- Bucket `attendance` diset privat (`public=false`) dengan batas ukuran dan MIME allow-list.

### 1.8. Mode sintetis
- `isSyntheticAuthEnabled()` kini **selalu false saat `NODE_ENV=production`**, dan hanya aktif bila `SYNTHETIC_AUTH_ENABLED=true`.
- Login sintetis diberi rate limit.
- Fallback sintetis pada jalur tulis (student, tutor, schedule, profile) dibatasi ke mode demo.
- Query murid tidak lagi menyuntikkan data demo (`std-affan`) ke hasil database.

### 1.9. Schema drift
- `types/database.types.ts` diselaraskan untuk `attendance` (hapus `student_program_id`/`material`), `tutor_payments`, dan `tutor_payment_items`.
- Query memakai kolom kanonik (`session_date`, `enrollment_id`, `schedule_students`, `learning_records`).
- Duplikat jalur mutasi dihapus: `features/management/attendance/{actions,components}` lama, `features/tutor/{students,sessions,schedules,payroll}/actions`, dan service attendance duplikat.

---

## 2. P1 — Uang & Data Sensitif

### 2.1. Payroll
- `features/shared/payroll/services/payroll-calculator.service.ts`: hierarki tarif tutor > global per (bimbel_type + level), pemilihan `effective_from` terbaru deterministik, payable `present`/`late`.
- `generatePayrollAction`: idempotensi periode, kolom sesuai migration (`gross_amount/bonus/deduction/net_amount`, item `rate_applied/subtotal/amount`), rollback payment bila insert item gagal, audit.
- Schema `0001`: `EXCLUDE USING gist` (`ex_tutor_rates_no_overlap`) mencegah tarif tumpang tindih; trigger `set_tutor_payment_amounts` menyinkronkan `net_amount`/`total_amount`.

### 2.2. Audit log
- Attendance: audit ditulis dalam transaksi RPC.
- Payroll: audit `PAYROLL_GENERATED/FINALIZED/PAID` dengan before/after.
- Koreksi evaluasi: audit `LEARNING_RECORD_CORRECTED`.

### 2.3. Rate limit & error handling
- Baru: `lib/utils/rate-limit.ts` (sliding window in-memory) dan `lib/utils/request-id.ts` (structured logging + request id).
- Login demo diberi rate limit 10/menit per IP.
- API mengembalikan pesan aman via `getSafeErrorMessage`; error mentah database tidak lagi diteruskan (`programs`, `bimbel-types`, `audit-logs`, `tutor-rates`, dll.).

---

## 3. P2 — UX & Konsistensi

- Form presensi: status awal `unset` (tidak lagi default "hadir"), submit ditolak bila ada murid belum dipilih atau foto belum ada; validasi bypass dihapus.
- Nomor pertemuan pada form tidak lagi memakai hack hardcoded `std-001`; memakai nilai dari data sesi.
- Reguler 60 menit diselaraskan di `supabase/seed.sql` (`bimbel_types`).

---

## 4. P3 — Operasional

- `package.json`: script `typecheck`, `test`, `test:watch`, `ci`.
- Vitest ditambahkan (`vitest.config.ts`) + unit test: `lib/utils/image-validation.test.ts` (10 test) dan `lib/utils/rate-limit.test.ts` (2 test). **12/12 lolos.**
- CI: `.github/workflows/ci.yml` menjalankan install, typecheck, lint, test, build.
- `tsc --noEmit` **lulus tanpa error**.

---

## 5. Yang Masih Tersisa (backlog lanjutan)

1. **Regenerasi tipe resmi:** jalankan `supabase gen types typescript` terhadap database hasil migration `0001` agar `types/database.types.ts` benar-benar sinkron (saat ini diselaraskan manual).
2. **RLS berbasis identitas** (bukan sekadar deny-by-default): petakan Better Auth user → policy database bila ingin pertahanan berlapis selain server authorization.
3. **Rate limit terdistribusi** (Redis/Upstash) untuk deployment multi-instance.
4. **TanStack Table + pagination/filter server-side** pada seluruh daftar kompleks (students, attendance, payroll, dll.). Saat ini students sudah punya pagination server + pencarian multi-kolom; daftar lain masih memuat data terbatas.
5. **Draft presensi offline (PWA/IndexedDB)** dan navigasi pasca-submit tanpa full reload.
6. **Compress/Re-encode gambar** di server (saat ini validasi magic bytes + batas ukuran; re-encode belum).
7. **Test integrasi otorisasi** (401/403/IDOR) dan smoke test migration dari database kosong.
8. **Snapshot peserta sesi** (`session_students`) agar perubahan membership jadwal tidak memengaruhi histori sesi lama.
9. **State machine** session/attendance/reschedule yang formal.

---

## 6. Verifikasi

| Check | Hasil |
|---|---|
| `npx tsc --noEmit` | ✅ Lulus (exit 0) |
| `npx vitest run` | ✅ 12/12 test lolos |
| Migration 0001 (consolidated) | ✅ Ditulis (belum diuji terhadap database instance) |
| ESLint | Jalankan `pnpm lint` (memerlukan review konfigurasi eslint existing) |

**Catatan:** perubahan ini bersifat statis/kode; belum diuji terhadap database Supabase nyata (tidak ada instance tersedia pada sesi ini). Terapkan migration `0001` pada database bersih, lalu jalankan smoke test.

---

## 7. Penghapusan Total Data Sintetis (28 September 2026)

Seluruh fallback dan identitas sintetis dihapus. Sistem kini **hanya** memakai data nyata (Better Auth + Supabase PostgreSQL).

### 7.1. Autentikasi
- **Dihapus:** `app/api/v1/auth/login/route.ts` (login demo tanpa password) dan fungsi `loginWithSyntheticUser`/`logoutSyntheticUser` di `features/auth/actions/auth.actions.ts`.
- **Login satu-satunya:** Better Auth `authClient.signIn.email` (`app/api/auth/[...all]`). Halaman login `features/auth/components/LoginPage.tsx` kini hanya form email + kata sandi (tanpa tab demo).
- `lib/auth/session.ts` fail-closed; tidak ada lagi `SYNTHETIC_USERS`/`DEFAULT_SYNTHETIC_USER`/cookie `synthetic_user_id`.
- `middleware.ts` hanya memvalidasi keberadaan sesi Better Auth; cookie identitas sintetis dihapus.
- `app/api/v1/auth/logout/route.ts` memakai `auth.api.signOut`.
- `components/shared/user-nav.tsx` memakai sesi nyata + `authClient.signOut`.
- `config/app.ts`: `isSyntheticAuthEnabled()` dihapus; `.env.example` tidak lagi memuat `SYNTHETIC_AUTH_ENABLED`.

### 7.2. File data sintetis yang dihapus
`data/users.ts`, `data/tutors.ts`, `data/students.ts`, `data/sessions.ts`, `data/schedules.ts`, `data/roles.ts`, `data/programs.ts`, `data/payroll.ts`, `data/attendance.ts`, `data/bimbel-types.ts`, `data/subjects.ts`, dan barrel `data/index.ts`. Folder `data/landing/*` dipertahankan karena merupakan konten landing page nyata (bukan fallback data sistem).

### 7.3. Query & service yang dibersihkan
Semua fallback sintetis dihapus dari: `features/management/{students,tutors,schedules,sessions,subjects,settings/queries}` , `features/tutor/{students,sessions}`, `features/shared/students/services/student-progress.service.ts`, `features/management/tutors/actions`, `features/management/students/actions`, `features/management/schedules/actions`, `features/management/settings/actions/{role,settings}.actions.ts`, `features/management/subjects/actions`, `components/management/ManagementSidebar.tsx`, `features/management/dashboard/components/ManagementDashboardPage.tsx`, dan `features/tutor/dashboard/components/TutorDashboardPage.tsx` (kini menerima `sessions`/`schedules` nyata dari server).

### 7.4. Tipe database
`types/database.types.ts` ditambah tabel `subjects`, `curriculum_topics`, `roles`, `permissions`, dan `role_permissions` agar query bertipe nyata.

### 7.5. Dampak operasional (PENTING)
- **Wajib provisioning akun nyata.** Karena tidak ada lagi login sintetis, akun management/tutor harus dibuat melalui Better Auth (mis. `supabase/seed-auth.ts/js` atau undangan) sebelum login.
- **`tutorId` wajib terpetakan.** Endpoint `/api/v1/tutor/*` dan dashboard tutor fail-closed bila profil tutor tidak terhubung ke user.
- Bila database kosong, halaman menampilkan data kosong (bukan data demo).

### 7.6. Runbook Setup Database (Migrasi + Seed)

Migration di-consolidate menjadi satu file: `supabase/migrations/0001_initial_schema.sql` (sudah memuat hardening).

**A. Database baru (fresh):**
1. Jalankan migration `supabase/migrations/0001_initial_schema.sql`.
2. Seed master data + akun dev: `supabase/seed.sql` (roles/permissions, bimbel_types, packages, 37 murid, 11 tutor, enrollments, schedules, contoh sesi, serta akun + profil + tutor).
3. Login memakai akun hasil seed (mis. `admin@mentorbelajarku.com` / `manajemen123`).

**B. Drop & migrate ulang (kasus Anda):**
- Drop database/schema lama, lalu jalankan `0001` + `seed.sql` dari nol. Tidak ada lagi migration `0002`.

**C. Ingin password ter-hash (disarankan untuk produksi):**
- Jangan andalkan akun plaintext di `seed.sql`. Jalankan `npx tsx supabase/seed-auth.ts` setelah server berjalan; script itu mendaftarkan akun via Better Auth (password di-hash) **dan** memprovision `user.role`, `user.role_id`, `profiles`, serta `tutors` (butuh `DATABASE_URL`).

**Catatan seed `seed.sql`:** menjalankan ulang file ini akan `TRUNCATE` tabel operasional (attendance, learning_records, sessions, schedule_students, schedules, enrollments) — aman untuk development, **hindari di produksi**.

**Troubleshooting — `ex_tutor_rates_no_overlap` gagal (kode 23P01):**
Hanya relevan pada database lama yang sudah punya duplikat `tutor_rates` (seed dijalankan sebelum constraint ada). Karena Anda melakukan drop & migrate ulang, masalah ini tidak akan muncul. Jika tetap perlu membersihkan manual:

```sql
-- Cek duplikat
SELECT tutor_id, bimbel_type_id, level, effective_from, COUNT(*)
FROM tutor_rates
GROUP BY 1,2,3,4
HAVING COUNT(*) > 1;

-- Hapus duplikat, simpan yang paling awal
DELETE FROM tutor_rates t
USING tutor_rates keep
WHERE t.id <> keep.id
  AND COALESCE(t.tutor_id, '00000000-0000-0000-0000-000000000000'::uuid)
      = COALESCE(keep.tutor_id, '00000000-0000-0000-0000-000000000000'::uuid)
  AND t.bimbel_type_id = keep.bimbel_type_id
  AND t.level = keep.level
  AND t.effective_from = keep.effective_from
  AND (t.created_at, t.id) > (keep.created_at, keep.id);
```

