# BUSINESS_RULES.md — Aturan Bisnis Sistem Bimbel & Presensi

Dokumen ini mendefinisikan seluruh aturan bisnis (*business rules*), invariant data, dan kebijakan perhitungan untuk sistem bimbingan belajar **Mentorbelajarku**.

Dokumen ini diselaraskan dengan kondisi implementasi saat ini:

* Schema: `supabase/migrations/0001_initial_schema.sql` … `0004_meeting_number_per_student.sql`
* Master data & akun: `supabase/seed.sql`
* Otorisasi: `lib/auth/session.ts`, `lib/auth/guards.ts`, `config/permissions.ts`, `lib/permissions/resolver.ts`
* Keputusan bisnis terkunci: §18 (dikonfirmasi 28 September 2026)

Jika terjadi konflik antara dokumen ini dengan `AGENTS.md`, aturan di `AGENTS.md` (engineering) berlaku untuk implementasi, sedangkan dokumen ini menjadi acuan domain/bisnis. Ketidakjelasan baru wajib diklarifikasi ke Management sebelum diasumsikan permanen.

---

## 1. Aktor, Peran, & Otorisasi

### 1.1. Role Portal (untuk routing)

Portal aplikasi hanya mengenal role portal berikut (`types/database.types.ts` → `UserRole`):

```text
management   # portal manajemen (default untuk owner/curriculum/hrd)
tutor        # portal pengajar
admin        # administrator operasional (portal tersendiri, area manajemen)
finance      # dipetakan ke portal management
```

Pemetaan nama role dinamis → role portal: `tutor` → `tutor`; `finance` → `management`; `owner`/`curriculum`/`hrd`/`management` → `management`; `admin` → `admin` (`lib/permissions/resolver.ts`).

Role portal hanya menentukan portal/routing, **bukan** hak akses granular.

### 1.2. RBAC Dinamis (source of truth hak akses)

Hak akses bersifat **dinamis** dan tersimpan di database:

```text
roles
permissions
role_permissions
user.role        # string kompatibel Better Auth & portal
user.role_id     # FK ke roles (otoritatif untuk permission)
```

Role bawaan (`owner`, `tutor`) ber-`is_system = true` dan tidak boleh dihapus. Owner/Pimpinan dapat menambah role baru (mis. `curriculum`, `hrd`, `finance`, `admin`) dan mengatur permission-nya dari UI Pengaturan.

Permission efektif pengguna = hasil query `role_permissions` untuk `user.role_id`; bila kosong, fallback ke pemetaan statis `config/permissions.ts`. Resolusi ini dibawa di session (`permissions[]`, `roleName`, `roleId`).

### 1.3. Otorisasi Server (wajib)

* UI hiding dan `middleware.ts` **bukan** batas keamanan. `middleware.ts` hanya memeriksa keberadaan sesi Better Auth.
* Setiap Server Component, Server Action, dan Route Handler sensitif wajib memanggil guard:
  * `requireAuthUser()` — wajib login.
  * `requirePermissionUser(permission)` — redirect bila permission kurang.
  * `checkPermission(permission)` — untuk Server Action (mengembalikan `{ allowed, user }`).
  * `requireApiUser()`, `requireManagementApi(permission?)`, `requirePermissionApi(permission)`, `requireTutorApi(permission?)` — untuk Route Handler (`lib/auth/guards.ts`).
* Endpoint `/api/v1/tutor/*` **fail-closed**: akun tanpa `tutorId` ditolak (mencegah IDOR).
* Owner (`roleName === 'owner'`) selalu lolos pemeriksaan permission.

---

## 2. Identitas & Entitas Utama

### 2.1. Student Identifier

* `student_code` adalah business identifier unik murid (contoh: `STD-2026-001`).
* Nama murid (`name`) tidak boleh diasumsikan unik dan dapat berubah.
* Primary key internal memakai UUID.

### 2.2. Relasi Tutor – Murid

* Hubungan **bukan** 1:1 kaku. Sistem mendukung:
  * 1 tutor mengajar banyak murid.
  * 1 murid diajar lebih dari 1 tutor (mapel/hari berbeda).
  * Pergantian tutor permanen maupun tutor pengganti per sesi.
  * Kelas kelompok maupun sesi privat.
* Tutor aktual yang mengajar disimpan pada `sessions.tutor_id` (bukan `schedules.tutor_id`) dan dikejar pada `attendance`/`learning_records`.

### 2.3. Pengguna & Profil

* `user` (Better Auth) menyimpan `role` + `role_id`. Tabel `profiles` **tidak** menyimpan role.
* `profiles.must_change_password` = `true` untuk akun hasil seeding dan onboarding tutor baru; UI menampilkan notifikasi/banner agar tutor mengganti password default setelah login.

### 2.4. Manajemen Akun & Onboarding Tutor Baru (CRUD Otomatis)

Sistem menyediakan fitur CRUD lengkap untuk Tutor bagi peran Management (Owner, Admin, HRD) dengan aturan operasional berikut:

1. **Provisioning Akun Otomatis**:
   - Saat tutor baru didaftarkan via form Manajemen, sistem secara otomatis membuat baris pada tabel `"user"`, `"account"` (kredensial login Better Auth), `profiles`, dan `tutors`.
   - Single source of truth tetap berada pada Better Auth; sesi admin yang sedang aktif tidak terputus saat membuat akun baru.
2. **Password Default Acak & Aman**:
   - Jika kolom password tidak diisi oleh admin, sistem secara otomatis menghasilkan password default yang memenuhi kaidah keamanan dan mudah dibaca (format: `Mbk{4 digit acak}!{2 huruf acak}`, contoh: `Mbk4821!xK`).
   - Password di-hash menggunakan algoritma scrypt Better Auth (`@better-auth/utils/password`). Kolom `profiles.must_change_password` otomatis diset `true`.
3. **Pengiriman Email Kredensial Otomatis**:
   - Sistem mengirimkan email transaksional resmi berisi nama tutor, email login, password sementara, dan tautan langsung (`/login`) menuju portal bimbel melalui Resend API (`RESEND_API_KEY`).
   - Apabila API key belum dikonfigurasi (misal di lingkungan lokal/uji coba), sistem berjalan dalam **mode simulasi aman** (mencatat kredensial di console server) dan menampilkan ringkasan kredensial di UI lengkap dengan tombol **Salin Kredensial** serta **Salin Format WhatsApp** agar admin dapat mengirimkannya langsung ke tutor via WA.
