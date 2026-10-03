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
| **Laporan Perkembangan Murid (Cetak PDF A4)** | **Selesai** | `/management/students/[studentId]/progress-report`<br>`/management/progress-reports` | Kompilasi dinamis riwayat pertemuan murid langsung ke lembar evaluasi resmi format Google Sheets: Kop Banner hijau tua dual logo (Semesta Abhana & Mentorbelajarku), tabel materi `#9bbad6`, nomor pertemuan efektif, mentor pengajar. |
| **Popup Edit Keterangan Evaluasi** | **Selesai** | Modal Dialog di halaman laporan | Manajemen dapat menambahkan atau mengedit keterangan evaluasi/catatan dan materi per pertemuan sebelum dicetak. Aksi dibatasi hanya **Edit** dan **Cetak** (tanpa aksi hapus & tambah baris liar). |
| **Ekspor PDF Vektor Cepat (0 ms)** | **Selesai** | Tombol Cetak / Export PDF | Menggunakan Native Browser Vector Print Engine (`window.print()` + `@media print` CSS) menghasilkan cetakan/PDF A4 tajam 100% presisi tanpa membebani server/RAM. |
| **Data Tutor (Master Tutors)** | **Selesai** | `/management/tutors` | Pengelolaan data tutor pengajar, spesialisasi mapel, status keaktifan, murid binaan, dan histori mengajar. |
| **Jadwal Rutin (Schedules)** | **Selesai** | `/management/schedules` | Pembuatan jadwal rutin mingguan (hari, jam, tipe bimbel, program studi, tutor, murid/kelompok). |
| **Sesi Pembelajaran Aktual (Sessions)** | **Selesai** | `/management/sessions` | Pencatatan kejadian sesi nyata per tanggal kalender. Mendukung pergantian tutor pengganti (*substitute tutor*), pembatalan, dan penjadwalan ulang (*rescheduling*). |
| **Monitoring Presensi (Attendance)** | **Selesai** | `/management/attendance` | Verifikasi kehadiran seluruh kelas harian, preview foto bukti absensi dari kamera tutor, status multi-opsi (Hadir, Sakit, Izin, Terlambat, Alfa). |
| **Honor & Payroll Tutor** | **Selesai** | `/management/payroll` | Kalkulasi otomatis di server: `fee = rate × payable_students`. Menggunakan tarif historis berbasis periode masa berlaku (`effective_from` - `effective_until`). Alur: Generate Draft -> Review Sesi -> Finalisasi -> Bayar. |
| **Konfigurasi Bimbel (Settings)** | **Selesai** | `/management/settings/*` | Pengaturan Program Studi, Jenis Bimbel (Reguler 60m, Intensif 75m, Private 90m), dan Konfigurasi Tarif Tutor per Jenis Bimbel. |
| **Audit Logs** | **Selesai** | `/management/audit-logs` | Jejak audit otomatis mencatat *who, what, when, before, after* untuk mutasi data sensitif (koreksi absensi, perubahan tarif, payroll). |

---

### 1.2. Role Tutor (Pengajar)

| Modul / Fitur | Status | Rute / Lokasi | Deskripsi & Kapabilitas |
|---|---|---|---|
| **Dashboard Tutor** | **Selesai** | `/tutor/dashboard` | Agenda mengajar hari ini, jadwal sesi terdekat, metrik murid binaan, dan estimasi honor berjalan bulan ini. |
| **Jadwal Mengajar Mandiri** | **Selesai** | `/tutor/schedules` | Kalender dan jadwal mengajar pribadi (harian dan mingguan). |
| **Presensi Kamera Browser (`react-webcam`)** | **Selesai** | `/tutor/sessions/[sessionId]` | Pengambilan foto bukti absensi murid langsung melalui kamera gawai/laptop, tombol ambil ulang, dan validasi gambar. |
| **Input Materi & Evaluasi Sesi** | **Selesai** | Form Absensi Tutor | Pengisian materi yang diajarkan, catatan pemahaman murid, dan status kehadiran per murid saat sesi berlangsung. |
| **Data Murid Binaan** | **Selesai** | `/tutor/students` | Melihat profil ringkas murid yang diampu beserta riwayat belajar dan catatan pertemuan sebelumnya. |
| **Transparansi Honor Mandiri** | **Selesai** | `/tutor/payroll` | Rincian honor per sesi mengajar yang telah divalidasi dan status pencairan dari manajemen. |

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
2. **Otomatisasi Pembangkitan Sesi (Automated Session Generator via Cron)**:
   - Jadwal rutin mingguan (`schedules`) di-generate menjadi sesi aktual (`sessions`) secara otomatis setiap minggu menggunakan Background Cron / Supabase `pg_cron`.
   - Tutor tidak perlu menginput sesi secara manual; saat hari mengajar tiba, sesi sudah otomatis siap di dashboard tutor.
3. **Alur Izin & Reschedule Terpadu**:
   - Ketika murid berstatus `permission` (Izin), sistem memberikan notifikasi kepada manajemen untuk menjadwalkan sesi pengganti (*reschedule slot*) agar hak pertemuan murid terpenuhi sebelum masa aktif paket berakhir.

---

### 2.4. Rekomendasi Fitur Payroll & Keuangan

1. **Cetak Slip Gaji Tutor Digital (PDF Slip Honor)**:
   - Menambahkan fitur ekspor Slip Gaji Tutor per bulan dengan format rapi (memuat rincian sesi, murid terbayar, nominal tarif, bonus/potongan, dan total honor bersih).
2. **Approval Workflow Payroll**:
   - Alur status berjenjang:
     - `Draft Kalkulasi` (sistem menghitung sesi riil)
     - `Review Manajemen` (koreksi bonus/potongan manual)
     - `Disetujui (Approved)`
     - `Dibayarkan (Paid)` (dengan lampiran bukti transfer bank)

---

### 2.5. Push Notification & Pengingat Presensi Otomatis (Attendance Reminder System)

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

