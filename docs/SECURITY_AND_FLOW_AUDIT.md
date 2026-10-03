# Audit Keamanan, Integritas Data, dan Alur Sistem

**Proyek:** MentorBelajarku  
**Tanggal audit:** 2026-09-18  
**Cakupan:** source code, migration, seed data, API route handler, server action, autentikasi, otorisasi, integrasi storage, dan alur bisnis yang terdokumentasi.  
**Metode:** review statis. Tidak ada database produksi, proyek Supabase, environment terdeploy, atau akun user nyata yang diakses.

## Ringkasan Eksekutif

Dari sisi keamanan dan integritas data, proyek ini belum siap produksi. Hambatan paling mendesak adalah:

1. Endpoint login yang aktif adalah login sintetis tanpa password dan hanya menerima email atau ID user sebagai kredensial.
2. `synthetic_user_id` adalah cookie yang dikendalikan client, tetapi otorisasi server memperlakukannya sebagai identitas yang sudah terautentikasi.
3. Supabase server client dapat memakai service-role key untuk seluruh query, sementara policy RLS memberi akses tanpa batas.
4. Beberapa API tutor hanya memeriksa role dan tidak memverifikasi bahwa session, attendance, atau student yang diminta memang milik tutor tersebut.
5. Pengiriman attendance menerima `allowTimeBypass` dari pemanggil, mempercayai kombinasi student/session sembarang, menelan error database, dan tetap dapat menandai session selesai meski terjadi kegagalan sebagian.
6. Migration dan kode aplikasi tidak sepakat soal kolom dan relasi (`profiles.role`, `attendance.student_program_id`, `attendance.material`, `sessions.actual_date`, `schedules.student_id`). Hal ini dapat menyebabkan error runtime dan data bisnis yang tidak valid.
7. Payroll memakai status attendance yang valid tetapi tidak mewajibkan attendance terverifikasi, tidak memvalidasi kepemilikan enrollment, dan tidak memiliki invariant database yang mencegah periode tarif historis saling tumpang tindih.
8. Audit log bersifat best-effort dan tidak terikat secara transaksional dengan mutasi yang seharusnya dicatat.

Dokumen ini adalah backlog perbaikan. Temuan diurutkan berdasarkan dampak praktis, bukan berdasarkan urutan di dalam codebase.

## Tingkat Keparahan

| Tingkat | Arti |
|---|---|
| Critical | Pengambilalihan akun, mutasi/akses data tanpa izin, atau korupsi data/keuangan sangat mungkin terjadi. Perbaiki sebelum deployment. |
| High | Kebocoran data sensitif, eskalasi hak akses, atau kegagalan aturan bisnis utama mungkin terjadi. Perbaiki sebelum dipakai produksi. |
| Medium | Kelemahan penting pada integritas, resiliensi, privasi, atau maintainability. Perbaiki pada milestone hardening produksi. |
| Low | Peningkatan defense-in-depth, observability, atau kualitas. |

## Temuan Critical

### C-01. Login sintetis tanpa password terekspos sebagai alur login aktif

**Bukti:** `app/api/v1/auth/login/route.ts:14-17,39-85,98-170`; `features/auth/actions/auth.actions.ts:66-97`.

Endpoint ini secara eksplisit melakukan login berdasarkan email atau user ID lalu menetapkan `better-auth.session_token=synthetic-{user.id}`. Tidak ada password, session Better Auth, proteksi CSRF, maupun verifikasi kredensial di sisi server. Varian GET bahkan mendukung login melalui query parameter.

Siapa pun yang mengetahui atau menebak email/user ID dapat menyamar sebagai management, finance, admin, atau tutor mana pun. Response juga membocorkan daftar akun sintetis ketika pencarian gagal.

**Dampak:** penyamaran penuh dan akses ke PII murid, attendance, payroll, pengaturan, dan data audit.

**Perbaikan wajib:** hapus atau nonaktifkan secara keras login sintetis di luar build demo lokal yang terisolasi. Alihkan seluruh login nyata melalui `signInEmail` Better Auth. Jangan menyediakan login lewat GET. Rotasi semua kredensial/secret setelah deployment.