4. **Pembaruan & Reset Kredensial**:
   - Manajemen dapat memperbarui biodata tutor (nama, email, nomor HP/WA, bio spesialisasi, status keaktifan).
   - Tersedia tombol **Reset & Kirim Ulang Kredensial** bila tutor lupa password atau belum menerima email pertama kali.
5. **Integritas Relasional & Proteksi Penghapusan (Hard vs Soft Delete)**:
   - Tutor yang **sudah memiliki riwayat mengajar** (tercatat di `schedules`, `sessions`, atau `tutor_payments`) **TIDAK DAPAT DIHAPUS PERMANEN** demi menjaga integritas data historis akademik dan honorarium. Sistem menolak penghapusan dan menganjurkan perubahan status menjadi `inactive` (Nonaktif).
   - Tutor baru yang belum memiliki riwayat sama sekali dapat dihapus permanen (menghapus `tutors`, `profiles`, `"user"`, dan `"account"` secara bersih).
6. **Pencatatan Jejak Audit**:
   - Setiap mutasi tutor (`CREATE_TUTOR`, `UPDATE_TUTOR`, `DELETE_TUTOR`, `RESET_TUTOR_PASSWORD`, `UPDATE_TUTOR_STATUS`) wajib dicatat ke tabel `audit_logs` di server layer.
7. **Panggilan Kehormatan Islami & Pilihan Gender (Abi vs Umi)**:
   - Kolom `gender` (`male` | `female`) tersimpan pada tabel `tutors` dan `profiles` (migration `0008_tutor_gender.sql`).
   - Tutor laki-laki dipanggil **Abi**, tutor perempuan dipanggil **Umi**.
   - Helper `formatTutorDisplayName` secara cerdas memformat sapaan tanpa duplikasi nama (misal nama yang diinput sudah memuat awalan "Abi" atau "Umi" tidak menjadi duplikat seperti "Abi Abi Ahmad" atau "Kak Abi Ahmad").
   - Seluruh notifikasi pesan WhatsApp dan template email kredensial resmi menggunakan etika salam Islami:
     - Pembuka: `Assalamu'alaikum Warahmatullahi Wabarakatuh`
     - Sapaan: `Halo Abi [Nama]` / `Halo Umi [Nama]`
     - Penutup: `Jazakumullah Khairan Katsiran` dan `Wassalamu'alaikum Warahmatullahi Wabarakatuh`.

---

## 3. Enrollment / Paket Belajar (Model Inti)

### 3.1. Konsep

`enrollments` merepresentasikan **keikutsertaan murid pada satu paket bimbel**. Satu murid dapat memiliki banyak enrollment (multi-mapel / multi-paket) sepanjang waktu.

```text
Student
  └── Enrollment (paket) — max_meetings
        └── Schedule → Session → Attendance
```

### 3.2. Perubahan Paket & Reset Nomor Pertemuan

* Satu paket memiliki batas `max_meetings` (umumnya 8 atau 12 sesuai `bimbel_packages`).
* Setelah pertemuan ke-`max_meetings` selesai, enrollment menjadi `completed`.
* Paket berikutnya dibuat **oleh Management** dan nomor pertemuan **kembali dari 1**.
* Tutor **tidak boleh** membuat paket baru otomatis.

### 3.3. Jenis Bimbel adalah Atribut PER MURID (per enrollment)

Satu jadwal/kelas **boleh** memuat murid dengan jenis bimbel berbeda (mis. Reguler + Intensif pada jam mulai yang sama). Konsekuensi (migration `0003`):

* `schedules.bimbel_type_id` dan `sessions.bimbel_type_id` boleh `NULL` (di-drop `NOT NULL`).
* Jam selesai sesi = jam mulai + durasi tipe **paling lama** di kelas tersebut; absensi cukup sekali pada jam selesai itu.
* Rate honor dihitung per murid dari enrollment masing-masing (bukan dari tipe sesi).
* View `v_schedule_bimbel_review` melaporkan jadwal dengan jenis bimbel beragam untuk ditinjau Management.

### 3.4. Data yang BOLEH disimpan vs TIDAK

| Boleh disimpan (atribut paket) | Dihitung dari transaksi (jangan disimpan) |
|---|---|
| `max_meetings`, `package_name`, `price`, `start_date`, `end_date`, `status` | `used_meetings`, `remaining_meetings`, `meeting_number`, `completed_sessions` |

---

## 4. Jenis Bimbel, Durasi, & Paket (Master Data)

### 4.1. `bimbel_types` (master)

```text
Reguler   = 60 menit  (durasi default pada master)
Intensif  = 75 menit
Private   = 90 menit
```

Durasi adalah data (`duration_minutes`), bukan hardcode. Jenis bimbel harus eksplisit, tidak boleh ditebak dari durasi jadwal.

### 4.2. `bimbel_packages` (paket & harga)

Paket per jenjang dapat menimpa durasi default master. Seed saat ini (`supabase/seed.sql`):

| Jenis | Paket | Jenjang | Max Pertemuan | Durasi | Harga / bulan |
|---|---|---|---:|---:|---:|
| Reguler | Reguler Calistung TK | TK | 8 | 75 m | Rp 350.000 |
| Reguler | Reguler SD | SD (1–6) | 8 | 75 m | Rp 400.000 |
| Reguler | Reguler SMP | SMP (7–9) | 8 | 90 m | Rp 480.000 |
| Reguler | Reguler SMA | SMA (11–12) | 8 | 90 m | Rp 560.000 |
| Intensif | Intensif Calistung TK | TK | 12 | 75 m | Rp 500.000 |
| Intensif | Intensif SD | SD (1–6) | 12 | 75 m | Rp 600.000 |
| Intensif | Intensif SMP | SMP (7–9) | 12 | 90 m | Rp 700.000 |
| Intensif | Intensif SMA | SMA (11–12) | 12 | 90 m | Rp 800.000 |
| Private | Private Personal | Semua Jenjang | 8 | 90 m | Rp 650.000 |

`enrollments.package_name` dan `enrollments.price` merupakan **snapshot** paket saat enrollment dibuat agar histori harga tidak berubah bila master paket diubah.

### 4.3. Program / Mata Pelajaran

`programs` (kode unik + nama + level) merepresentasikan bidang/mapel. Contoh seed: `MTK`, `BINDO`, `BING`, `TKA`, `MENGAJI`, `CALISTUNG`, `MENULIS`, `KIMIA`.

---

