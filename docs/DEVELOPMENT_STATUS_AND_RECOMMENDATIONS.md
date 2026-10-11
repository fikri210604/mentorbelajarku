# Status Pengembangan Sistem & Rekomendasi Arsitektur
## Sistem Manajemen & Presensi Bimbel (Mentorbelajarku)
*Dokumen ini diperbarui secara berkala sebagai acuan kapabilitas sistem per peran (role), pencapaian milestone, serta peta jalan (roadmap) rekomendasi teknis.*

---

## 1. Matriks Fitur Berdasarkan Peran (Role-Based Feature Matrix)

### 1.1. Role Management (Pengelola & Administrator Bimbel)

| Modul / Fitur | Status | Rute / Lokasi | Deskripsi & Kapabilitas |
|---|---|---|---|
| **Dashboard Eksekutif** | **Selesai** | `/management/dashboard` | KPI metrik real-time: Total Murid Aktif, Total Tutor, Sesi Belajar Berjalan, Estimasi Pengeluaran Honor. Grafik statistik kehadiran & sebaran program bimbel. |
| **Data Murid (Master Students)** | **Selesai** | `/management/students` | CRUD murid lengkap, registrasi murid baru, pencarian instan, filter status (`active`, `inactive`, `graduated`), dan paginasi server. |
| **Detail & Riwayat Murid** | **Selesai** | `/management/students/[studentId]` | Visualisasi **Progres Pertemuan ke-X** dari total kuota paket aktif, persentase kelulusan paket, profil murid/wali/kontak WhatsApp, rincian paket terdaftar, dan log riwayat sesi kronologis. |
| **Impor Catatan Spreadsheet / Excel Lama** | **Selesai** | `/management/students/[studentId]` (Dialog Impor) | Fitur migrasi data historis murid langsung dari Google Sheets/Excel: parser cerdas mendeteksi format tanggal Indonesia, nama mentor, materi, dan nomor pertemuan. Mengisi secara atomik `sessions`, `session_students`, `attendance` (verified), dan `learning_records` sehingga absensi di aplikasi baru langsung melanjutkan nomor pertemuan berikutnya (misal lanjut ke P4). |
| **Laporan Perkembangan Murid (Cetak PDF A4)** | **Selesai** | `/management/students/[studentId]/progress-report`<br>`/management/progress-reports` | Kompilasi dinamis riwayat pertemuan murid langsung ke lembar evaluasi resmi format Google Sheets: Kop Banner hijau tua dual logo (Semesta Abhana & Mentorbelajarku), tabel materi `#9bbad6`, nomor pertemuan efektif, mentor pengajar. |
| **Popup Edit Keterangan Evaluasi** | **Selesai** | Modal Dialog di halaman laporan | Manajemen dapat menambahkan atau mengedit keterangan evaluasi/catatan dan materi per pertemuan sebelum dicetak. Aksi dibatasi hanya **Edit** dan **Cetak** (tanpa aksi hapus & tambah baris liar). |
| **Ekspor PDF Vektor Cepat (0 ms)** | **Selesai** | Tombol Cetak / Export PDF | Menggunakan Native Browser Vector Print Engine (`window.print()` + `@media print` CSS) menghasilkan cetakan/PDF A4 tajam 100% presisi tanpa membebani server/RAM. |
| **Data Tutor (Master Tutors & CRUD)** | **Selesai + Auto Provisioning + Etika Islami** | `/management/tutors`<br>`/management/tutors/[tutorId]` | CRUD tutor lengkap untuk Admin/Owner/HRD: Tambah tutor baru dengan pembuatan akun Better Auth otomatis (`user` + `account` credential), pemilihan gender dengan panggilan kehormatan Islami (**Laki-laki: Abi**, **Perempuan: Umi**), pembuatan password default otomatis (`Mbk{4digit}!{chars}`), pengiriman email kredensial resmi bertata karma Islami (salam pembuka & penutup lengkap), tombol salin kredensial/format WA 1-klik yang sopan tanpa duplikasi panggilan, ubah biodata & kontak, reset kredensial, proteksi hapus berelasi (hard delete vs soft deactivation), serta pencatatan jejak audit `audit_logs`. Migration `0008`. |
| **Jadwal Rutin (Schedules & Master Edit)** | **Selesai + Recurring + Full Edit** | `/management/schedules`<br>`/management/schedules/[scheduleId]/edit` | Pembuatan & pengeditan jadwal rutin mingguan (hari, jam, tipe bimbel, program studi, tutor, murid/kelompok, lokasi, catatan). Pengulangan eksplisit ala kalender — multi-hari (`days_of_week[]`), terminasi count xor until, interval 1–12 minggu, pratinjau tanggal. Halaman edit master lengkap (`/management/schedules/[id]/edit`) dengan sinkronisasi otomatis ke sesi mendatang yang berstatus `scheduled` dan pencatatan jejak audit. |
| **Sesi Pembelajaran Aktual & Edit Scope (Sessions)** | **Selesai + Google Calendar Scope** | `/management/sessions`<br>`/management/sessions/[sessionId]` | Pencatatan kejadian sesi nyata per tanggal kalender. Mendukung dialog **Edit Jadwal Sesi ala Google Calendar** dengan 3 cakupan simpan: (1) **Hanya Sesi Ini** (`this_session`), (2) **Sesi Ini dan Seterusnya** (`this_and_following` / split recurrence aman memotong seri lama dan menerbitkan seri baru), (3) **Seluruh Sesi** (`all_sessions` untuk seri berulang). Riwayat sesi berstatus `completed` atau yang sudah memiliki presensi/honor diproteksi penuh dan tidak dimutasi (immutable history). |
| **Monitoring Presensi (Attendance)** | **Selesai** | `/management/attendance` | Verifikasi kehadiran seluruh kelas harian, preview foto bukti absensi dari kamera tutor, status multi-opsi (Hadir, Sakit, Izin, Terlambat, Alfa). |
| **Honor & Payroll Tutor** | **Selesai** | `/management/payroll`<br>`/management/payroll/[id]` | Kalkulasi otomatis di server: `fee = rate × payable_students`. Menggunakan tarif historis (`effective_from` - `effective_until`). **Fitur Audit Bulanan**: Preview thumbnail foto bukti belajar, modal lightbox resolusi penuh, verifikasi foto instan (`verified`), pengajuan koreksi foto (`correction_requested`) dengan catatan instruksi, serta opsi mengeluarkan sesi dari draft. Konfirmasi pembayaran mencatat nomor referensi transfer bank (`payment_reference`) dan status `paid`. |
| **Konfigurasi Bimbel (Settings)** | **Selesai** | `/management/settings/*` | Pengaturan Program Studi, Jenis Bimbel (Reguler 60m, Intensif 75m, Private 90m), dan Konfigurasi Tarif Tutor per Jenis Bimbel. |
| **Audit Logs** | **Selesai** | `/management/audit-logs` | Jejak audit otomatis mencatat *who, what, when, before, after* untuk mutasi data sensitif (koreksi absensi, audit foto dari payroll, perubahan tarif, status payroll). |
| **Notifikasi & Pengingat Push** | **Selesai** | `/management/settings/notifications` | Konfigurasi global notifikasi push tutor: sakelar utama, notifikasi jadwal baru, pengingat sebelum sesi (`before_minutes`, diulang `repeat_count`× setiap `repeat_interval_minutes`), dan pengingat setelah sesi (`after_minutes`, hanya bila presensi belum diisi). Dibatasi permission dinamis `notification:manage`. Migration `0007`. |

