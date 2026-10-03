# Project Review — Mentor Belajarku
**Tanggal review:** 28 September 2026
**Cakupan:** source code, migration, seed, route handler, server action, autentikasi, otorisasi, alur bisnis, struktur folder, dan dokumen yang sudah ada.
**Metode:** review statis. Tidak mengakses database produksi, environment Supabase terdeploy, atau akun user nyata.
**Catatan:** tinjauan ini melengkapi `docs/SECURITY_AND_FLOW_AUDIT.md` (bertanggal 2026-09-18), `docs/DEVELOPMENT_STATUS_AND_RECOMMENDATIONS.md`, `docs/DYNAMIC_RBAC_IMPLEMENTATION_PLAN.md`, `docs/PRD.md`, `docs/DESIGN.md`, dan `docs/BUSINESS_RULES.md`. Dokumen-dokumen tersebut tidak diubah pada review ini; status temuan baru ditandai **tetap berlaku**, **berubah sebagian**, atau **perlu verifikasi**.

---

## 1. Kesimpulan Utama

Sistem telah memiliki fondasi yang solid: pemisahan `schedule / session / attendance`, pemakaian Zod dan permission helper, dynamic RBAC di database, serta management UI yang cukup lengkap. Namun hasil review statis menunjukkan bahwa:

1. Beberapa Server Action dan Route Handler mempercayai identitas yang dikirim client atau tidak memasang guard autentikasi/otorisasi sama sekali.
2. Migration schema kanonik (`supabase/migrations/0001_initial_schema.sql`) tidak konsisten dengan query di kode aplikasi (kolom/relasi berbeda, pemakaian `student_program_id`/`actual_date`/`class_group_id`/bentuk `tutor_payment_items` yang berbeda).
3. Transaksi attendance dan payroll belum atomik; sebagian kegagalan disimpan sebagai warning dan UI dapat menyatakan “berhasil” walau database tidak ter-update.
4. Payroll masih menerima attendance `present/late` tanpa memastikan `verification_status` yang disetujui, dan tarif dapat lolos karena fallback tarif global (tanpa proteksi overlap di database).
5. Mode demo/sintetis masih aktif di sebagian besar jalur: cookie sintetis dipakai oleh middleware dan `getCurrentUser()`, login sintetis (tanpa password) tetap ekspos via `GET/POST /api/v1/auth/login` dan `loginWithSyntheticUser`. Gate berbasis flag (`isSyntheticAuthEnabled`) mengurangi, tidak menghilangkan, risiko.
6. RLS sudah diaktifkan, tetapi policy `USING (true) WITH CHECK (true)` untuk seluruh tabel membuatnya tidak efektif sebagai pertahanan isolasi data.
7. Repository belum memiliki automated test (`*.spec.ts`, `*.test.tsx` tidak ditemukan), tidak ada script `typecheck`/`test`/`ci` di `package.json`, sehingga sulit menjaga kualitas saat iterasi.

Prioritas perbaikan difokuskan pada **P0 akses & integritas data**, **P1 konsistensi transaksi**, **P2 stabilitas alur produk**, dan **P3 maintainability & operasi**.

---

## 2. Temuan Prioritas

### 2.1. Server Action mempercayai `currentUser` yang dikirim dari browser

**Bukti:**
- `features/tutor/attendance/actions/attendance.actions.ts:31–42` — `submitSessionAttendance(input, currentUser)` hanya memeriksa `currentUser?.id`.
- `features/management/attendance/actions/attendance.actions.ts:25–37` — pola identik untuk aksi Management.
- `features/tutor/sessions/actions/session.actions.ts:6` — `updateSessionStatus` tanpa `requireAuthUser`.
- `features/management/tutors/actions/tutor.actions.ts:43–58` — `promoteTutorToManagement` memakai `getCurrentUser()` di dalam aksi, tetapi sibling actions lain tidak.