## 5. Pemisahan Schedule vs Session vs Attendance

Ketiga konsep **HARUS DIPISAHKAN** ke tabel/model tersendiri.

1. **Schedule (Rencana / Jadwal Rutin)**
   * Rencana belajar berulang (mis. "Setiap Rabu 16:00, Reguler, Tutor Abi").
   * Memuat tutor, program, hari, jam, serta peserta (`schedule_students`).
   * Schedule bukan bukti belajar telah terjadi.

2. **Session (Kejadian Belajar Aktual)**
   * Pertemuan nyata pada tanggal spesifik.
   * Status: `scheduled`, `completed`, `cancelled`, `rescheduled`.
   * Menyimpan tutor aktual (`tutor_id`), peserta via `schedule_id` + `schedule_students`, serta `rescheduled_from_session_id` untuk histori reschedule.
   * Memuat `attendance_deadline`, `allow_late_upload`, `late_upload_reason`.
   * UNIQUE `(schedule_id, session_date)` mencegah duplikasi sesi hasil generator.

3. **Attendance (Presensi Murid per Sesi)**
   * Status kehadiran individual murid terhadap sesi.
   * Menyimpan `enrollment_id`, `status`, `verification_status`, `photo_path`, `notes`, `checked_in_at`, `checked_in_by`.
   * UNIQUE `(session_id, student_id)`.

### 5.1. Pengeditan Jadwal & Sesi ala Google Calendar (Edit Scope Pattern)

Saat manajemen ingin mengubah sesi yang berasal dari jadwal berulang (misal mengganti hari/tanggal, jam, tutor, atau catatan materi untuk pertemuan ke depan), sistem menerapkan modal konfirmasi cakupan simpan (*Save Scope*) ala Google Calendar:

1. **Hanya Sesi Ini (`this_session`)**:
   * Memperbarui tanggal, jam mulai/selesai, tutor pengajar, dan catatan khusus pada sesi yang dipilih saja.
   * Template jadwal master (`schedules`) dan sesi-sesi lain di masa lalu maupun mendatang tetap utuh tidak berubah.
   * Sesi ditandai sebagai pengecualian/modifikasi ad-hoc.

2. **Sesi Ini dan Seterusnya (`this_and_following` / Split Recurrence)**:
   * Digunakan ketika terjadi perubahan permanen mulai dari minggu ini ke depan (misal murid ganti hari les atau pindah tutor permanen).
   * **Pemotongan Seri Lama**: Jadwal master lama dipotong hingga sehari sebelum tanggal sesi yang diedit (`recurrence_until = sessionDate - 1 hari`).
   * **Penerbitan Seri Baru**: Dibuat baris `schedules` baru dengan konfigurasi waktu, tutor, dan hari yang diperbarui, mulai berlaku sejak tanggal sesi yang diedit.
   * **Re-linking Sesi Mendatang**: Sesi yang diedit dan sesi-sesi mendatang yang masih berstatus `scheduled` dipindahkan relasinya (`schedule_id`) ke jadwal master baru dan disinkronkan jam/tutor-nya.
   * Sesi masa lalu yang sudah selesai (`completed`) tetap aman terikat pada jadwal master lama (menjaga integritas riwayat belajar dan honor tutor).

3. **Seluruh Rangkaian Jadwal (`all_sessions`)**:
   * Memperbarui konfigurasi jadwal master (`schedules`).
   * Seluruh sesi mendatang yang masih berstatus `scheduled` diselaraskan jam, durasi, dan tutornya.
   * **Proteksi Riwayat**: Sesi berstatus `completed` atau yang sudah memiliki presensi/honor **tidak akan pernah dimutasi secara retroaktif** demi menjamin prinsip *immutable history*.

### 5.2. Halaman Edit Master Jadwal Rutin (`/management/schedules/[scheduleId]/edit`)

* Manajemen memiliki akses penuh mengedit jadwal rutin yang telah dibuat melalui tombol **"Edit Jadwal"** di halaman detail jadwal.
* Formulir mendukung pengubahan tutor, program, hari belajar, jam mulai/selesai, daftar murid (privat maupun multi-murid kelompok), lokasi, dan catatan.
* Saat disimpan, server secara otomatis memvalidasi otorisasi `schedule:update`, memperbarui master `schedules`, menyinkronkan relasi murid `schedule_students`, menyelaraskan sesi-sesi mendatang yang berstatus `scheduled`, dan mencatat perubahan ke `audit_logs`.

---

## 6. Status Kehadiran & Konsumsi Paket

Status kehadiran (`attendance_status`):

```text
present
late
permission
sick
absent
```

### 6.1. `consumes_meeting` (aturan eksplisit)

| Status | Mengonsumsi pertemuan | Payable (honor) |
|---|---|---|
| `present` | **Ya** | **Ya** |
| `late` | **Ya** | **Ya** |
| `permission` | Tidak | Tidak |
| `sick` | Tidak | Tidak |
| `absent` | Tidak | Tidak |

Aturan ini dijaga eksplisit di server/DB (bukan sekadar `WHERE status = 'present'`) agar mudah berkembang.

### 6.2. Verification & Audit Foto Presensi

* Nilai `verification_status`: `submitted` (default), `verified`, `correction_requested`.
* **State Machine & Alur Presensi**:
  * `submitted`: Status default saat tutor selesai mengisi absensi dan mengunggah foto bukti belajar.
  * `verified`: Status telah diperiksa dan disetujui oleh Owner/Finance/Management.
  * `correction_requested`: Status penolakan bukti foto oleh Manajemen (misal: foto buram, foto tidak menampilkan kegiatan belajar, atau foto salah). Catatan koreksi dicatat di kolom `notes`. Tutor menerima notifikasi perbaikan di dashboard.
  * **Unggah Ulang Koreksi**: Ketika tutor mengunggah foto baru untuk presensi yang berstatus `correction_requested`, status presensi otomatis di-reset kembali menjadi `submitted` agar siap diverifikasi ulang oleh manajemen.
* **Strategi Audit**: Untuk efisiensi operasional dan mencegah *approval fatigue*, verifikasi foto presensi tidak diwajibkan harian per sesi. Audit difokuskan berkala per tutor saat proses penggajian bulanan berlangsung (lihat §10.3).
* Koreksi oleh Management wajib menyentuh permission `attendance:update` / `attendance:verify` dan dicatat di `audit_logs`.

---

## 7. Nomor Pertemuan ("P1, P2, ...")