---

### 1.2. Role Tutor (Pengajar)

| Modul / Fitur | Status | Rute / Lokasi | Deskripsi & Kapabilitas |
|---|---|---|---|
| **Dashboard Tutor** | **Selesai** | `/tutor/dashboard` | Agenda mengajar hari ini, jadwal sesi terdekat, metrik murid binaan, estimasi honor berjalan bulan ini, dan **banner peringatan perbaikan foto presensi** jika diminta oleh manajemen. |
| **Jadwal Mengajar Mandiri** | **Selesai** | `/tutor/schedules` | Kalender dan jadwal mengajar pribadi (harian dan mingguan). |
| **Presensi Kamera Browser (`react-webcam`)** | **Selesai** | `/tutor/sessions/[sessionId]` | Pengambilan foto bukti absensi murid langsung melalui kamera gawai/laptop, tombol ambil ulang, kompresi client, dan validasi gambar. Mendukung unggah ulang foto jika diminta koreksi oleh manajemen (status otomatis kembali menjadi `submitted`). |
| **Input Materi & Evaluasi Sesi** | **Selesai** | Form Absensi Tutor | Pengisian materi yang diajarkan, catatan pemahaman murid, dan status kehadiran per murid saat sesi berlangsung. |
| **Data Murid Binaan** | **Selesai** | `/tutor/students` | Melihat profil ringkas murid yang diampu beserta riwayat belajar dan catatan pertemuan sebelumnya. |
| **Transparansi Honor Mandiri** | **Selesai** | `/tutor/payroll` | Rincian honor per sesi mengajar, status pencairan (`draft`, `processed`, `paid`), tanggal pembayaran riil, dan **nomor referensi bukti transfer bank** dari manajemen. |
| **Notifikasi Push & Toggle Profil** | **Selesai** | `/tutor/profile` | Toggle sakelar (shadcn Switch) untuk mengaktifkan/mematikan notifikasi, pendaftaran perangkat Web Push (VAPID + Service Worker), dan tombol kirim uji coba. Tutor menerima notifikasi jadwal baru serta pengingat sebelum/sesudah sesi. |
| **Pusat Notifikasi & Lonceng Interaktif (In-App Bell)** | **Selesai** | Header Tutor (`TutorHeader`) | Popover lonceng dinamis dengan badge jumlah notifikasi unread merah (real-time poll 60d), daftar riwayat notifikasi jadwal/pengingat/uji coba, penanda waktu relatif Indonesia, navigasi 1-klik ke sesi mengajar, aksi tandai dibaca per item maupun sekaligus, dan tautan cepat ke pengaturan akun. Didukung migration `0009`. |