### C-02. Cookie identitas yang dikendalikan client diterima sebagai autentikasi

**Bukti:** `middleware.ts:27-35`; `lib/auth/session.ts:80-137,198-221`; `features/auth/actions/auth.actions.ts:84-97`.

Middleware menganggap `synthetic_user_id` sudah cukup untuk autentikasi. `getCurrentUser()` me-resolve cookie yang cocok menjadi user sintetis, dan jika cookie tidak dikenal maka jatuh ke `DEFAULT_SYNTHETIC_USER`. Cookie tersebut diset tanpa `httpOnly` atau `secure`.

Ini bukan session terautentikasi. Browser atau script dapat menyetel cookie ke ID lain yang diketahui dan menjadi user tersebut. Fallback default juga mengubah kegagalan autentikasi/DB menjadi identitas mirip owner alih-alih menolak akses.

**Dampak:** eskalasi hak akses ke management/owner dan otorisasi yang fail-open saat terjadi gangguan infrastruktur.

**Perbaikan wajib:** terima hanya session Better Auth yang diterbitkan server dan divalidasi ke database. Hapus fallback sintetis dari jalur kode produksi. Saat session hilang/tidak valid, kembalikan 401/redirect ke login; jangan pernah mengembalikan user dengan hak istimewa default.

### C-03. Akses service-role dan RLS tanpa batas meniadakan isolasi database

**Bukti:** `lib/supabase/server.ts:7-17,34-49`; `supabase/migrations/0001_initial_schema.sql:767-795`.

Server client lebih memilih `SUPABASE_SERVICE_ROLE_KEY`, yang mem-bypass RLS. Migration mengaktifkan RLS tetapi membuat policy akses penuh dengan `USING (true)` dan `WITH CHECK (true)` untuk setiap tabel public. Tidak ada policy yang dibatasi per user/tutor.

Akibatnya database mempercayai aplikasi sepenuhnya. Bug pada route handler menjadi akses database tanpa batas. Ini juga berarti proteksi RLS yang diklaim sebenarnya tidak efektif.

**Dampak:** baca/tulis lintas tenant/lintas role, termasuk payroll dan data pribadi.

**Perbaikan wajib:** pertahankan akses service-role hanya di modul admin/data-access yang terisolasi ketat bila memang perlu; utamakan client anon/authenticated dengan pemetaan identitas eksplisit. Ganti policy menyeluruh dengan policy per tabel. Definisikan bagaimana user ID Better Auth dipetakan ke otorisasi database, lalu uji policy dengan skenario role nyata.

### C-04. API tutor memiliki celah otorisasi level objek (IDOR)

**Bukti:** `app/api/v1/tutor/attendance/[attendanceId]/route.ts:9-27`; `app/api/v1/tutor/sessions/[sessionId]/route.ts:9-27`; `app/api/v1/tutor/students/route.ts:14-21`.

Handler ini hanya memeriksa bahwa role adalah `tutor` atau `management`. Mereka tidak membatasi attendance/session yang diminta dengan `user.tutorId`, dan tidak menolak tutor tanpa pemetaan tutor. Tutor mana pun yang memperoleh UUID orang lain dapat membaca session, student, attendance, catatan, dan berpotensi photo path milik tutor lain.

`/tutor/students` hanya menambahkan filter tutor ketika `tutorId` bernilai truthy. Konteks tutor yang cacat atau tidak terpetakan karena itu dapat menghasilkan query student tanpa scope.

**Perbaikan wajib:** tegakkan kepemilikan di dalam query itu sendiri, misalnya dengan menggabungkan `sessions.tutor_id` ke tutor aktif dan membatasi setiap baca/tulis tutor. Fail closed ketika `tutorId` tidak ada. Tambahkan automated test IDOR untuk setiap endpoint tutor.

## Temuan High

### H-01. Otorisasi hanya berbasis role dan mem-bypass model permission dinamis