* Pertemuan dikodekan **P** + nomor urut efektif (P1, P2, …).
* Nomor pertemuan **TIDAK** disimpan sebagai kolom dan **TIDAK** dihitung dari `COUNT(schedules)`.
* Dihitung dinamis dari attendance valid dalam konteks **enrollment/paket murid** (migration `0004`):
  * Partisi per `enrollment_id`.
  * Bila `enrollment_id` NULL, fallback partisi per `student_id`.
  * Hanya `present`/`late` yang dihitung; `permission`/`sick`/`absent` tidak menambah urutan.
* View: `v_attendance_with_meeting_number` (menyediakan `meeting_number` & `meeting_code` = `'P' || n`).

Contoh:

```text
Paket #1
  3 Sep  present     → P1
  5 Sep  present     → P2
 10 Sep  permission  → (tidak menambah)
 12 Sep  present     → P3
...
 22 Okt  present     → P12  → paket COMPLETED

Paket #2
 23 Okt  present     → P1   (reset)
```

Jangan pernah melakukan `UPDATE attendance SET meeting_number = 1` untuk reset; data lama immutable secara historis.

---

## 8. Izin, Sakit, & Rescheduling

* `permission` dan `sick`:
  * **Tidak** dihitung sebagai completed learning session.
  * **Tidak** memotong kuota paket.
  * Murid berhak dijadwalkan ulang.
* `absent` juga tidak mengonsumsi paket (sesuai §6), namun tidak otomatis memberi hak reschedule kecuali diputuskan Management.
* Rescheduling **tidak boleh menghapus** riwayat sesi awal:
  * Sesi lama ditandai `rescheduled`.
  * Sesi pengganti baru dibuat dengan `rescheduled_from_session_id` mengacu sesi awal.
* Jangan mengurangi paket hanya karena tanggal jadwal telah lewat.

---

## 9. Tarif Tutor & Gaji Manajemen

### 9.1. Tarif Tutor (`tutor_rates`)

* Tarif = honor per murid, disimpan di database; tidak boleh di-hardcode.
* Kolom: `tutor_id` (nullable = tarif global), `bimbel_type_id`, `level`, `rate_per_student`, `effective_from`, `effective_until`.
* **Hierarki resolusi**: tarif tutor-spesifik menang atas tarif global untuk kombinasi `(bimbel_type, level)` yang sama; bila tidak ada, pakai tarif global.
* Constraint `ex_tutor_rates_no_overlap` (EXCLUDE USING gist) menolak periode tarif yang tumpang tindih untuk scope yang sama.

### 9.2. Gaji Manajemen (`management_rates`)

* Untuk peran manajemen/owner (bukan tutor murid): `role_level` (`owner`/`hrd`/`finance`/`admin`/`curriculum`/`other`), `rate_type` (`monthly`/`allowance`/`hourly`/`project`), `amount`, effective dating, `status`.
* Bersifat konfigurasi; tidak dipakai dalam kalkulasi fee per-sesi tutor.

### 9.3. Immutability Historis

* Tarif yang sudah dipakai payroll historis **tidak boleh berubah retroaktif**.
* Jangan `UPDATE tutor_rates SET rate = ...` pada record historis. Buat baris baru dengan `effective_from` baru.
* Contoh:

```text
Rp20.000  effective_from = 2026-01-01, effective_until = 2026-09-30
Rp25.000  effective_from = 2026-10-01, effective_until = NULL
```

Payroll September tetap memakai tarif September.

---

## 10. Kalkulasi Honor / Payroll Tutor

### 10.1. Formula

```text
fee sesi = tarif berlaku × jumlah murid payable
```

* Murid payable = `present` + `late`.
* `payment_item` dapat menyimpan `bimbel_type_id`, `session_date`, `payable_students_count`, `rate_applied`, `amount`, `subtotal` agar dapat ditelusuri sampai sesi + murid + tarif.

### 10.2. Otoritas Server

* Seluruh perhitungan honor **WAJIB di server** (Server Action / Route Handler). Nilai dari browser tidak dipercaya.
* Alur: otorisasi → ambil sesi valid → ambil attendance → tentukan payable → ambil tarif historis → hitung → persist.
* Model tabel: `tutor_payments` (header, `gross_amount`/`bonus`/`deduction`/`net_amount`/`total_amount`, status `draft`/`processed`/`paid`) + `tutor_payment_items` (detail).
* Trigger `set_tutor_payment_amounts` menyinkronkan `net_amount = gross + bonus - deduction` dan `total_amount = net_amount`.
* UNIQUE `(tutor_id, period_start, period_end)` menjaga idempotensi periode.

### 10.3. Alur Audit Foto Presensi Bulanan per Tutor

Sistem menerapkan prinsip **Hybrid Validation**:
1. **Di Sisi Tutor (Real-time & Transparan)**:
   * Sesi yang selesai diabsen langsung dihitung estimasi honornya di dashboard tutor agar progres kerja transparan.
2. **Saat Penggajian (Audit Berkala oleh Owner/Finance)**:
   * Finance membuat dokumen payroll bulanan (status: `draft`).
   * Finance/Owner membuka halaman audit detail payroll (`/management/payroll/[id]`).
   * Setiap baris sesi menampilkan thumbnail foto presensi yang dapat diperbesar melalui modal lightbox.
   * **Tindakan Audit**:
     * **Verifikasi**: Menyetujui foto presensi (`verification_status = 'verified'`).
     * **Minta Koreksi**: Memberikan catatan penolakan (`correction_requested`) sehingga tutor dapat mengunggah ulang foto bukti.
     * **Keluarkan Sesi dari Draft**: Menghapus item sesi tertentu dari draft payroll ini jika sesi dibatalkan/ditunda. Total honor dan jumlah sesi dihitung ulang secara transaksional.

### 10.4. Siklus Status Penggajian & Flag Pembayaran

Siklus status penggajian (`payroll_status`):
```text
draft ──(Finalisasi)──> processed ──(Tandai Telah Dibayar)──> paid
```

1. **`draft`**: Dokumen penggajian baru di-generate. Dapat dilakukan penyesuaian bonus/potongan, audit foto presensi, atau pengeluaran sesi bermasalah.
2. **`processed`**: Dokumen telah diaudit dan difinalisasi oleh Finance/Owner (`finalized_at`, `finalized_by`). Data terkunci dari perubahan item.
3. **`paid`**: **Flag resmi bahwa gaji telah ditransfer/dibayarkan ke tutor**:
   * Mencatat timestamp pembayaran (`paid_at`) dan user eksekutor (`paid_by`).
   * Menyimpan nomor referensi bukti bank/transfer (`payment_reference`, misal: `TRF-BCA-9201948`) dan catatan pembayaran (`notes`).
   * Tutor dapat melihat nomor referensi bukti transfer ini secara langsung di portal penggajian tutor.
   * Seluruh perubahan status dicatat ke `audit_logs`.