---

### 1.3. Pondasi & Arsitektur Global (Shared Infrastructure)

1. **Design System & Global Color Tokens**:
   - Status semantik (`success`, `warning`, `info`, `danger`) didefinisikan secara native pada level CSS di `app/globals.css` (`:root`, `.dark`, `@theme inline`).
   - Terintegrasi langsung ke atom UI `Badge` dan `Button` (`variant="success"`, `variant="soft-warning"`, dll).
2. **Optimasi Performa Query Database**:
   - Menghilangkan *query waterfall* menggunakan `Promise.all` paralel pada Server Components dan Services.
   - *Fast-path resolver* in-memory untuk data prototipe (`std-*`, `SYNTHETIC_STUDENTS`, `SYNTHETIC_ATTENDANCE`).
   - Validasi regex format UUID untuk mencegah error PostgreSQL type-cast saat id string diteruskan ke query.
   - *Selective column projection* untuk mencegah query `SELECT *` yang berat.
   - Caching menggunakan React `cache()` memoization.
3. **Keamanan & Otorisasi Ketat**:
   - Single source of truth autentikasi menggunakan **Better Auth** (tidak menduplikasi dengan Supabase Auth).
   - Server-side authorization check pada setiap Server Action dan Route Handler (`requireAuthUser()`, `requireRole()`).

---

## 2. Rekomendasi Pengembangan Sistem (System Recommendations)

Berikut adalah rekomendasi teknis dan bisnis terstruktur untuk membawa sistem bimbingan belajar ini ke tingkat produksi (production-ready) yang handal:

### 2.1. Penanganan File, Gambar & Media Storage

1. **Kompresi Gambar Sisi Klien Sebelum Upload (Client-Side Compression)**:
   - **Kondisi**: Kamera browser (`react-webcam`) dapat menghasilkan foto beresolusi tinggi (3MB – 6MB per jepretan). Jika diunggah langsung, dapat memperlambat tutor saat menggunakan jaringan seluler di lokasi mengajar.
   - **Rekomendasi**: Integrasikan library kompresi berbasis HTML5 Canvas ringan (misalnya `browser-image-compression`):
     - Maksimal ukuran file: ~200 KB per foto.
     - Format: WebP atau JPEG teroptimasi (lebar maks 1280px).
     - Keuntungan: Kecepatan upload meningkat hingga 10x, konsumsi kuota tutor hemat, dan kapasitas Supabase Storage awet.