**Bukti:** `lib/auth/authorization.ts:64-81`; `app/api/v1/management/tutor-rates/route.ts:18-21`; `app/api/v1/management/payroll/generate/route.ts:5-9`; `supabase/seed.sql:74-176`.

Database memiliki `roles`, `permissions`, dan `role_permissions`, tetapi route umumnya meng-hardcode `management`/`admin`. Helper memberikan seluruh user management/admin akses attendance penuh, sementara subrole seperti finance dan HRD hanya direpresentasikan sebagai data dan tidak ditegakkan secara konsisten.

**Dampak:** akun finance/HRD dapat mengakses atau memutasi modul di luar permission yang seharusnya; mengubah permission di Settings bisa jadi tidak berefek pada keamanan.

**Perbaikan wajib:** sentralkan `requirePermission(permission)` dan resolve permission dari penugasan role yang otoritatif. Gunakan di server action dan route handler, bukan hanya di navigasi/UI.

### H-02. Pengiriman attendance mempercayai bypass dan relasi yang dikendalikan pemanggil

**Bukti:** `features/shared/attendance/schemas/attendance.schema.ts:16-21`; `features/tutor/attendance/actions/attendance.actions.ts:54,94-119,165-187`.

`allowTimeBypass` adalah field input. Pemanggil dapat menyetelnya ke `true` dan melewati jendela attendance. Action hanya memverifikasi tutor session, tidak memverifikasi bahwa setiap `studentId` adalah anggota session atau bahwa `studentProgramId` milik student/enrollment tersebut. Management juga diizinkan mengirim melalui endpoint tutor.

**Dampak:** attendance palsu/backdate, attendance untuk student yang tidak terkait, dan manipulasi payroll.

**Perbaikan wajib:** hapus bypass dari input publik. Jadikan bypass sebagai operasi management yang diotorisasi terpisah beserta alasan audit. Dalam satu transaksi, verifikasi status session, penugasan tutor, keanggotaan session-student, kepemilikan enrollment, dan aturan duplikat/koreksi sebelum menulis.

### H-03. Kegagalan sebagian attendance disembunyikan dan penyelesaian session tidak atomik

**Bukti:** `features/tutor/attendance/actions/attendance.actions.ts:169-221,244-259`.

Setiap penulisan baris dibungkus `catch` luas yang hanya mencatat warning lalu lanjut. Action kemudian berusaha menandai session `completed` terlepas dari berapa banyak baris yang gagal. Response melaporkan sukses meski penulisan database terlewat. Record sintetis ditulis terpisah dari database.

**Dampak:** UI menyatakan attendance berhasil sementara database, state sintetis, learning record, dan payroll tidak konsisten.

**Perbaikan wajib:** gunakan transaksi/RPC PostgreSQL untuk referensi foto, attendance, learning record, status session, dan record audit. Rollback jika ada baris wajib yang gagal. Kembalikan kegagalan dengan correlation ID, bukan sukses dengan error tersembunyi. Jangan pernah menulis state sintetis di jalur produksi.

### H-04. Validasi foto hanya memeriksa metadata, bukan isi file, dan bucket/path tidak konsisten

**Bukti:** `features/tutor/attendance/actions/attendance.actions.ts:129-161`; `lib/storage/index.ts:20-27,36-43`; `features/tutor/attendance/actions/attendance.actions.ts:144-148,347-349`.

Kode mempercayai prefix MIME data-URL dan decoding base64. Kode tidak memeriksa magic bytes, tidak menormalisasi/re-encode gambar, dan tidak membatasi input terdekode sebelum `Buffer.from`. Satu modul memakai bucket `attendance`, modul lain memakai `attendance-photos`; satu path bersifat session-wide sedangkan yang lain per-student. Error upload tetap diubah menjadi path database.

**Dampak:** file spoofed/tidak aman, kegagalan storage yang terlihat sukses, pengambilan foto yang rusak, dan kebocoran privasi jika konfigurasi bucket/path berbeda.