---

## 11. Jendela Waktu Presensi (Attendance Window)

Konfigurasi di `attendance_window_settings`:

```text
open_before_minutes      # form absensi dibuka sebelum jam mulai
close_after_hours        # batas jam setelah sesi berakhir
max_days_allowed         # toleransi hari backdate
daily_cutoff_time        # batas jam harian
allow_tutor_backdate     # izin tutor mengisi mundur
status                   # active/inactive
```

* Validasi jendela dilakukan **murni di server**.
* Tutor **tidak dapat** mem-bypass jendela dari input client (`allowTimeBypass` tidak ada di schema input).
* Pengecualian hanya lewat operasi Management terpisah (`overrideAttendanceWindow`, permission `attendance:update`, wajib alasan, dan diaudit).

---

## 12. Verifikasi & Penyimpanan Foto Presensi

* Foto absensi diambil via browser webcam (`react-webcam`), opsional dikompresi di klien (`browser-image-compression`), lalu diunggah ke **Supabase Storage**.
* **Foto wajib** saat tutor submit presensi (lihat §18). Pengecualian hanya melalui operasi Management teraudit.
* Bucket: `attendance` — **privat** (`public = false`), limit 5 MB, MIME allow-list `image/jpeg`, `image/png`, `image/webp`.
* Database hanya menyimpan `photo_path`. Recommended path:

```text
attendance/{year}/{month}/{session_id}/{student_id}.jpg
```

* Validasi server minimal: estimasi ukuran pre-decode, deteksi magic bytes (JPEG/PNG/WebP), penolakan file spoofed. Jangan mempercayai `file.name`/`file.type` dari browser.
* Akses foto hanya lewat signed URL yang dibuat server setelah otorisasi (`getAuthorizedAttendancePhotoUrl` / `signAttendancePhotoPath`).

---

## 13. Learning Record & Progress Report

### 13.1. Learning Record (`learning_records`)

* Satu per attendance (UNIQUE `attendance_id`), menyimpan `material` (wajib), `notes`, `homework`.
* Materi pelajaran **tidak** disimpan di `attendance` (dipisahkan). `attendance.notes` untuk catatan kehadiran/proses, `learning_records.material` untuk konten pembelajaran.

### 13.2. Progress Report (`progress_reports`)

* Laporan perkembangan berkala per murid/enrollment: `period_title`, `achievement`, `evaluation`, `notes`.
* Dipakai untuk laporan evaluasi yang dicetak A4 (Progress Report) di Management.

---

## 14. Kurikulum, Materi, & Worksheet

* `subjects` — master mata pelajaran per jenjang.
* `curriculum_topics` — bab silabus per `subject_id` + `grade`, memuat `chapter_number`, `title`, `description`, serta `worksheet_name`/`worksheet_url` (opsional).
* Dikelola pusat oleh Management (bagian kurikulum) agar standar materi konsisten; tutor dapat melihat/mengunduh worksheet.
* Penautan materi ke jadwal/sesi bersifat pengembangan (roadmap) dan belum menjadi gate absensi.

---

## 15. Audit Logging

Setiap mutasi data sensitif wajib mencatat `audit_logs` di server/database layer:

* Minimal kolom: `user_id`, `action`, `entity_type`, `entity_id`, `metadata` (`before`/`after`), `created_at`.
* Data yang wajib diaudit minimal:
  * Perubahan/koreksi attendance.
  * Perubahan `tutor_rates` dan `management_rates`.
  * Transisi status payroll (`draft` → `processed` → `paid`).
  * Perubahan sesi/jadwal yang memengaruhi payroll.
  * Mutasi role/permission dan penugasan role ke user.
  * Koreksi learning record / progress report.
* Presensi via RPC `submit_session_attendance` menulis audit di **transaksi yang sama**.

---

## 16. Alur Sistem Operasional (Onboarding)

Sistem dimulai tanpa data. Alur awal:

1. **Management seeder** tersedia (akun management hasil seed), lalu Management mendaftarkan seluruh tutor dan murid.
2. Saat akun tutor dibuat, sistem memberikan **email + password default**.
3. Tutor masuk; muncul **notifikasi (alert)** yang menyarankan mengganti password default (`profiles.must_change_password = true`).
4. Karena jadwal belum ada, **Management membuat jadwal**. Saat membuat jadwal, Management menyertakan tutor dan peserta.
5. Tutor melihat jadwalnya dan melakukan **absen** saat sesi.
6. Setelah absen, sistem menampilkan murid tersebut sudah **pertemuan ke berapa** (P1, P2, …) sesuai paket berjalan.

Catatan operasional:

* Registrasi akun management tambahan dapat dibuat lewat `/register` (di luar alur seed normal).
* Endpoint tutor fail-closed bila `profiles`/`tutors` tidak terpetakan ke `user` — wajib provisioning akun nyata via Better Auth (`supabase/seed-auth.ts` untuk password ter-hash).
* Seed `supabase/seed.sql` melakukan `TRUNCATE` tabel operasional saat dijalankan ulang — aman untuk development, **hindari di produksi**.

---

## 17. Contoh Data Referensi (Operasional Nyata)

Digunakan sebagai acuan seed & laporan (37 murid, 11 tutor, 8 program). Sebagian contoh jadwal:

| No | Nama Murid | Kelas & Materi | Waktu | Mentor |
| -: | --- | --- | --- | --- |
| 1 | Ralisa | 1 SD + ngaji | 13.00–14.00 | Umi Fara |
| 2 | Arsyila | 2 SD + ngaji | 13.00–14.00 | Umi Fara |
| 3 | Rumaisaha | 5 SD | 14.00–15.15 | Umi Fara |
| 4 | Nadiv | 9 SMP | 16.00–17.15 | Umi Fara |
| 5 | Dhea | 9 SMP | 16.00–17.15 | Umi Fara |
| 6 | Zihan | 9 SMP | 16.00–17.15 | Umi Fara |
| 7 | Banita | 9 SMP (MTK) | 16.00–17.15 | Abi Yoko |
| 8 | Zaneta | 9 SMP (MTK) | 16.00–17.15 | Abi Yoko |
| 9 | Dero | 9 SMP (MTK) | 16.00–17.15 | Abi Yoko |
| 10 | Amira | TKA 9 SMP | 16.30–17.45 | Abi Ihsan |
| 11 | Meysha | TKA 9 SMP | 16.30–17.45 | Abi Ihsan |
| 12 | Almaira | TKA 9 SMP | 16.30–17.45 | Abi Ihsan |
| 13 | Shafa | TKA 9 SMP | 16.30–17.45 | Abi Ihsan |
| 14 | Urfa | TKA 9 SMP | 16.30–17.45 | Abi Ihsan |
| 15 | Annisa | 4 SD | 08.00–09.15 | Abi Herwin |
| 16 | Melody | 4 SD | 09.30–10.30 | Abi Herwin |
| 17 | Miqdad | 3 SD Menulis | 10.00–11.15 | Abi Herwin |
| 18 | Alfatih | Calistung SD | 11.00–12.00 | Abi Herwin |
| 19 | Tian | Calistung SD | 13.00–14.15 | Abi Herwin |
| 20 | Sena | 1 SD | 13.00–14.00 | Abi Herwin |
| 21 | Mauza | Calistung TK | 13.00–14.00 | Abi Herwin |
| 22 | Kayla | 9 SMP + ngaji | 16.00–17.15 | Abi Herwin |
| 23 | Nuri | 5 SD | 15.00–16.15 | Umi Anjel |
| 24 | Zoeya | 2 SD | 16.00–17.00 | Umi Anjel |
| 25 | Yasmin | Calistung | 16.30–17.30 | Umi Anjel |
| 26 | Rafa | 6 SD (TKA) | 16.00–17.15 | Abi Hanif |
| 27 | Salman | 6 SD (TKA) | 16.00–17.00 | Abi Hanif |
| 28 | Najmi | 10 SMA (Kimia) | 14.00–15.30 | Abi Govin |
| 29 | Lionel | 10 SMA (Kimia) | 14.00–15.30 | Abi Govin |
| 30 | Fathan | 8 SMP | 16.00–17.15 | Abi Govin |
| 31 | Yani | 12 SMA | 16.00–17.30 | Abi Govin |
| 32 | Naufal | 12 SMA | 17.00–18.00 | Abi Govin |
| 33 | Inara (privat) | Mengaji | 15.00–16.15 | Umi Elsa |
| 34 | Cicam (privat) | Calistung SD | 16.20–17.35 | Umi Elsa |
| 35 | Amirah (privat) | 2 SD | 18.30–20.00 | Umi Nabila |
| 36 | Sesha (privat) | 3 SD (ngaji) | 16.30–17.45 | Umi Nasywa |
| 37 | Afsheena (privat) | 5 SD | 16.00–17.15 | Umi Firda |

Seed lengkap (students, tutors, programs, enrollments, schedules, contoh sesi, akun) berada di `supabase/seed.sql`.

---

## 18. Keputusan Bisnis Final (dikonfirmasi 28 September 2026)

Bagian ini mengunci keputusan yang sebelumnya terbuka (lihat `docs/PROJECT_REVIEW_2026-09-28.md` §5). Implementasi server mengikuti aturan ini.

| # | Pertanyaan | Keputusan |
|---|---|---|
| 1 | Apakah payroll wajib attendance `verified`? | **Tidak.** Attendance `submitted` sudah cukup (verifikasi bersifat informatif/koreksi). |
| 2 | Perlakuan status `late`? | **Payable dan mengurangi kuota paket.** `late` = pertemuan efektif. |
| 3 | Perlakuan status `sick`? | **Sama seperti `permission`.** Tidak mengurangi kuota, tidak payable, boleh reschedule. |
| 4 | Hierarki tarif tutor? | **Override tutor > global per (bimbel_type + level).** Tarif tutor-spesifik menang; jika tidak ada, pakai global. |
| 5 | Foto presensi wajib? | **Wajib** saat tutor submit. Pengecualian via operasi Management teraudit (`overrideAttendanceWindow`). |
| 6 | Durasi default Reguler? | **60 menit** pada master `bimbel_types`. Durasi paket per jenjang (`bimbel_packages`) dapat berbeda dan data-driven. |
| 7 | Siapa yang membuat paket/enrollment baru? | **Management.** Tutor tidak membuat paket otomatis saat paket selesai. |
| 8 | Kapan nomor pertemuan reset? | **Per paket/enrollment.** Setelah `max_meetings` tercapai, paket `completed`; paket berikutnya mulai dari P1. |

### 18.1. Implikasi Implementasi

* **Attendance payable** (`present`, `late`) dipakai pada kalkulasi payroll.
* **Kuota paket**: hanya `present`/`late` menambah nomor pertemuan; `permission`/`sick`/`absent` tidak.
* **Foto wajib**: `submitSessionAttendance` menolak submit tanpa foto; tidak ada bypass jendela dari client.
* **Tarif**: query payroll memfilter `level` sesi dan memilih `effective_from` terbaru secara deterministik; periode tumpang tindih ditolak `ex_tutor_rates_no_overlap`.
* **Reguler 60 menit**: seed `bimbel_types` diselaraskan; override per paket tetap dimungkinkan.

---

## 19. Aturan yang Masih Terbuka / Backlog

Beberapa hal **belum final** dan tidak boleh diasumsikan permanen tanpa keputusan Management:

1. Apakah `absent` memberi hak reschedule otomatis.
2. Formula fee khusus untuk group vs private (saat ini seragam `rate × payable`).
3. Apakah rate dapat berbeda per murid/program dalam satu tipe+level.
4. Apakah session yang di-reschedule memakai tarif tanggal sesi awal atau sesi pengganti.
5. Kebutuhan `session_students` sebagai snapshot peserta sesi (agar perubahan membership jadwal tidak mengubah histori sesi lama).
6. State machine formal untuk session/attendance/reschedule.
7. Auto-generate sesi dari jadwal via cron/pg_cron.
8. Notifikasi/pengingat presensi (Web Push / WhatsApp) dan kurikulum–worksheet penjadwalan terpusat (roadmap).
9. `reports:read` direferensikan di `config/permissions.ts` tetapi belum terdaftar di master `permissions`/seed — perlu diselaraskan.
10. Integrasi Payment Gateway Disbursement (pencairan honor mandiri via Payout Link / QR Code atau batch transfer otomatis pada tanggal cut-off tertentu) — roadmap pengembangan fintech.