2. **Private Storage Bucket & Signed URLs**:
   - **Kondisi**: Foto absensi murid mengandung data pribadi siswa di bawah umur.
   - **Rekomendasi**: Pastikan bucket Supabase Storage diset ke `private` (bukan public).
   - Akses foto hanya diizinkan via temporary Signed URL (kedaluwarsa dalam 1–2 jam) atau di-stream melalui Route Handler terautentikasi (`/api/v1/attendance/photos/[photoId]`).
3. **Struktur Path & Lifecycle Retention Policy**:
   - Terapkan struktur direktori:
     ```text
     attendance/{year}/{month}/{session_id}/{student_id}.webp
     ```
   - Buat policy arsip: Foto absensi berusia di atas 12 bulan dapat diarsipkan ke cold-storage atau dihapus jika batas audit telah selesai, sedangkan catatan teks materi tetap tersimpan permanen di database.

---

### 2.2. Rekomendasi Fitur Laporan Perkembangan Murid

1. **Pengiriman Laporan Otomatis via WhatsApp (WhatsApp Notification Integration)**:
   - Tambahkan tombol **"Kirim Rapor ke WhatsApp Wali"** pada lembar laporan perkembangan murid.
   - Menggunakan penyedia WhatsApp Gateway (misal Fonnte, Wablas, atau WhatsApp Cloud API) untuk mengirimkan pesan ringkasan:
     > *"Halo Bpk/Ibu [Nama Wali], berikut Laporan Perkembangan Belajar ananda [Nama Murid] di Bimbel Mentorbelajarku untuk Paket [Nama Paket]. Silakan unduh PDF resmi melalui tautan berikut: [Link Laporan]"*
2. **Filter Periode per Paket Belajar (8 / 12 Pertemuan)**:
   - Saat ini tabel memuat seluruh riwayat sesi murid secara berurutan.
   - Tambahkan dropdown filter paket:
     - *Paket 1 (Pertemuan 1 – 8)*
     - *Paket 2 (Pertemuan 9 – 16)*
   - Keuntungan: Memastikan lembar cetak A4 selalu rapi muat dalam 1–2 halaman standar tanpa terpotong acak jika murid sudah belajar hingga puluhan pertemuan.
3. **Digital Signature / Stempel Resmi Opsional**:
   - Manajemen dapat mengunggah gambar stempel transparan atau tanda tangan digital pengelola untuk langsung tercetak di kolom tanda tangan lembar evaluasi.

---

### 2.3. Rekomendasi Fitur Presensi & Sesi Belajar

1. **Mode Presensi Cepat Kelas Kelompok (Batch Attendance)**:
   - Pada kelas kelompok (3–6 murid), tutor dapat mengklik satu tombol **"Hadirkan Semua"**, lalu hanya mengubah status murid yang tidak hadir (Sakit/Izin/Alfa).
   - Mendukung opsi 1 foto bersama (*group class photo*) untuk mengabsen seluruh murid sekaligus dalam 1 sesi.
2. **Otomatisasi Pembangkitan Sesi (Automated Session Generator via Cron)** *(Selesai Diimplementasikan - 10 Okt 2026)*:
   - Endpoint terproteksi `/api/v1/sessions/cron-generate` (otentikasi via `CRON_SECRET` atau hak `session:create`).
   - Otomatis mengevaluasi jadwal berulang untuk 7 hari ke depan (WIB `Asia/Jakarta`).
   - Tercatat otomatis di audit trail server (`SESSION_CRON_GENERATED`).
3. **Snapshot Peserta Sesi Pembelajaran (`session_students`)** *(Selesai Diimplementasikan - 10 Okt 2026)*:
   - Migration `0006_session_students_snapshot.sql` membekukan peserta murid pada setiap sesi yang dibangkitkan.
   - Perubahan murid pada jadwal rutin di masa kini tidak akan merusak riwayat dan peserta sesi di masa lalu.
   - Terintegrasi atomik pada `SessionGeneratorService`, validasi presensi `attendance.service.ts`, dan query sesi portal.