**Perbaikan wajib:** terima upload `File`/multipart dengan batas ukuran, validasi ukuran dan magic bytes di server, decode lalu re-encode dengan library image yang aman, gunakan satu konvensi bucket/path privat, tolak upload yang gagal, dan otorisasi setiap permintaan signed URL terhadap session terkait.

### H-05. Error database mentah dikembalikan oleh beberapa API

**Bukti:** `app/api/v1/management/tutor-rates/route.ts:12-15,41-44`; `app/api/v1/management/audit-logs/route.ts:18-21`; `app/api/v1/tutor/attendance/route.ts:23-24`; `app/api/v1/tutor/attendance/[attendanceId]/route.ts:23-24`.

Handler mengembalikan `error.message` secara langsung. Nama constraint PostgreSQL, detail tabel, dan informasi implementasi dapat terekspos ke client. Penanganan error juga tidak konsisten memakai 400 untuk kegagalan server/database.

**Perbaikan wajib:** petakan konflik domain/validasi yang terduga ke pesan aman dan kembalikan 500 generik untuk error tak terduga. Catat detail terstruktur di server beserta request ID.

### H-06. CSRF dan pengerasan cookie belum lengkap

**Bukti:** `app/api/v1/auth/login/route.ts:76-85`; `features/auth/actions/auth.actions.ts:86-97`; `middleware.ts:107-112`.

Cookie autentikasi tidak secara eksplisit `httpOnly` atau `secure`; identitas sintetis sengaja dapat dibaca JavaScript. Route yang mengubah state bergantung pada autentikasi cookie tetapi tidak terlihat adanya token CSRF/validasi origin. `last_visited_path` bukan HTTP-only dan menyimpan input client yang tidak divalidasi.

**Perbaikan wajib:** gunakan konfigurasi cookie Better Auth dengan `httpOnly`, `secure` di produksi, `sameSite` yang sesuai, dan rotasi session. Tambahkan proteksi CSRF/validasi origin untuk mutasi berbasis cookie. Jangan gunakan cookie identitas yang dapat dibaca client.

### H-07. Rate limiting dikonfigurasi untuk data user Better Auth tetapi tidak jelas diterapkan pada endpoint login kustom atau API bisnis

**Bukti:** `lib/auth/auth.ts:64-75`; `app/api/v1/auth/login/route.ts`; semua route mutasi di bawah `app/api/v1`.

Handler login kustom terpisah dari alur Better Auth yang dikonfigurasi. Tidak terlihat adanya throttling per-IP/per-akun untuk login, upload foto, pengiriman attendance, generate report, atau generate payroll.

**Perbaikan wajib:** hapus login kustom; tambahkan rate limit infrastruktur/API, batas ukuran request body, dan idempotency key untuk mutasi yang mahal atau bersifat finansial.

## Temuan Database dan Schema

### D-01. Migration dan definisi kode/type tidak konsisten

**Bukti:** migration `0001_initial_schema.sql:180-193,397-415`; `features/tutor/attendance/actions/attendance.actions.ts:175-181`; `app/api/v1/tutor/sessions/[sessionId]/route.ts:18-20`; `app/api/v1/tutor/students/route.ts:14-17`; `types/database.types.ts:536-556`.

Contoh:

- Migration tidak memiliki `profiles.role`, tetapi kode server men-select dan meng-insert-nya (`lib/auth/session.ts:149-150`; `features/auth/actions/auth.actions.ts:31-36`).
- Migration memakai `attendance.enrollment_id`, tetapi pengiriman attendance menulis `student_program_id`.
- Migration memindahkan materi pembelajaran ke `learning_records`, tetapi pengiriman attendance masih menulis `attendance.material`.
- Migration memakai `sessions.session_date`, sementara satu API men-select `actual_date`.
- Migration memodelkan student melalui `schedule_students`, sementara satu API men-select `schedules.student_id`.
- Type hasil generate masih mengekspos kolom/relasi lama, sehingga menyamarkan error ini melalui `any` dan cast.

**Dampak:** error query runtime, penulisan yang terlewat tanpa suara, UI basi, dan laporan yang salah.