Aturan terbuka ini harus diklarifikasi (AGENTS.md §31) sebelum diimplementasikan secara permanen karena berpotensi memengaruhi data historis atau payroll.

---

## 20. Keputusan Jadwal Berulang / Recurring (dikonfirmasi 8 Oktober 2026)

`schedule` adalah template + aturan pengulangan; `sessions` adalah materialisasi kejadian aktual. Migration `0005_recurring_schedules`.

| # | Pertanyaan | Keputusan |
|---|---|---|
| 1 | Terminasi pengulangan | **Wajib COUNT xor UNTIL** untuk jadwal baru: setelah N kali ATAU sampai tanggal (semantik Google Calendar; keduanya sekaligus ditolak). Baris legacy (keduanya NULL) tetap jalan terus. Pengulangan **opsional di UI** (checkbox): tanpa centang = jadwal satu kali (`count=1` pada tanggal terpilih). |
| 2 | Multi-hari per jadwal | **Ya, fase 1.** Satu jadwal boleh Senin & Rabu dst via `days_of_week[]`; `day_of_week` di-derive DB (hari pertama) agar read path lama tak berubah. |
| 3 | Edit seri vs sesi ter-generate | **Dibiarkan + warning.** Ubah template hanya berlaku untuk sesi yang belum ter-generate; sesi future existing tidak diubah (jumlahnya dilaporkan); historis immutable. |
| 4 | Pengecualian tanggal | **Ya, per jadwal fase 1** (`schedule_exceptions`); generator melewatinya dan kuota `count` tidak ikut terpakai. |
| 5 | Permission laporan | **Pakai permission existing** (`attendance:read`, `student:read`, `payroll:read`); belum perlu `reports:read` baru. |

### 20.1. Implikasi Implementasi

* Rule: `recurrence_start_date` (≥ hari ini saat create), `days_of_week` 1–7 hari unik, `recurrence_interval` 1–12 minggu, `count` 1–520 xor `until` ≥ start (CHECK di DB + Zod shared client/server).
* Ekspansi tanggal murni di `lib/utils/recurrence.ts` (`expandOccurrences`, UTC, teruji 11 kasus): dipakai pratinjau form DAN generator — satu sumber kebenaran. Kuota `count` dihitung dari `startDate` sehingga generate per jendela tak melebihi total.
* Generator: occurrence per rule, skip `schedule_exceptions`, idempoten via UNIQUE `(schedule_id, session_date)` (cek batch 1 query, bukan per tanggal), batch insert + batch audit.
* Saat create: materialisasi 30 hari ke depan otomatis; form menampilkan pratinjau tanggal sebelum simpan.
* Interval multi-minggu dihitung dari minggu `startDate` (minggu ke-0 = minggu yang memuat startDate).

---

## 21. Keputusan Snapshot Peserta Sesi & Otomatisasi Sesi (dikonfirmasi 10 Oktober 2026)

### 21.1. Snapshot Peserta Sesi (`session_students`) — Migration `0006`
* **Latar Belakang**: `schedule_students` adalah relasi dinamis pada rencana jadwal rutin. Jika murid pindah kelas, nonaktif, atau jadwal diperbarui, data sesi dan presensi masa lalu tidak boleh terpengaruh.
* **Aturan Mutlak**:
  1. Setiap kali record `sessions` dibangkitkan dari `schedules`, daftar murid dibekukan secara atomik ke tabel `session_students` (`session_id`, `student_id`, `enrollment_id`, `bimbel_type_id`).
  2. Presensi (`attendance.service.ts`) memprioritaskan validasi peserta terhadap `session_students` sebagai SSOT peserta sesi aktual.
  3. Sesi warisan (*legacy*) yang belum memiliki baris `session_students` tetap didukung melalui *fallback* aman ke `schedule_students`.
  4. Query sesi di portal manajemen dan tutor mengutamakan `session_students` sebelum jatuh ke `attendance` atau `schedule_students`.

### 21.2. Pembangkitan Sesi Terjadwal via Cron (`/api/v1/sessions/cron-generate`)
* **Mekanisme**: Endpoint khusus scheduler menerima otorisasi `CRON_SECRET` (header `Authorization: Bearer <secret>` atau `x-cron-secret`) atau sesi terautentikasi dengan hak `session:create`.
* **Jendela Tanggal**: Default mengevaluasi hari ini hingga H+7 hari ke depan (WIB `Asia/Jakarta`).
* **Audit Trail**: Setiap eksekusi otomatis mencatat record audit log `SESSION_CRON_GENERATED` di server.

---

## 22. Notifikasi Push Tutor (dikonfirmasi 10 Oktober 2026) — Migration `0007`

### 22.1. Tujuan & Penerima
* Penerima notifikasi adalah **tutor**. Tujuan utama: memberi tahu tutor saat Management menambahkan jadwal baru, dan mengingatkan sesi mengajar (sebelum & sesudah) agar presensi tidak terlambat.

### 22.2. Pemicu Notifikasi
1. **Jadwal Baru Ditambahkan**: Dikirim otomatis saat Server Action `createSchedule` sukses (best-effort). Berisi program, hari, dan jam sesi. Mengarah ke `/tutor/schedules`.
2. **Pengingat Sebelum Sesi**: Dikirim relatif terhadap jam mulai.
3. **Pengingat Setelah Sesi**: Dikirim bila presensi sesi tersebut belum di-submit. Mengarah ke `/tutor/attendance`.

### 22.3. Parameter Konfigurasi (DATA, bukan hardcode)
Dikelola Management lewat halaman `/management/settings/notifications` (tabel `notification_settings`):
* `enabled` — sakelar utama seluruh notifikasi.
* `schedule_created_enabled` — aktif/nonaktif notifikasi jadwal baru.
* `before_minutes` — menit sebelum jam mulai untuk pengingat pertama.
* `after_minutes` — menit setelah jam selesai untuk pengingat presensi.
* `repeat_count` (1–10) — berapa kali pengingat sebelum sesi diulang.
* `repeat_interval_minutes` — jeda antar pengingat sebelum sesi.

Aturan pengulangan sebelum sesi: slot ke-`i` (`i = 0..repeat_count-1`) jatuh pada `mulai − before_minutes + i × repeat_interval_minutes`. Dispatcher memilih hanya slot terbaru yang sudah jatuh tempo per eksekusi; tiap slot dijamin terkirim sekali.