4. **Alur Izin & Reschedule Terpadu**:
   - Ketika murid berstatus `permission` (Izin), sistem memberikan notifikasi kepada manajemen untuk menjadwalkan sesi pengganti (*reschedule slot*) agar hak pertemuan murid terpenuhi sebelum masa aktif paket berakhir.

---

### 2.4. Rekomendasi Fitur Payroll & Keuangan

1. **Approval Workflow & Audit Presensi Bulanan** *(Selesai Diimplementasikan)*:
   - Alur status berjenjang: `Draft` (generate sesi aktual) → `Processed` (difinalisasi Finance setelah audit foto) → `Paid` (ditandai lunas beserta nomor referensi transfer bank & catatan).
   - Audit foto presensi per sesi langsung dari detail payroll dengan lightbox resolusi penuh dan aksi minta koreksi tutor.

2. **Cetak Slip Gaji & Lembar Penggajian Resmi (A4 Sheet)** *(Selesai Diimplementasikan)*:
   - Lembar penggajian tutor format A4 siap cetak (`/management/payroll` & `/tutor/payroll`) dengan kop resmi, rekapitulasi kehadiran per murid, dan ringkasan honor bersih.

3. **Pencairan Honor Mandiri & Otomatisasi via Payment Gateway (Self-Payout / QR Payout Link)** *(Rekomendasi Roadmap)*:
   - **Latar Belakang & Konsep**:
     Untuk mengeliminasi proses transfer manual satu per satu via m-Banking yang memakan waktu dan berisiko salah input nominal, bimbel dapat mengintegrasikan API Disbursement / Payouts dari payment gateway (seperti **Xendit Payout Links / Disburse API**, **Midtrans Iris**, atau **Flip for Business**).
   - **Mekanisme Pencairan Mandiri (Self-Claim QR Code / Payout Link)**:
     - Pada tanggal cut-off penggajian yang dikonfigurasi (misalnya setiap tanggal 7 setiap bulan), sistem secara otomatis mengaktifkan **QR Code / Tombol Klaim Honor** di dashboard tutor untuk payroll yang telah difinalisasi (`processed`).
     - Tutor memindai QR Code tersebut menggunakan kamera ponsel atau mengklik tombol *"Cairkan Honor Sekarang"*.
     - Tautan membuka halaman pencairan resmi payment gateway yang aman.
     - Tutor bebas memilih rekening tujuan pencairan:
       - **Rekening Bank**: BCA, Mandiri, BRI, BNI, BSI, CIMB Niaga, Bank Jago, dsb.
       - **E-Wallet**: GoPay, OVO, DANA, ShopeePay, LinkAja.
     - Tutor mengonfirmasi penarikan, dan payment gateway mentransfer dana secara *real-time* detik itu juga.
     - Webhook payment gateway otomatis mengirim callback ke server bimbel:
       - Status payroll otomatis beralih menjadi `paid`.
       - Waktu pembayaran (`paid_at`) dan nomor referensi transfer bank resmi (`payment_reference`) tercatat otomatis tanpa intervensi manual tim Finance.
   - **Opsi Alternatif (1-Click Batch Disburse oleh Finance)**:
     - Tutor mendaftarkan nomor rekening dan bank di halaman profil tutor.
     - Pada tanggal gajian, Finance cukup menekan satu tombol *"Kirim Honor Seluruh Tutor via Payment Gateway"*, dan sistem mengeksekusi transfer massal ke seluruh rekening tutor sekaligus dalam hitungan detik.
   - **Prasyarat & Pertimbangan Operasional**:
     - *Pre-funded Balance*: Bimbel melakukan deposit saldo ke akun payment gateway sebelum tanggal penggajian agar saldo mencukupi saat ditarik.
     - *Biaya Disburse*: Biaya per transaksi transfer (umumnya Rp2.000 – Rp4.000 per transfer sukses) dapat ditanggung lembaga sebagai benefit tutor atau dikonfigurasi sebagai biaya administrasi.
     - *Verifikasi Bisnis (KYB)*: Memerlukan pendaftaran dan verifikasi akun bisnis pada penyedia payment gateway terkait.