**Perbaikan wajib:** pilih satu schema kanonik, generate ulang type dari migration yang berlaku, hapus field lama, dan buat CI gagal saat ada error TypeScript. Tambahkan smoke test migration yang menguji setiap query kritis terhadap database baru.

### D-02. Integritas referensial tidak menjamin integritas domain

**Bukti:** `supabase/migrations/0001_initial_schema.sql:307-365,371-415`.

Foreign key sudah ada, tetapi tidak ada constraint/trigger yang memastikan bahwa:

- `attendance.student_id` termasuk dalam schedule/group pada session tersebut;
- `attendance.enrollment_id` milik student yang sama;
- tutor/program/type pada session sesuai dengan schedule;
- enrollment student pada schedule sesuai dengan student yang dijadwalkan;
- tutor pada learning record sesuai dengan tutor session;
- sebuah session memiliki minimal satu peserta valid sebelum dinyatakan selesai.

**Perbaikan wajib:** tegakkan invariant ini di logika service/RPC transaksional dan tambahkan constraint atau deferred trigger database bila sesuai.

### D-03. Riwayat tarif memungkinkan periode berlaku yang tumpang tindih

**Bukti:** `supabase/migrations/0001_initial_schema.sql:447-465`.

Hanya `(bimbel_type_id, level, effective_from)` yang unik untuk tarif global. Tidak ada exclusion constraint yang mencegah dua tarif berlaku dengan rentang tanggal tumpang tindih untuk tutor/type/level yang sama. Payroll memakai `.find()`, sehingga urutan hasil dapat menentukan tarif mana yang menang.

**Perbaikan wajib:** tambahkan constraint rentang `EXCLUDE USING gist` PostgreSQL (dengan setup `btree_gist` yang sesuai) untuk setiap scope tarif, lalu query tepat satu tarif yang berlaku secara deterministik. Sertakan `level` dalam lookup payroll atau dokumentasikan secara eksplisit bahwa level bukan bagian dari aturan tarif.

### D-04. Total payroll agregat yang tersimpan dapat melenceng

**Bukti:** `supabase/migrations/0001_initial_schema.sql:486-516`; `features/shared/payroll/services/payroll-calculator.service.ts:29-126`.

`tutor_payments` menyimpan total sementara `tutor_payment_items` menyimpan line item. Schema tidak memiliki check atau perhitungan generated yang mengikat total ke item. Payroll juga dapat di-generate ulang tanpa penjagaan idempotency/concurrency yang terlihat.

**Perbaikan wajib:** hasilkan snapshot item yang immutable dalam satu transaksi, hitung total dari item, kunci periode pembayaran saat finalize/pay, dan tolak mutasi setelah finalisasi/pembayaran kecuali melalui alur koreksi yang teraudit.

### D-05. Cakupan RLS menyesatkan dan policy storage tidak ada di repository

**Bukti:** `supabase/migrations/0001_initial_schema.sql:771-795`; tidak ditemukan migration policy storage melalui pencarian statis.

RLS tabel database bersifat allow-all menyeluruh, dan tidak ada migration repository yang mendefinisikan bucket/policy storage privat. Kode saat ini mengasumsikan bucket sudah ada tetapi tidak menyediakan atau melindunginya.

**Perbaikan wajib:** tambahkan konfigurasi bucket dan policy storage yang reproducible. Dokumentasikan apakah akses service-role memang disengaja dan pastikan client public/anon tidak dapat menampilkan daftar atau mengunduh file attendance.

### D-06. Seed data memuat password default plaintext dan berpotensi destruktif

**Bukti:** `supabase/seed.sql:267-294,355-362`.

File seed memasukkan password plaintext ke `account.password`, meskipun komentar memperingatkan agar tidak mengimpornya. File ini juga melakukan truncate tabel operasional dengan `CASCADE` pada setiap kali seed dijalankan.

**Dampak:** kebocoran kredensial yang tidak disengaja dan kehilangan data secara destruktif jika seed dijalankan pada environment yang tidak kosong.