**Dampak:** identitas role dan `tutorId` dikirim dari form/browser. Server Action dieksekusi langsung oleh Next.js; penyerang dapat mengeksekusi seolah-olah ia adalah user lain.

**Rekomendasi:** Server Action wajib memanggil `requireAuthUser()`/`checkPermission()` di awal; `currentUser` tidak boleh diterima sebagai parameter. Status role/tutor diverifikasi ulang di query yang membatasi baris (`eq('tutor_id', session.tutorId)`).

---

### 2.2. Route Handler tanpa guard atau guard tidak konsisten

**Bukti (tanpa `requireAuthUser`/`requirePermissionApi`):**
- `app/api/v1/management/bimbel-types/route.ts` (GET tanpa guard).
- `app/api/v1/management/programs/route.ts` (GET tanpa guard).
- `app/api/v1/management/sessions/[sessionId]/students/route.ts` (GET tanpa guard; juga query kolom `class_group_id` yang tidak ada di migration).
- `app/api/v1/management/students/route.ts` (GET tanpa guard; hanya POST yang memanggil `getAuthUser`).
- `app/api/v1/management/students/[studentId]/enrollments/route.ts` (GET tanpa guard).
- `app/api/v1/management/students/[studentId]/schedules/route.ts` (GET tanpa guard).
- `app/api/v1/management/tutors/[tutorId]/students/route.ts` (GET tanpa guard).
- `app/api/v1/management/tutors/[tutorId]/schedules/route.ts` (GET tanpa guard).
- `app/api/v1/management/schedules/[scheduleId]/sessions/route.ts` (GET tanpa guard).
- `app/api/v1/management/sessions/[sessionId]/attendance/route.ts` (GET tanpa guard).
- `app/api/v1/management/enrollments/[enrollmentId]/route.ts` (GET tanpa guard).
- `app/api/v1/management/enrollments/route.ts` (GET tanpa guard).
- `app/api/v1/management/sessions/generate/route.ts` (GET tanpa guard, padahal memicu generator sesi).
- `app/api/v1/management/attendance/route.ts` (GET tanpa guard; hanya `POST` melakukan `getAuthUser`).
- `app/api/v1/auth/session/route.ts` (GET tanpa guard—`getAuthUser` mengembalikan null tanpa proteksi route).

**Guard ada, tetapi longgar:**
- `app/api/v1/tutor/attendance/route.ts:6–9` hanya memeriksa `user.role === 'tutor' || 'management'`, lalu akses tidak dibatasi ke tutor aktif.
- `app/api/v1/tutor/sessions/[sessionId]/route.ts:9–12` pola sama.
- `app/api/v1/tutor/students/route.ts:7–21` query jadwal tanpa filter `tutorId` bila `tutorId` kosong (`if (tutorId) { query = query.eq('tutor_id', tutorId); }`).

**Dampak:** informasi murid, jadwal, sesi, dan enrollment dapat dibaca oleh siapa saja yang berhasil menambahkan cookie sesi.

**Rekomendasi:** middleware hanya sebagai lapisan pertama. Setiap Route Handler/Server Action wajib memanggil `requireAuthUser()` lalu `requirePermissionApi(permission)` dan, untuk sumber daya milik tutor, membatasi `WHERE tutor_id = session.tutorId`. Jika `tutorId` kosong, **fail closed**.

---

### 2.3. Schema drift antara migration dan kode aplikasi