---

### 2.5. Push Notification & Pengingat Presensi Otomatis (Attendance Reminder System)

> **STATUS (10 Oktober 2026): Diimplementasikan.**
> Web Push + VAPID + Service Worker (`public/sw.js`) telah aktif. Konfigurasi global di `/management/settings/notifications`, toggle tutor di `/tutor/profile`, dispatcher cron di `/api/v1/web-push/dispatch`, dan notifikasi jadwal baru dipicu dari Server Action `createSchedule`. Migration `0007`. Yang belum: fallback WhatsApp gateway dan rekapitulasi malam ke Manajemen.

1. **Latar Belakang & Urgensi**:
   - Salah satu tantangan terbesar operasional bimbel adalah tutor terlambat atau lupa melakukan presensi tepat waktu saat sesi selesai. Keterlambatan input absensi berdampak berantai pada validitas data, keterlambatan pelaporan ke wali murid, dan keterlambatan kalkulasi payroll honor.
2. **Skenario Pengingat Terjadwal**:
   - **Pengingat Pra-Sesi (H-30 menit & H-15 menit)**:
     - Notifikasi muncul di ponsel/browser tutor:
       > *"Sesi Belajar Segera Dimulai: Kelas [Nama Program] bersama ananda [Nama Murid] dijadwalkan pukul [Jam Mulai]. Mohon siapkan kamera untuk absensi."*
     - Mengarahkan langsung (*deep link*) ke tombol buka form absensi sesi.
   - **Pengingat Pasca-Sesi (H+15 menit setelah jadwal selesai jika belum absen)**:
     - Notifikasi eskalasi:
       > *"Sesi Belajar Telah Selesai: Anda belum mengunggah foto presensi & catatan materi untuk sesi [Nama Murid]. Segera input sekarang."*
   - **Rekapitulasi Malam untuk Manajemen (Pukul 21:00)**:
     - Notifikasi ringkasan kepada Manajemen berisi daftar sesi pada hari tersebut yang belum diabsen atau membutuhkan verifikasi khusus.
3. **Arsitektur Teknis**:
   - **Primary (Web Push API + PWA Service Worker)**: Menggunakan standar Web Push (VAPID key) sehingga notifikasi langsung muncul di lockscreen HP atau desktop tutor tanpa harus membuka tab browser.
   - **Fallback (WhatsApp Notification Bot)**: Menggunakan gateway WhatsApp API (Fonnte / Wablas) jika tutor tidak mengaktifkan notifikasi browser atau sedang offline dari web.
   - **Scheduler**: Menggunakan Cron background (Supabase `pg_cron` atau edge scheduled function) yang mengecek tabel `sessions` aktif setiap 15 menit.

---

### 2.6. Master Mata Pelajaran & Kurikulum Materi (Curriculum & Subject Topics Master)

### 2.6. Master Mata Pelajaran, Kurikulum Materi & Penjadwalan Terpusat oleh Admin (Admin-Directed Curriculum & Scheduling)

1. **Konsep & Filosofi Bisnis**:
   - Kurikulum dan silabus belajar dikontrol **100% oleh Admin / Manajemen**.
   - Tutor tidak dibebani untuk menyusun materi sendiri saat di kelas. Admin yang menentukan standar mutu pengajaran dan bahan ajar yang harus diberikan pada setiap sesi pertemuan.