**Perbaikan wajib:** hapus password plaintext dari seed data yang dilacak; buat user development melalui Better Auth atau hash yang di-generate. Jadikan reset destruktif sebagai script terpisah khusus lokal dengan nama eksplisit dan gagal ketika `NODE_ENV=production`.

## Temuan Alur Bisnis

### F-01. Batas schedule, session, attendance, dan enrollment tidak ditegakkan secara konsisten

Model konseptualnya sudah baik, tetapi jalur kode masih memakai field lama schedule/student dan attendance/program. Pemanggil dapat mengirim baris attendance untuk student sembarang, dan mutasi penyelesaian memengaruhi seluruh session meski hanya satu peserta yang diproses.

**Alur yang seharusnya:** schedule mendefinisikan peserta yang direncanakan; session menyimpan snapshot tutor/program/type/peserta untuk suatu tanggal; attendance milik peserta session dan enrollment; hanya status submitted/verified yang valid yang memengaruhi penyelesaian/payroll sesuai aturan eksplisit.

### F-02. Semantik permission/reschedule belum lengkap

Database memiliki status `permission` dan `rescheduled`, tetapi jalur pengiriman attendance selalu menandai session `completed` dan view nomor pertemuan hanya memeringkat `present`/`late`. Tidak ada invariant atau workflow lengkap yang memastikan permission tidak mengurangi kuota paket dan bahwa session pengganti menyimpan riwayat.

**Perbaikan wajib:** definisikan state machine untuk session dan attendance, catat keterkaitan session pengganti, dan hitung pertemuan efektif dari aturan attendance/enrollment valid yang terverifikasi, bukan hanya dari filter status.

### F-03. Penomoran session tidak stabil saat ada koreksi atau reschedule

**Bukti:** `supabase/migrations/0001_initial_schema.sql:556-604`.

`ROW_NUMBER()` mengurutkan berdasarkan tanggal, waktu, dan `created_at` atas baris attendance saat ini. Koreksi telat, session backdate, session pengganti, atau record yang dihapus/diubah dapat menomori ulang pertemuan historis. View ini juga tidak secara eksplisit mengecualikan session sumber yang cancelled/rescheduled atau mewajibkan verifikasi.

**Perbaikan wajib:** tentukan apakah penomoran adalah nomor ledger enrollment atau nomor laporan turunan. Untuk ledger historis, tetapkan secara transaksional saat pertemuan valid diterima dan jangan pernah menghitung ulang dari baris yang mutable.

### F-04. Kelayakan payroll lebih lemah dari workflow verifikasi yang terdokumentasi

**Bukti:** `features/shared/payroll/services/payroll-calculator.service.ts:29-55,107-123`.

Payroll memasukkan semua attendance `present`/`late` tanpa memandang `verification_status`. Payroll juga tidak memeriksa bahwa attendance terikat pada enrollment yang aktif/benar atau bahwa session tidak cancelled/rescheduled. Workflow `submitted -> verified` yang terdokumentasi karena itu tidak benar-benar menjadi gerbang pembayaran.

**Perbaikan wajib:** buat status payable menjadi eksplisit, kemungkinan besar mewajibkan `verification_status = 'verified'` (menunggu konfirmasi bisnis), dan snapshot student/tarif payable yang tepat saat generate/finalisasi payroll.

### F-05. Durasi default dan nilai seed bertentangan dengan aturan bisnis yang dinyatakan

**Bukti:** `supabase/seed.sql:12-15,39-53`; `supabase/migrations/0001_initial_schema.sql:207-218`; `docs/DEVELOPMENT_STATUS_AND_RECOMMENDATIONS.md:23-24`.

Dokumentasi proyek menyatakan Reguler 60 menit, Intensif 75, Private 90, sementara seed data menyetel Reguler menjadi 75. Durasi paket juga berbeda dari bimbel type. Ini bisa jadi memang disengaja per paket, tetapi tidak dimodelkan atau dijelaskan secara konsisten.

**Perbaikan wajib:** putuskan apakah durasi melekat pada type, package, atau override schedule. Simpan durasi efektif pada snapshot session dan validasi waktu schedule terhadap aturan yang dipilih.