**Bukti dari kode:**
- Aksi attendance menulis `student_program_id` (`features/tutor/attendance/actions/attendance.actions.ts:175–181`) dan `attendance.material`; migration mendefinisikan `attendance.enrollment_id` (`0001_initial_schema.sql:397–415`) dan materi di tabel `learning_records`.
- `submitSessionAttendance` menerima `allowTimeBypass` dari client (`features/shared/attendance/schemas/attendance.schema.ts:16–21`).
- Route handler memilih kolom `sessions.actual_date`, `schedules.student_id` (`app/api/v1/tutor/sessions/[sessionId]/route.ts:19`), `sessions.class_group_id` (`app/api/v1/management/sessions/[sessionId]/students/route.ts:13–22`) — kolom tersebut tidak ada di migration `0001_initial_schema.sql:342–391`.
- Aksi payroll menulis `gross_amount/bonus/deduction/net_amount` ke `tutor_payments` (`features/management/payroll/actions/payroll.actions.ts:30–42`) dan item `tutor_payment_id/session_id/student_id/bimbel_type_id/rate/quantity/amount` (`payroll.actions.ts:50–60`). Migration mendefinisikan `total_sessions/total_students_attended/total_amount` dan `tutor_payment_items` dengan kolom `payable_students_count/rate_applied/subtotal/session_date/notes` (`0001_initial_schema.sql:486–516`).
- Banyak view/relasi yang digunakan seperti `student_programs` adalah VIEW kompatibilitas (`0001_initial_schema.sql:323–336`). UI mengandalkan `student.student_programs` padahal data aslinya ada di `enrollments` (`features/management/students/components/StudentListPage.tsx:174`).
- `subjects.status` dideklarasikan `VARCHAR(20)` di migration (`0001_initial_schema.sql:235–243`) tanpa enum, tetapi UI memfilter dengan nilai tetap `active/inactive`.
- `tutor_status` ENUM hanya berisi `active/inactive` (`0001_initial_schema.sql:30–32`), sedangkan kode menampilkan opsi `graduated`/`inactive`/lainnya.

**Dampak:** runtime error, data tidak tersimpan, atau silently hilang. Laporan dan kalkulasi payroll menjadi tidak valid.

**Rekomendasi:** tetapkan migration sebagai acuan; perbarui query/typed `Database`; hapus kolom lama di UI; dan gagal build saat TypeScript mendeteksi drift.

---

### 2.4. Transaksi attendance tidak atomik & bypass dari client

**Bukti:**
- `submitSessionAttendance` melakukan upload foto, upsert attendance, upsert learning record, dan insert audit per murid dalam loop; setiap baris dibungkus `try/catch` yang hanya `console.warn` lalu lanjut (`features/tutor/attendance/actions/attendance.actions.ts:165–221`).
- Setelah loop, kode `update('sessions', { status: 'completed' })` dieksekusi terpisah, juga dalam `try` kosong (`features/tutor/attendance/actions/attendance.actions.ts:245–259`).
- Skema input menerima `allowTimeBypass` (`features/shared/attendance/schemas/attendance.schema.ts:16–21`) dan form mengaktifkannya secara default (`features/tutor/attendance/components/AttendanceForm.tsx:127`). Jendela waktu presensi dapat dilewati tanpa alasan tercatat.
- Foto diproses dengan percaya pada prefix data-URL; ukuran buffer dicek setelah decode (`features/tutor/attendance/actions/attendance.actions.ts:129–142`). MIME dapat dipalsukan.
- Upload yang gagal (`uploadErr`) tetap dapat menghasilkan `photo_path` palsu (`features/tutor/attendance/actions/attendance.actions.ts:152–160`).

**Dampak:** UI menampilkan “berhasil” walau database tidak ter-update; histori materi, foto, dan status session tidak konsisten; serta bypass window memungkinkan absensi backdate sembarang.

**Rekomendasi:** pindahkan seluruh alur ke RPC/transaction PostgreSQL: validasi tutor→session, keanggotaan session-student, enrollment valid, duplikat, dan update session `completed` dalam satu atomic. Hapus `allowTimeBypass` dari input publik; sediakan operasi Manajemen terpisah yang memerlukan alasan dan audit. Validasi foto: periksa magic bytes, batas ukuran pre-decode, dan re-encode sebelum disimpan.

---

### 2.5. Payroll belum konsisten dengan aturan verifikasi & migration