2. **Alur Kerja Terpadu (End-to-End Workflow)**:
   - **Langkah 1: Admin Kelola Master Mapel & Silabus**:
     - Admin mengelola master mata pelajaran (`subjects`) dan bab kurikulum (`curriculum_topics`) per jenjang kelas.
   - **Langkah 2: Admin Menugaskan Materi & Worksheet pada Jadwal**:
     - Saat Admin membuat jadwal rutin (`schedules`) atau sesi belajar (`sessions`), Admin langsung menetapkan:
       - **Mata Pelajaran**: (Contoh: *Matematika*)
       - **Materi / Bab yang Diajarkan**: (Contoh: *Bab 3 - Operasi Hitung Pecahan*)
       - **Worksheet Pembelajaran**: Menautkan file latihan soal yang harus dikerjakan siswa.
   - **Langkah 3: Tutor Otomatis Mengetahui Materi & Unduh Worksheet**:
     - Saat tutor membuka agenda mengajar di dashboard, tutor **langsung mengetahui secara otomatis mapel dan materi** yang harus diajarkan.
     - Pada kartu jadwal/sesi, tersedia tombol **"Unduh Worksheet (PDF)"** sehingga tutor dapat langsung mencetak atau membukanya di tablet sebelum kelas dimulai.
   - **Langkah 4: Presensi Otomatis & Cepat**:
     - Saat sesi selesai, form absensi tutor **sudah otomatis terisi (*pre-populated*)** dengan mapel dan materi yang ditetapkan admin.
     - Tutor **hanya perlu melakukan absensi** (jepret foto kamera murid dan pilih status kehadiran Hadir/Izin/Sakit), serta mengisi catatan evaluasi singkat pemahaman anak jika diperlukan.

3. **Rekomendasi Skema Database**:
   - **Tabel `subjects` (Master Mata Pelajaran)**:
     ```sql
     CREATE TABLE subjects (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       code VARCHAR(20) UNIQUE NOT NULL, -- Contoh: 'MATH-SD', 'IPAS-SD'
       name VARCHAR(100) NOT NULL,       -- Contoh: 'Matematika', 'IPAS'
       level VARCHAR(20) NOT NULL,       -- 'SD', 'SMP', 'SMA'
       status VARCHAR(20) DEFAULT 'active'
     );
     ```
   - **Tabel `curriculum_topics` (Master Bab / Silabus Materi)**:
     ```sql
     CREATE TABLE curriculum_topics (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
       grade VARCHAR(20) NOT NULL,       -- Contoh: '4 SD', '5 SD'
       chapter_number INT NOT NULL,      -- 1, 2, 3...
       title VARCHAR(150) NOT NULL,      -- 'Pecahan dan Operasi Hitung Campuran'
       description TEXT,
       created_at TIMESTAMPTZ DEFAULT NOW()
     );
     ```
   - **Relasi ke Tabel `sessions` & `schedules`**:
     - Tambahkan kolom relasi:
       - `subject_id UUID REFERENCES subjects(id)`
       - `topic_id UUID REFERENCES curriculum_topics(id)`
       - `worksheet_id UUID REFERENCES learning_materials(id)`
       - `target_material TEXT` (Materi yang sudah diset admin untuk sesi ini)

---

### 2.7. Manajemen Modul Ajar & Worksheet Siap Unduh (Worksheet Management & Instant Tutor Download)

1. **Latar Belakang & Kebutuhan**:
   - Menghilangkan proses manual di mana tutor harus mencari bahan ajar sendiri atau meminta materi via WhatsApp ke admin.
   - Semua modul bimbingan, lembar kerja siswa (*worksheet*), dan kisi-kisi PTS/PAS dikelola terpusat oleh Admin.
2. **Pustaka Worksheet Digital (Supabase Storage Bucket `learning-materials`)**:
   - Admin mengunggah file lembar kerja (PDF/Docx) ke bucket penyimpanan dengan struktur:
     ```text
     learning-materials/{subject_code}/{grade}/{topic_id}/{worksheet_name}.pdf
     ```
   - **Tabel `learning_materials`**:
     - `id`, `subject_id`, `topic_id`, `grade`, `title`, `description`
     - `file_path`, `file_size_bytes`, `file_type` (`worksheet`, `module`, `exam_prep`, `answer_key`)
     - `uploaded_by`