### F-06. Role dinamis ada di data tetapi belum menjadi alur otorisasi end-to-end

Settings dapat mengelola role/permission, tetapi type session aktif masih memakai `UserRole` yang terbatas, resolusi produksi memberi default `tutor` untuk profil yang hilang, dan pemeriksaan route memakai role hardcoded. Perubahan role mungkin baru berlaku setelah cache kedaluwarsa, dan permission kustom tidak melindungi API.

**Perbaikan wajib:** jadikan penugasan role dan lookup permission sebagai otoritatif, invalidasi session setelah perubahan keamanan, dan uji setiap permission di batas API.

## Temuan Medium

### M-01. Cache session in-memory dapat menahan perubahan otorisasi selama 45 detik dan tidak aman lintas instance

**Bukti:** `lib/auth/session.ts:40,92-96,132-133,188-190`.

Perubahan role/profil tidak langsung tercermin. Pada deployment multi-instance, setiap proses memiliki cache berbeda dan pencabutan tidak konsisten.

**Perbaikan wajib:** cache hanya data tampilan yang tidak sensitif, gunakan caching singkat dengan invalidasi eksplisit, atau gunakan mekanisme session/revocation bersama.

### M-02. Kode produksi memiliki fallback data sintetis yang luas

**Bukti:** `lib/auth/session.ts:198-221`; modul query di bawah `features/management` dan `features/tutor`; `features/tutor/attendance/actions/attendance.actions.ts:223-241`.

Error database dapat menampilkan data demo, dan mutasi dapat menulis data in-memory setelah kegagalan database. Ini menyembunyikan gangguan dan dapat membuat operator mengira penulisan berhasil padahal tidak.

**Perbaikan wajib:** kunci mode demo dengan flag build/environment eksplisit yang tidak dapat diaktifkan di produksi. Error database produksi harus gagal secara terlihat dan aman.

### M-03. Pagination query dan validasi input tidak konsisten

Banyak route handler mem-parse JSON mentah dan meneruskan nilai body langsung ke Supabase. Route tutor-rates tidak memiliki schema Zod atau validasi numerik/tanggal. Endpoint list sering memiliki limit tetap atau tanpa batasan pagination/filter.

**Perbaikan wajib:** schema Zod bersama untuk setiap mutasi/query parameter, ukuran halaman yang dibatasi, parsing UUID/tanggal, dan allowlist field sort yang aman.

### M-04. Audit log tidak selalu memuat before/after dan dapat gagal tanpa suara

**Bukti:** `supabase/migrations/0001_initial_schema.sql:542-550`; `features/tutor/attendance/actions/attendance.actions.ts:204-217,319-329`; `features/shared/sessions/services/session-generator.service.ts:202-215`.

Schema menyimpan metadata generik, tetapi banyak event hanya mencatat aksi dan sebagian field. Insert audit bukan bagian dari transaksi mutasi dan sebagian kegagalannya hanya berupa warning. Audit log juga dapat dihapus melalui akses database/service-role yang luas.

**Perbaikan wajib:** service audit terpusat dengan permission append-only yang immutable, actor/entity/request ID wajib, snapshot before/after untuk koreksi, dan transactional outbox atau insert pada transaksi yang sama.

### M-05. Helper URL foto attendance tidak memiliki otorisasi kepemilikan

**Bukti:** `features/tutor/attendance/actions/attendance.actions.ts:342-354`; `lib/storage/index.ts:36-43`.

Helper menandatangani path apa pun yang diberikan. Jika diekspos melalui server action atau route tanpa pemeriksaan kepemilikan attendance terkait, user yang mengetahui suatu path dapat memperoleh foto student lain.

**Perbaikan wajib:** terima attendance ID, muat relasi session/student/tutor-nya, otorisasi akses, lalu tandatangani path yang tersimpan. Jangan pernah menandatangani path sembarang yang dikirim client.

### M-06. Proteksi operasional dan tooling verifikasi belum ada