**Bukti:**
- `PayrollCalculatorService.calculateTutorPayroll` menerima attendance `present/late` tanpa memfilter `verification_status` (`features/shared/payroll/services/payroll-calculator.service.ts:48–55,107–123`).
- Tidak ada verifikasi bahwa enrollment attendance masih aktif atau bahwa session bukan `cancelled/rescheduled`.
- Generator tarif memakai `Array.find` pertama yang cocok, rentan terhadap urutan hasil query (`features/shared/payroll/services/payroll-calculator.service.ts:76–96`).
- Migration `tutor_rates` hanya memiliki unique index untuk tarif global (`bimbel_type_id, level, effective_from`) ketika `tutor_id IS NULL` (`0001_initial_schema.sql:463–465`); tarif tutor-spesifik tidak memiliki proteksi overlap.
- `generatePayrollAction` melakukan insert `tutor_payments` lalu insert `tutor_payment_items` secara terpisah tanpa transaksi; error pada insert item tidak digulung (`features/management/payroll/actions/payroll.actions.ts:29–61`).
- Skema item di kode (`rate/quantity/amount`) tidak sesuai dengan migration (`rate_applied/subtotal`).
- Total payroll dihitung dari `grossAmount + bonus - deduction` di kode tanpa computed column atau check constraint yang mengikat `tutor_payments.total_amount` ke item (`0001_initial_schema.sql:486–516`).

**Dampak:** nilai honor dapat melenceng, pembayaran ganda saat re-generate, dan audit trail tidak kuat.

**Rekomendasi:** gabungkan insert ke RPC transaksional; verifikasi attendance `verified` (atau kebijakan yang disetujui Management); kunci periode payroll saat `processed/paid`; tambahkan `EXCLUDE USING gist` untuk mencegah overlap tarif pada scope yang sama; dan hitung `total_amount` dari item (generated column atau trigger).

---

### 2.6. Mode demo/sintetis masih aktif di jalur produksi

**Bukti:**
- `app/api/v1/auth/login/route.ts` tetap ekspos login sintetis tanpa password via GET/POST, dengan guard `isSyntheticAuthEnabled()` saja.
- `features/auth/actions/auth.actions.ts` (`loginWithSyntheticUser`) membuat cookie sintetis dan dianggap sah.
- `middleware.ts:30–44` menerima cookie sintetis sebagai bukti login; `getCurrentUser()` melakukan fallback sintetis (`lib/auth/session.ts:127–194`).
- `app/api/v1/tutor/students/route.ts:14–21` filter tutor hanya `if (tutorId) { ... }`; jika cookie sintetis tidak membawa `tutorId` valid, query tanpa filter.
- Aksi attendance/management menulis `recordSyntheticAttendance` di memori setelah mencoba database (`features/tutor/attendance/actions/attendance.actions.ts:223–241`), sehingga hasil dapat berbeda dari DB.

**Dampak:** ketika flag diaktifkan di production (atau tidak sengaja lewat), autentikasi tidak valid dan data produksi dapat tercampur dengan data sintetis.

**Rekomendasi:** kunci mode demo dengan flag build-time (`NEXT_PUBLIC_DEMO_MODE` atau `SYNTHETIC_AUTH_ENABLED`) yang default nonaktif; hentikan pembuatan record sintetis di jalur produksi; middleware hanya menerima sesi Better Auth; demo mode harus di-build terpisah.

---

### 2.7. RLS dan storage belum memberi isolasi efektif

**Bukti:**
- Migration `0001_initial_schema.sql:771–795` mengaktifkan RLS, lalu membuat policy `USING (true) WITH CHECK (true)` untuk seluruh tabel.
- Server client memilih `SUPABASE_SERVICE_ROLE_KEY` terlebih dahulu (`lib/supabase/server.ts:7–17, 34–49`), sehingga RLS otomatis terlewati.
- `lib/storage/index.ts` menandatangani path yang diberikan client (`features/tutor/attendance/actions/attendance.actions.ts:344–354`), tanpa memverifikasi akses terhadap attendance/session.
- Tidak ditemukan migration storage policy; dokumentasi menyebut bucket `attendance`/`attendance-photos` secara bergantian.