3. **Kemudahan untuk Tutor (Instant Access)**:
   - **Di Halaman Sesi / Detail Jadwal Mengajar Tutor**:
     - Muncul banner: *Materi Hari Ini: [Judul Bab]* beserta tombol jelas:
       `[ 📥 Unduh Worksheet Siswa (PDF) ]`
     - Tutor tinggal mengklik tombol untuk langsung mengunduh lembar soal hari itu tanpa ribet mencari file di folder lain.
   - **Laporan Perkembangan Murid Otomatis Rapi**:
     - Pada laporan evaluasi yang dicetak, materi yang diajarkan selalu konsisten mengikuti silabus resmi yang ditentukan admin, tanpa ada perbedaan istilah antar tutor.


---

### 2.8. Rekomendasi Keandalan Data (Data Reliability & Architecture)

1. **Soft Delete Policy (`deleted_at`)**:
   - Jangan melakukan `HARD DELETE` pada tabel `students` atau `tutors`.
   - Gunakan kolom `deleted_at TIMESTAMP WITH TIME ZONE`. Ketika murid nonaktif atau berhenti, tandai `deleted_at = NOW()`.
   - Hal ini menjaga relasi data historis (presensi masa lalu, laporan keuangan lama, dan audit log) tetap utuh dan valid.
2. **Database View & Generated Columns**:
   - Manfaatkan view PostgreSQL `v_attendance_with_meeting_number` yang sudah dibuat untuk memastikan nomor pertemuan dihitung secara matematis di database server, bukan ditebak di antarmuka frontend.
3. **Progressive Web App (PWA) Offline Support**:
   - Konfigurasi PWA sederhana dengan Service Worker agar tutor di lokasi yang sinyalnya naik-turun tetap dapat membuka halaman absensi dan menyimpan draf presensi secara lokal (IndexedDB) sebelum tersinkronisasi saat online kembali.

---

### 2.9. Fitur Migrasi Data: Impor Riwayat Pertemuan Spreadsheet / Excel per Murid (Status: Selesai)

1. **Latar Belakang & Implementasi**:
   - Memfasilitasi admin bimbingan belajar untuk memasukkan data pertemuan terdahulu dari lembar kerja Google Sheets / Excel langsung ke sistem baru.
   - Tersedia di halaman Detail Murid (`/management/students/[studentId]`) via modal dialog interaktif `ImportHistoricalSessionsDialog`.
2. **Fitur Unggulan**:
   - **Multi-Sheet Excel (.xlsx / .xls) & Copy-Paste**: Admin dapat mengunggah file workbook Excel utuh atau menyalin teks langsung. Sistem membaca seluruh sheet, mencocokkan nama murid di tiap lembar, dan otomatis memilih lembar yang sesuai dengan murid yang dibuka.
   - **Ekstraksi Metadata Cerdas**: Membaca otomatis `Nama Murid`, `Kelas`, `Jadwal`, dan `Mapel`, memvalidasi apakah nama murid di sheet cocok dengan profil murid di sistem.
   - **Deteksi Siklus Paket (Batch Cycles)**: Mengidentifikasi pembatas evaluasi (seperti `"Pencapaian dan Evaluasi"`) atau reset nomor pertemuan dari 8 ke 1.
   - **Tombol Filter Cepat**:
     - *Pilih Paket Berjalan Saja (Rekomendasi)*: Memilih hanya sesi paket aktif (misal 3 sesi terakhir) agar absensi tutor berikutnya otomatis berlanjut ke **Pertemuan ke-4**.
     - *Pilih Semua (Seluruh Riwayat)*: Mengimpor seluruh 11 sesi; paket lama (P1–P8) otomatis ditandai `completed`, dan paket aktif (P1–P3) ditandai `active`.
   - **Pencocokan Mentor Otomatis**: Nama tutor seperti *"Abi Yoko"*, *"Abi Govin"*, *"Abi Hanif"*, *"Umi Elsa"* dicocokkan otomatis ke database tutor dengan opsi ganti tutor per baris.
3. **Arsitektur Teknis**:
   - Server Action `importStudentHistoricalSessionsAction` menulis secara atomik ke tabel `sessions`, `session_students`, `attendance` (verified), `learning_records`, dan mencatat `audit_logs`.
   - Penomoran pertemuan murni diturunkan dari view `v_attendance_with_meeting_number` tanpa hardcoding nomor pertemuan di database.