### 22.4. Preferensi Tutor
* Tutor dapat mengaktifkan/mematikan notifikasi dari `/tutor/profile` (toggle shadcn Switch, tabel `notification_preferences`).
* Default preferensi **aktif** bila belum pernah diatur.
* Mengaktifkan toggle akan mendaftarkan langganan push perangkat (`push_subscriptions`); mematikannya menghapus langganan perangkat tersebut.

### 22.5. Otorisasi
* Konfigurasi notifikasi dibatasi permission dinamis **`notification:manage`** (Sistem & Keamanan). Diberikan ke role `owner` dan `admin`.
* Dispatcher `/api/v1/web-push/dispatch` dapat dipicu via `CRON_SECRET` (Bearer / `x-cron-secret` / `?token=`) atau sesi terautentikasi pemegang `notification:manage`.
* Endpoint penyimpanan langganan selalu memakai identitas dari sesi server; endpoint tidak dapat dipindah ke user lain.

### 22.6. Integritas & Keamanan
* Foto/binary tidak terlibat. Tidak ada data sensitif baru selain endpoint push perangkat (disimpan di `push_subscriptions`).
* Idempotensi dijamin `notification_logs.dedupe_key` (UNIQUE) — eksekusi cron ganda tidak mengirim ulang slot yang sama.
* Pengiriman push bersifat **best-effort**: kegagalan notifikasi TIDAK boleh menggagalkan transaksi bisnis (mis. pembuatan jadwal).
* Langganan yang ditolak push service (HTTP 404/410) otomatis dinonaktifkan (`is_active = false`).
* VAPID: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` di environment.

### 22.7. Tabel
`notification_settings`, `push_subscriptions`, `notification_preferences`, `notification_logs` (semua RLS deny-by-default).

### 22.8. Pusat Notifikasi In-App & Status Baca (Migration 0009)
* Lonceng notifikasi di header tutor (`TutorHeader`) terhubung langsung ke tabel `notification_logs` (tidak membutuhkan webhook pihak ketiga karena seluruh pemicu berasal dari internal sistem).
* Kolom baru di `notification_logs`: `read_at TIMESTAMPTZ` (waktu dibaca; NULL = belum dibaca) dan `metadata JSONB` (target URL navigasi seperti `/tutor/sessions/:id` atau `/tutor/schedules`).
* Menampilkan badge angka unread merah dinamis (`1`, `2`, s.d. `9+`) saat ada notifikasi belum dibaca; bersih tanpa titik merah palsu saat semua sudah dibaca.
* Dropdown popover menampilkan daftar riwayat notifikasi, ikon sesuai tipe (jadwal, pengingat, uji coba), format waktu relatif Indonesia, navigasi 1-klik ke sesi mengajar, serta aksi "Tandai dibaca" (per item dan massal).

---

## 23. Impor Riwayat Sesi dari Spreadsheet / Excel (dikonfirmasi 11 Oktober 2026)

### 23.1. Latar Belakang & Tujuan
* Saat bimbel bermigrasi dari Google Sheets / Excel ke aplikasi web baru, murid telah memiliki riwayat pertemuan sebelumnya (misal P1–P3 pada paket aktif, atau P1–P8 pada paket lama).
* Sistem menyediakan jalur migrasi per murid melalui dialog impor di `/management/students/[studentId]`.
* **Tujuan utama**: Memastikan pertemuan berikutnya yang dilakukan tutor di aplikasi baru otomatis melanjutkan urutan nomor pertemuan yang sah (`meeting_number`), serta riwayat materi terdahulu langsung tampil di lembar laporan perkembangan murid (PDF).

### 23.2. Format Input & Parser Cerdas
* Mendukung dua metode input:
  1. **Salin-Tempel (Copy-Paste)** teks tabel langsung dari Google Sheets / Excel (tab-separated / CSV).
  2. **Unggah File Excel (.xlsx / .xls)** dengan dukungan multi-sheet: sistem membaca seluruh lembar kerja di workbook, mengekstrak nama murid dari header lembar atau nama sheet, dan otomatis mengarahkan ke sheet murid yang cocok.
* Mendeteksi otomatis:
  1. Header metadata: `Nama Murid`, `Kelas`, `Jadwal`, `Mapel` (toleran terhadap tanda titik dua, petik, spasi, dan tab).
  2. Tanggal Bahasa Indonesia: `Rabu, 3 September 2026`, `Jum'at, 02 Oktober 2026`, `23/09/2026` dikonversi ke ISO `YYYY-MM-DD`.
  3. Pemisahan siklus paket (*batch cycles*): mendeteksi baris pemisah evaluasi (seperti `Pencapaian dan Evaluasi`) atau reset nomor pertemuan dari 8 ke 1.
  4. Tombol pilihan filter cepat:
     - **Pilih Paket Berjalan Saja (Rekomendasi)**: Memilih hanya sesi pada siklus paket aktif terakhir (misal 3 sesi terakhir) agar absensi tutor berikutnya otomatis menjadi **Pertemuan ke-4**.
     - **Pilih Semua (Seluruh Riwayat)**: Mengimpor seluruh paket lama dan paket aktif.
  5. Pencocokan otomatis nama mentor / tutor ke master database (`tutors` & `profiles.full_name`) dengan kemampuan override per baris di tabel pratinjau.

### 23.3. Integritas Data Transaksional & Multi-Paket
* Eksekusi melalui Server Action `importStudentHistoricalSessionsAction`:
  1. **Pemisahan Paket**: Bila terdeteksi beberapa siklus paket (misal P1–P8 paket lama dan P1–P3 paket aktif), sesi paket lama otomatis dikaitkan ke enrollment dengan `status = 'completed'`, sedangkan sesi paket aktif dikaitkan ke enrollment `status = 'active'`.
  2. `sessions`: Dibuat dengan tanggal masa lalu, status `completed`.
  3. `session_students`: Dibekukan ke `student_id` dan `enrollment_id` masing-masing siklus paket.
  4. `attendance`: Dibuat dengan status `present`, `verification_status = 'verified'` (karena data historis telah disetujui sebelumnya), tanpa mewajibkan foto bukti.
  5. `learning_records`: Dicatat materi dan catatan evaluasi per pertemuan.
  6. `audit_logs`: Dicatat aksi `HISTORICAL_SESSIONS_IMPORTED`.
* Penomoran dinamis via view `v_attendance_with_meeting_number` menjamin sesi baru berikutnya otomatis bernomor $N + 1$ (misal Pertemuan ke-4).