**Dampak:** akses data lintas tenant/role bergantung pada bug aplikasi, bukan pada pertahanan database; foto siswa dapat diakses siapa pun yang mengetahui path.

**Rekomendasi:** ganti policy menyeluruh menjadi policy berbasis identitas Better Auth (mis. klaim `role`/claim `tutorId` di JWT atau kolom `auth.user_id()` yang dipetakan). Pertahankan service-role hanya di modul admin terisolasi (untuk konsolidasi/cleanup) dengan audit yang ketat. Tambah migration bucket + storage policy; signed URL hanya untuk attendance yang lolos authorization.

---

### 2.8. Field tidak konsisten dengan aturan bisnis dan dokumen

**Bukti:**
- `features/tutor/attendance/components/AttendanceForm.tsx:141–165` memilih `defaultMaxMeetings` berdasarkan substring `intensif` (12) atau default 8, sementara `bimbel_packages.max_meetings` di migration adalah configurable per paket (`0001_initial_schema.sql:268–280`).
- `nextMeetingNumber` dihitung dari `student_id === 'std-001' ? 3 : ...` (hardcoded fallback, `AttendanceForm.tsx:147`), padahal harus dihitung dari data attendance/enrollment riil.
- `data/students.ts` masih memakai struktur lama (bukan `enrollments`), sehingga `getStudentsPaginated` memetakan `student_programs` ke `enrollments` (`features/management/students/queries/student.queries.ts:60–68`).
- Bimbel type default `Reguler 75m` di `features/management/students/queries/student.queries.ts:111`, sedangkan `docs/BUSINESS_RULES.md` menyatakan Reguler 60 menit.
- `attendance.material` masih dipakai di UI dan list (`features/management/attendance/components/AttendanceListPage.tsx:248–253`), padahal migration memindahkannya ke `learning_records`.

**Dampak:** data “design-intent” (durasi paket, nomor pertemuan, materi) berbeda dari sumber otoritatif.

**Rekomendasi:** gunakan `bimbel_packages.max_meetings`/`bimbel_types.duration_minutes` sebagai sumber; hitung `nextMeetingNumber` dari query agregat; hapus `material` dari `attendance`; konsistenkan durasi default (perlu keputusan Manajemen untuk Reguler 60 vs 75).

---

### 2.9. UX/UI konsisten dengan aturan proyek

**Bukti:**
- Banyak halaman daftar memakai tabel HTML manual (mis. `features/management/students/components/StudentListPage.tsx:160–301`, `features/management/attendance/components/AttendanceListPage.tsx:200–302`, `features/management/payroll/components/PayrollListPage.tsx:33–84`), sementara aturan di `AGENTS.md`/`docs/DESIGN.md` menentukan TanStack Table untuk data kompleks.
- `AttendanceListPage` mencari/filter di client dari data yang sudah dimuat, dengan batas `limit(100)` di query (`features/management/attendance/queries/attendance.queries.ts:68–86`) — pencarian tidak akan menemukan record di luar halaman pertama.
- `AttendanceForm.tsx` 923 baris sebagai Client Component tunggal; menggabungkan wizard, kamera, foto, materi, dan submit.
- Status default kehadiran adalah `present` (`AttendanceForm.tsx:159`); kombinasi dengan “Tandai Semua Hadir” berpotensi menciptakan presensi keliru bila tutor tidak cermat.
- Alur submit menggunakan `window.location.href` (full reload) — tidak ideal untuk transisi state.

**Rekomendasi:** adopsi TanStack Table di semua daftar kompleks, paging/filter server-side, empty/loading/error state konsisten; pecah `AttendanceForm` per tahap dengan status penyimpanan; sediakan draft lokal untuk jaringan tidak stabil; nonaktifkan default “Hadir” tanpa konfirmasi; gunakan `router.refresh()` setelah mutasi, bukan full reload.