`package.json` tidak memiliki script eksplisit untuk typecheck, test, validasi migration, dependency audit, atau CI. Codebase memuat banyak cast `any` dan referensi schema lama. Review statis juga tidak menemukan test otorisasi API yang menyeluruh.

**Perbaikan wajib:** tambahkan `tsc --noEmit`, lint, unit/service test, API integration test, verifikasi migration dari database kosong, dependency audit, dan gate CI sebelum deployment.

## Urutan Perbaikan yang Disarankan

### P0: blokir produksi

1. Nonaktifkan/hapus login sintetis dan fallback user default.
2. Paksa validasi session Better Auth dan perkeras cookie.
3. Audit setiap route/server action untuk autentikasi dan otorisasi level objek.
4. Hentikan penggunaan kredensial service-role sebagai client serba guna; ganti policy RLS menyeluruh.
5. Perbaiki ketidaksesuaian schema/kode dan generate ulang type database.
6. Jadikan penulisan attendance transaksional dan hapus bypass yang dikendalikan pemanggil.
7. Hapus kredensial plaintext dan perilaku seed destruktif dari jalur produksi.

### P1: lindungi uang dan data sensitif

1. Terapkan otorisasi berbasis permission untuk subrole management.
2. Jadikan verifikasi attendance sebagai prasyarat payroll, atau dokumentasikan dan tegakkan alternatif yang disetujui.
3. Tambahkan constraint rentang tarif yang tumpang tindih dan snapshot payroll yang immutable.
4. Standarkan bucket storage privat, validasi upload, otorisasi signed URL, dan retensi.
5. Terapkan audit logging transaksional append-only.

### P2: perkeras operasional dan maintainability

1. Formalkan state machine session/attendance/reschedule/nomor pertemuan.
2. Tambahkan constraint/trigger/RPC invariant database untuk relasi antar tabel.
3. Hapus fallback sintetis produksi dan jalur `any` lama.
4. Tambahkan pagination, batas request, rate limiting, observability, dan pemeriksaan keamanan CI.

## Acceptance Test Minimum untuk Agent Berikutnya

- Permintaan tanpa autentikasi ke setiap halaman/API privat menghasilkan redirect/401.
- Seorang tutor tidak dapat membaca atau memutasi session, attendance, student, foto, atau payroll tutor lain.
- Role finance/HRD/kustom hanya dapat mengakses permission yang dikonfigurasi untuknya.
- Session Better Auth yang tidak valid/kedaluwarsa tidak dapat menjadi user default atau sintetis.
- Attendance tidak dapat mem-bypass jendela waktu dari input client.
- Attendance untuk student yang tidak terikat pada session ditolak.
- Kegagalan database tidak pernah mengembalikan sukses attendance dan tidak pernah menandai session selesai.
- Record permission/absent/cancelled/rescheduled tidak dihitung sebagai pertemuan efektif/payable.
- Payroll mensyaratkan status attendance yang disetujui dan memakai tepat satu tarif historis.
- Periode tarif yang tumpang tindih ditolak oleh database.
- Storage menolak MIME/konten yang dipalsukan, payload melebihi batas, dan akses foto tanpa izin.
- Setiap mutasi sensitif memiliki actor, state before, state after, timestamp, dan correlation/request ID.
- Database baru yang dibuat dari migration lulus type generation dan seluruh test query kritis.

## Keterbatasan Audit dan Keputusan Bisnis yang Masih Terbuka

Hal-hal berikut memerlukan keputusan produk yang eksplisit sebelum implementasi karena menebak dapat merusak data historis atau keuangan:

- Apakah payroll mewajibkan attendance `verified` atau status persetujuan lain.
- Apakah `late` payable dan apakah mengurangi pertemuan paket.
- Apakah penomoran session ditetapkan saat penerimaan atau diturunkan untuk laporan.
- Apakah permission otomatis membuat session pengganti dan bagaimana efeknya terhadap masa berlaku paket.
- Apakah tarif di-scope berdasarkan tutor, bimbel type, level, program, atau hierarki prioritas.
- Apakah attendance kelompok memakai satu foto bersama atau foto individual dan aturan consent/retensi apa yang berlaku.