---

### 2.10. Tidak ada test atau pipeline CI

**Bukti:** `package.json` hanya memuat `dev/build/start/lint`. Tidak ada script `typecheck`, `test`, `e2e`, `db:smoke`, atau workflow CI di `.github/`. Pencarian `*.test.ts*`/`*.spec.ts*` tidak menemukan file.

**Dampak:** regresi diotorisasi dan payroll tidak terdeteksi otomatis.

**Rekomendasi:** tambahkan `tsc --noEmit`, `eslint`, `vitest`/`jest` untuk unit & integration test (termasuk IDOR, payroll, session generator), Playwright untuk E2E utama, dan CI pipeline (GitHub Actions) yang menjalankan lint/typecheck/test/migrations smoke sebelum merge.

---

## 3. Rekomendasi Per Aspek

### 3.1. Flow sistem

- Tetapkan satu alur eksplisit: enrollment → schedule → generate session → peserta snapshot → attendance → verifikasi/koreksi → payroll draft → review → finalize → paid.
- Snapshot peserta session (`session_students`) sehingga perubahan jadwal/membership tidak merusak histori.
- State machine untuk session (`scheduled/completed/cancelled/rescheduled`) dan attendance (`submitted/verified/correction_requested`) dengan transisi yang diotorisasi.
- Akun tutor dibuat via invitation atau password sementara; `must_change_password` ditegakkan di middleware sebelum akses fitur sensitif.
- Reschedule mempertahankan sesi awal + referensi ke sesi pengganti.

### 3.2. UX/UI

- Form presensi: status default netral, kamera opsional/wajib sesuai kebijakan final, simpan draft ke IndexedDB saat offline, retry otomatis saat online.
- Standarkan daftar dengan TanStack Table (sorting, pagination, kolom dapat disembunyikan, aksesibilitas kontrol).
- Tampilkan status verifikator + tombol “koreksi” dengan alasan; tombol “Verifikasi” hanya muncul bila policy terpenuhi.
- Tampilkan versi paket, sisa pertemuan, dan warning “pertemuan ke-X” yang diambil dari database, bukan hardcoded.
- Tambah halaman “Settings > Attendance Window” yang sudah ada di menu tetapi gunakan untuk konsistensi pesan di UI presensi (`/management/settings/attendance-window`).
- Perbaiki navigasi pasca-submit (jangan full reload).

### 3.3. Keamanan

- Guard统一: setiap Route Handler/Server Action memanggil `requireAuthUser()` + `checkPermission()`/`requirePermissionApi()`, lalu filter baris dengan `tutor_id = session.tutorId` untuk tutor.
- Batasi payload & foto: ukuran maksimum, MIME, magic bytes, decode + re-encode; tolak jika gagal.
- Rate limit pada login, upload, generate payroll, endpoint mahal.
- Hapus `allowTimeBypass` dari input publik; sediakan operasi “force approve” terpisah dengan alasan dan audit.
- Cookie: set `httpOnly`, `secure` di production, `sameSite=lax/strict`; hindari `last_visited_path` yang dapat dimanipulasi client.
- Tambah structured logging + request ID; petakan error domain ke pesan aman.

### 3.4. Database

- Tetapkan migration kanonik, regenerate tipe `Database`, hapus kolom/relasi lama dari kode, tolak build bila drift.
- Tambah `EXCLUDE USING gist` untuk mencegah overlap `tutor_rates` (perlu `btree_gist`).
- Unique constraint `UNIQUE(schedule_id, session_date)` di `sessions` agar generator tidak duplikat.
- Cross-table check via trigger/RPC: enrollment milik student yang hadir, student adalah peserta session, tutor session konsisten dengan schedule.
- Lock `tutor_payments.status` setelah `paid` kecuali lewat alur koreksi teraudit.
- Tambah `generated column`/`trigger` agar `tutor_payments.total_amount = SUM(items.subtotal)`.

### 3.5. Query & performa

- Pagination server-side dengan batas `pageSize`, total akurat, pencarian multi-kolom (name, student_code, school) + indeks yang sesuai.
- Hindari `select('*')`; proyeksikan field yang dipakai (terutama `sessions` + relasi).
- Tentukan timezone `Asia/Jakarta` di seluruh query yang membandingkan tanggal/jam.
- Generator sesi: gunakan RPC transaksional dengan idempotency key.

### 3.6. Struktur kode & folder

- Satukan duplikasi domain (ada dua `attendance.actions.ts` dengan aturan berbeda).
- Pilih satu jalur mutation per operasi (Server Action vs Route Handler).
- Hapus `any`/cast; gunakan `Database` types.
- Konvensi path: codebase di root (bukan `src/`); sinkronkan `docs/DESIGN.md` & `docs/PRD.md`.
- Modularisasi: pisahkan data-access, domain service, authorization helper, dan DTO.

### 3.7. Testing & operasional

- Test IDOR lintas tutor (sebelum & sesudah perbaikan).
- Test Server Action menolak `currentUser` palsu.
- Test route tanpa auth → 401; tutor lain → 403.
- Test payroll: tarif historis, attendance verified only, tidak double-generate.
- CI: typecheck, lint, unit/integration, migration dari DB kosong, audit dependency, secret scan.

---

## 4. Status Dokumen Lama

| Dokumen | Status | Catatan |
|---|---|---|
| `docs/SECURITY_AND_FLOW_AUDIT.md` (2026-09-18) | **Tetap berlaku**, sebagian berubah | C-01 (login sintetis) masih ada di balik flag; C-02 (cookie) sebagian dimitigasi via `isSyntheticAuthEnabled`; C-03 (RLS/service-role) masih berlaku; C-04 (IDOR tutor) masih berlaku; H-02/H-03/H-04 (bypass, transaksi, foto) masih berlaku; H-05/H-06/H-07 (error raw, CSRF, rate limit) masih berlaku. |
| `docs/DEVELOPMENT_STATUS_AND_RECOMMENDATIONS.md` | **Perlu verifikasi** | Beberapa modul ditandai “Selesai” tanpa bukti verifikasi. Status RL/UI/keamanan perlu diperbarui berdasarkan bukti repo. |
| `docs/DYNAMIC_RBAC_IMPLEMENTATION_PLAN.md` | **Berubah sebagian** | Fase 0–5 + C-02 sudah diimplementasikan di kode (lihat `lib/auth/session.ts`, `lib/auth/guards.ts`, `features/management/settings/actions/*`). Namun cakupan enforcement belum menyeluruh; permission masih hardcoded di beberapa route. |
| `docs/PRD.md` | **Perlu verifikasi** | Struktur `src/` tidak sesuai codebase. Status & rencana perlu diselaraskan dengan bukti repo. |
| `docs/DESIGN.md` | **Perlu verifikasi** | Banyak detail schema tidak lagi sesuai migration (profiles.role, schedules.student_id, payroll model). |
| `docs/BUSINESS_RULES.md` | **Perlu verifikasi** | Aturan paket/nomor pertemuan/durasi default belum final; jangan dijadikan acuan implementasi hingga disahkan Manajemen. |

---

## 5. Keputusan Bisnis yang Belum Boleh Ditebak

Implementasi berikut masih menunggu keputusan Management dan **tidak boleh diisi asumsi** oleh agent:

1. Apakah payroll wajib mensyaratkan attendance `verification_status = 'verified'` atau status lain.
2. Apakah `late` dianggap payable dan apakah mengurangi jatah paket.
3. Apakah `sick` diperlakukan sama dengan `permission` untuk enrollment dan honor.
4. Apakah tarif di-scope per tutor atau cukup global (per bimbel_type/level); bagaimana hierarki prioritasnya.
5. Apakah sesi `late_upload` wajib disertai alasan tertentu yang diaudit.
6. Apakah foto presensi wajib atau opsional, dan berapa lama retensi yang diizinkan.
7. Apakah terdapat threshold absensi yang menjadi dasar notifikasi ke Manajemen/wali.
8. Apakah durasi default Reguler 60 atau 75 menit (dokumen & seed tidak seragam).
9. Apakah izin otomatis membuat sesi pengganti dan apakah sesi pengganti mengurangi paket.
10. Apakah koreksi attendance setelah `payroll.processed/paid` memerlukan workflow approval terpisah.

---

## 6. Acceptance Criteria (minimum untuk agent berikutnya)

- Permintaan tanpa autentikasi ke setiap halaman/API privat menghasilkan redirect/401.
- Seorang tutor **tidak dapat** membaca/memutasi session, attendance, student, foto, atau payroll tutor lain (test IDOR otomatis).
- Permission role dinamis ditegakkan di setiap endpoint sensitif (`requirePermissionApi`/`checkPermission`).
- Mode demo/sintetis tidak menulis ke database produksi; flag build-time default nonaktif.
- Attendance tidak dapat mem-bypass jendela waktu dari input client.
- Attendance untuk student yang tidak terkait pada session ditolak; enrollment yang tidak cocok ditolak.
- Kegagalan database tidak pernah mengembalikan sukses attendance, dan tidak pernah menandai session `completed` secara terpisah dari atomic utama.
- Payroll mensyaratkan attendance tervalidasi dan tarif historis tunggal per scope; periode tarif yang overlap ditolak oleh database.
- Upload foto memvalidasi MIME, magic bytes, ukuran pre-decode; signed URL hanya dibuat setelah otorisasi attendance.
- Setiap mutasi sensitif menghasilkan audit log dengan actor, before/after, timestamp, dan correlation ID; insert audit dalam transaksi yang sama.
- Migration tunggal yang diterapkan dari nol menghasilkan `supabase gen types typescript` tanpa drift; build TypeScript gagal bila ada drift.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, dan CI hijau.

---

## 7. Lampiran — Peta Bukti (ringkas)

- Server Action identity: `features/tutor/attendance/actions/attendance.actions.ts:31–42`; `features/management/attendance/actions/attendance.actions.ts:25–37`.
- Route tanpa guard: lihat daftar di §2.2.
- Schema drift: `features/tutor/attendance/actions/attendance.actions.ts:175–181`; `features/management/payroll/actions/payroll.actions.ts:30–60`; `app/api/v1/tutor/sessions/[sessionId]/route.ts:19`; `app/api/v1/management/sessions/[sessionId]/students/route.ts:13–22`; `supabase/migrations/0001_initial_schema.sql:342–516`.
- Bypass & non-atomic: `features/tutor/attendance/actions/attendance.actions.ts:165–259`; `features/shared/attendance/schemas/attendance.schema.ts:16–21`; `features/tutor/attendance/components/AttendanceForm.tsx:127`.
- Payroll: `features/shared/payroll/services/payroll-calculator.service.ts:48–123`; `features/management/payroll/actions/payroll.actions.ts:9–65`.
- Sintetis: `app/api/v1/auth/login/route.ts`; `features/auth/actions/auth.actions.ts:71–139`; `middleware.ts:30–44`; `lib/auth/session.ts:127–194`.
- RLS/Storage: `supabase/migrations/0001_initial_schema.sql:771–795`; `lib/supabase/server.ts:7–49`; `lib/storage/index.ts`; `features/tutor/attendance/actions/attendance.actions.ts:344–354`.

---

**Dokumen ini dihasilkan sebagai catatan review statis tertanggal 2026-09-28. Pembaruan kode/dokumen lain menyusul setelah keputusan P0 dan klarifikasi bisnis di §5.**
