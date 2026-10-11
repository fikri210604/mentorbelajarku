# 🎓 Mentor Belajarku — Sistem Manajemen & Presensi Bimbel Terpadu

<p align="center">
  <img src="public/logo.jpg" alt="Mentor Belajarku Logo" width="120" style="border-radius: 16px;" />
</p>

<p align="center">
  <strong>Platform manajemen operasional bimbingan belajar dan les privat modern: penjadwalan cerdas ala Google Calendar, presensi berfoto kamera langsung, pelaporan rapor evaluasi resmi, otomasi payroll honor tutor, serta notifikasi push & lonceng in-app interaktif.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15%20App%20Router-black?style=flat&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL_%26_Storage-3ECF8E?style=flat&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Auth-Better_Auth-purple?style=flat" alt="Better Auth" />
  <img src="https://img.shields.io/badge/UI-shadcn%2Fui-black?style=flat" alt="shadcn/ui" />
  <img src="https://img.shields.io/badge/Status-Production_Ready-emerald?style=flat" alt="Production Ready" />
</p>

---

## 📌 Tentang Project

**Mentor Belajarku** adalah sistem informasi manajemen dan absensi modern yang dirancang khusus untuk lembaga bimbingan belajar (bimbel) dan les privat di Kemiling, Bandar Lampung.

Aplikasi ini mendigitalkan seluruh siklus operasional bimbel—mulai dari pendaftaran murid, penugasan tutor, penjadwalan kelas berulang, pencatatan presensi berfoto langsung dari kelas, evaluasi kurikulum, pencetakan rapor hasil belajar, hingga perhitungan otomatis honor/payroll tutor di akhir periode secara akurat dan transparan.

Sistem ini mentransformasi operasional konvensional yang sebelumnya berbasis absensi kertas manual dan obrolan WhatsApp grup menjadi satu kesatuan platform digital yang tertib administrasi, akuntabel, dan ramah pengguna.

---

## 💡 Mempermudah Siapa Saja? (Target Pengguna & Manfaat)

Sistem ini dirancang untuk menjawab tantangan operasional bimbel yang biasanya masih mengandalkan absensi kertas, grup chat WhatsApp yang tercecer, dan rekapitulasi honor manual di spreadsheet:

### 1. 🏢 Pemilik & Manajemen Bimbel (Owner, HRD, Keuangan)
* **Otomasi Perhitungan Honor (Zero Human Error)**: Honor tutor dihitung otomatis di server berdasarkan kehadiran murid terbayar (`fee = rate × payable_students`) dan tarif historis yang berlaku saat sesi berlangsung.
* **Onboarding Tutor Instan & Otomatis**: Cukup masukkan data tutor baru, sistem otomatis membuat akun login Better Auth, menetapkan sapaan kehormatan Islami (**Abi** / **Umi**), dan mengirimkan email kredensial resmi.
* **Pengawasan Operasional Real-Time**: Memantau sesi yang sedang berjalan hari ini, status kehadiran murid, serta foto dokumentasi kegiatan belajar mengajar secara langsung.
* **Penyuntingan Jadwal Fleksibel ala Google Calendar**: Bebas mengubah jadwal sesi untuk satu kali pertemuan saja, memotong seri jadwal untuk minggu-minggu berikutnya (*split recurrence*), maupun mengubah master jadwal rutin secara menyeluruh tanpa merusak histori sesi lama.
* **Integritas Data & Audit Trail**: Setiap perubahan sensitif (koreksi absensi, perubahan tarif, perubahan status pembayaran, penugasan role) tercatat lengkap dalam *Audit Logs* (*who, what, when, before, after*).
* **Konfigurasi Tarif & Program Fleksibel**: Bebas mengatur program bimbel, jenis bimbel (Reguler 60m, Intensif 75m, Private 90m), tarif tutor, dan hak akses per role dinamis (*Dynamic RBAC*) langsung dari antarmuka web.

### 2. 👨‍🏫 Tutor / Pengajar (Abi & Umi)
* **Presensi Cepat via Ponsel/Laptop**: Mengambil absensi murid langsung di kelas menggunakan kamera browser (`react-webcam`) dengan kompresi otomatis dan unggah aman ke Supabase Storage privat.
* **Agenda & Catatan Belajar Terpusat**: Melihat jadwal mengajar harian/mingguan pribadi, mengakses materi kurikulum, serta mengunduh lembar kerja (*worksheet*) murid dengan 1 klik.
* **Notifikasi Pengingat Sesi & Lonceng In-App**: Menerima Web Push Notifications di perangkat dan memantau riwayat pengingat mengajar melalui lonceng notifikasi interaktif di header portal.
* **Transparansi Honor & Bukti Transfer Bank**: Memantau rincian honor mengajar secara transparan untuk setiap sesi yang telah selesai diajar, status pencairan (*Draft* $\rightarrow$ *Processed* $\rightarrow$ *Paid*), hingga nomor referensi transfer bank resmi.
* **Alur Perbaikan Foto Praktis**: Apabila manajemen meminta koreksi foto presensi saat proses audit honor bulanan, tutor menerima banner peringatan di dasbor dan dapat mengunggah ulang foto perbaikan dengan mudah.

### 3. 👨‍👩‍👧 Orang Tua & Murid
* **Bukti Nyata Pembelajaran**: Kehadiran murid diverifikasi dengan foto kegiatan belajar dan rangkuman materi dari tutor di setiap pertemuan.
* **Rapor Evaluasi Belajar Resmi Format Google Sheets**: Menerima lembar laporan perkembangan belajar berstandar resmi (kop hijau tua dual logo Semesta Abhana & Mentorbelajarku) yang mencakup riwayat materi, evaluasi mentor, dan progres pertemuan.
* **Keadilan Kuota Belajar**: Murid yang berhalangan hadir dengan status Izin (*permission*) atau Sakit (*sick*) tidak kehilangan kuota pertemuan paket secara sepihak dan dapat dijadwalkan ulang (*rescheduling*) dengan histori yang tetap terlacak rapi.

---

## 🗺️ Diagram Use Case UML (UML 2.5 Standard)

Sistem dimodelkan menggunakan notasi standar **UML Use Case Diagram** (*Stickman Actor*, *System Boundary Subject*, *Use Case Oval/Ellipse*, asosiasi langsung, serta relasi `<<include>>` dan `<<extend>>`):

<p align="center">
  <img src="public/docs/usecase-diagram.svg" alt="UML Use Case Diagram Mentor Belajarku" width="100%" />
</p>

### 📋 Tabel Spesifikasi Use Case Per Aktor

| ID | Nama Use Case | Aktor Terkait | Deskripsi Fungsi |
|---|---|---|---|
| **UC-01** | Login ke Sistem Portal | Manajemen, Tutor, `<<service>> Better Auth` | Autentikasi terpusat berbasis peran (fail-closed) menuju portal masing-masing. |
| **UC-02** | Kelola Data Murid & Kuota Paket | Manajemen | CRUD murid, pencarian instan, status keaktifan, dan pelacakan jatah kuota paket (8/12 pertemuan). |
| **UC-03** | Impor Riwayat Sesi (Excel/Sheets) | Manajemen | Parser otomatis catatan belajar dari Excel/Sheets lama untuk melanjutkan urutan pertemuan murid (P-n). |
| **UC-04** | Tambah Tutor & Auto Provisioning | Manajemen, `<<service>> Better Auth` | Pendaftaran tutor baru dengan pembuatan akun Better Auth otomatis dan penentuan panggilan kehormatan Islami (Abi/Umi). |
| **UC-05** | Kelola Jadwal Rutin & Edit Seri | Manajemen | Pembuatan jadwal rutin mingguan dan halaman edit master seri (`/management/schedules/[id]/edit`). |
| **UC-06** | Edit Sesi (Cakupan Google Calendar) | Manajemen | Edit jadwal sesi berulang dengan 3 opsi cakupan simpan (*Hanya Sesi Ini*, *Sesi Ini dan Seterusnya*, *Seluruh Acara*). |
| **UC-07** | Kelola Kurikulum, Mapel & Worksheet | Manajemen | Manajemen silabus mata pelajaran per jenjang, bab materi, dan lembar kerja siswa (*worksheet*). |
| **UC-08** | Monitoring Dashboard & Audit Logs | Manajemen | Pemantauan KPI operasional real-time dan jejak audit mutasi data sensitif (*who, what, when, before, after*). |
| **UC-09** | Konfigurasi Tarif & Dynamic RBAC | Manajemen | Pengaturan tarif honor tutor berjangka waktu (*effective dating*), master tipe bimbel, dan perizinan role dinamis. |
| **UC-10** | Audit Foto Presensi & Koreksi | Manajemen | Pemeriksaan foto bukti KBM saat audit bulanan di modul Payroll dengan opsi meminta perbaikan (`correction_requested`). |
| **UC-11** | Finalisasi & Konfirmasi Bayar Honor | Manajemen | Penguncian status payroll (*Draft* $\rightarrow$ *Processed* $\rightarrow$ *Paid*) serta pencatatan nomor referensi transfer bank. |
| **UC-12** | Edit Catatan Evaluasi Pembelajaran | Manajemen | Penyuntingan materi dan catatan perkembangan murid sebelum laporan dicetak. |
| **UC-13** | Ubah Password & Profil Akun | Tutor, `<<service>> Better Auth` | Pengaturan data profil pribadi dan penggantian password berkala untuk keamanan. |
| **UC-14** | Kirim Email Kredensial Islami | `<<service>> Resend Email` | Mengirimkan email aktivasi resmi dengan salam pembuka & penutup Islami (`<<include>>` dari UC-04). |
| **UC-15** | Lihat Agenda Mengajar Pribadi | Tutor | Kalender agenda mengajar mandiri harian dan mingguan. |
| **UC-16** | Presensi Berfoto Kamera Browser | Tutor, `<<service>> Supabase Storage` | Pengambilan foto bukti KBM langsung melalui kamera browser gawai (`react-webcam`) dengan kompresi otomatis. |
| **UC-17** | Unggah Ulang Foto Presensi | Tutor, `<<service>> Supabase Storage` | Mengunggah foto perbaikan jika manajemen meminta koreksi saat audit honor (`<<extend>>` ke UC-16). |
| **UC-18** | Input Materi & Evaluasi Murid | Tutor | Pengisian topik materi KBM, pemahaman siswa, dan status kehadiran murid (Hadir, Izin, Sakit, Terlambat). |
| **UC-19** | Unduh Worksheet Siswa (1-Klik) | Tutor, `<<service>> Supabase Storage` | Unduh materi lembar kerja siswa langsung dari form presensi tanpa mencari manual. |
| **UC-20** | Notifikasi Push & Lonceng In-App | Tutor, `<<service>> Web Push Service` | Penerimaan notifikasi push pengingat sesi dan riwayat notifikasi pada lonceng interaktif header. |
| **UC-21** | Transparansi Honor & Bukti Transfer | Tutor | Transparansi slip honor per sesi mengajar, status pembayaran, dan nomor referensi transfer bank dari manajemen. |
| **UC-22** | Cetak Rapor Evaluasi A4 (0 ms) | Manajemen | Cetak lembar evaluasi resmi format Google Sheets A4 kop hijau tua via *Native Browser Vector Print Engine*. |
| **UC-23** | Terima Rapor Hasil Belajar Resmi | Orang Tua & Murid | Penerimaan laporan hasil belajar berkala dan bukti kegiatan pembelajaran nyata (`<<include>>` dari UC-22). |

<details>
<summary><strong>🔍 Klik di sini untuk melihat Source Code PlantUML (Dapat disalin ke StarUML / Visual Paradigm / PlantUML Online)</strong></summary>

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle
skinparam roundcorner 16
skinparam shadowing true
skinparam usecase {
  BackgroundColor #ECFDF5
  BorderColor #059669
  FontColor #064E3B
}

actor "Manajemen Bimbel\n(Owner, HRD, Finance)" as M
actor "Tutor Pengajar\n(Abi & Umi)" as T
actor "Orang Tua & Murid\n(Penerima Layanan)" as S

actor "<<service>>\nBetter Auth" as Auth
actor "<<service>>\nResend Email" as Email
actor "<<service>>\nWeb Push Service" as Push
actor "<<service>>\nSupabase Storage" as Storage

rectangle "Sistem Manajemen & Presensi Bimbel (Mentor Belajarku)" {
  usecase "UC-01: Login ke Sistem Portal" as UC1
  usecase "UC-02: Kelola Data Murid & Kuota Paket" as UC2
  usecase "UC-03: Impor Riwayat Sesi (Excel/Sheets)" as UC3
  usecase "UC-04: Tambah Tutor & Auto Provisioning" as UC4
  usecase "UC-05: Kelola Jadwal Rutin & Edit Seri" as UC5
  usecase "UC-06: Edit Sesi (Cakupan Google Calendar)" as UC6
  usecase "UC-07: Kelola Kurikulum, Mapel & Worksheet" as UC7
  usecase "UC-08: Monitoring Dashboard & Audit Logs" as UC8
  usecase "UC-09: Konfigurasi Tarif & Dynamic RBAC" as UC9
  usecase "UC-10: Audit Foto Presensi & Koreksi" as UC10
  usecase "UC-11: Finalisasi & Konfirmasi Bayar Honor" as UC11
  usecase "UC-12: Edit Catatan Evaluasi Pembelajaran" as UC12
  usecase "UC-13: Ubah Password & Profil Akun" as UC13
  usecase "UC-14: Kirim Email Kredensial Islami" as UC14
  usecase "UC-15: Lihat Agenda Mengajar Pribadi" as UC15
  usecase "UC-16: Presensi Berfoto Kamera Browser" as UC16
  usecase "UC-17: Unggah Ulang Foto Presensi" as UC17
  usecase "UC-18: Input Materi & Evaluasi Murid" as UC18
  usecase "UC-19: Unduh Worksheet Siswa (1-Klik)" as UC19
  usecase "UC-20: Notifikasi Push & Lonceng In-App" as UC20
  usecase "UC-21: Transparansi Honor & Bukti Transfer" as UC21
  usecase "UC-22: Cetak Rapor Evaluasi A4 (0 ms)" as UC22
  usecase "UC-23: Terima Rapor Hasil Belajar Resmi" as UC23

  UC4 ..> UC14 : <<include>>
  UC17 ..> UC16 : <<extend>>
  UC22 ..> UC23 : <<include>>
}

M -- UC1
M -- UC2
M -- UC3
M -- UC4
M -- UC5
M -- UC6
M -- UC7
M -- UC8
M -- UC9
M -- UC10
M -- UC11
M -- UC12
M -- UC22

T -- UC1
T -- UC13
T -- UC15
T -- UC16
T -- UC17
T -- UC18
T -- UC19
T -- UC20
T -- UC21

S -- UC23

UC1 -- Auth
UC13 -- Auth
UC4 -- Auth

UC14 -- Email

UC20 -- Push

UC16 -- Storage
UC17 -- Storage
UC19 -- Storage
@enduml
```

</details>

---

## ✨ Modul & Fitur-Fitur Utama Sistem

### 1. 🏢 Modul Manajemen Pengajar (Tutor Management & Auto-Provisioning)
* **CRUD Master Tutor Lengkap**: Registrasi, edit biodata, nomor HP/WhatsApp, bio spesialisasi, dan status keaktifan tutor.
* **Auto-Provisioning Akun Better Auth**: Pembuatan baris otomatis pada `"user"`, `"account"`, `profiles`, dan `tutors` dalam satu alur transaksi tanpa memutuskan sesi admin yang sedang login.
* **Panggilan Kehormatan Islami Otomatis**: Pemilihan gender secara otomatis menetapkan sapaan kehormatan:
  * **Laki-laki $\rightarrow$ Abi** (contoh: *Abi Hanif*)
  * **Perempuan $\rightarrow$ Umi** (contoh: *Umi Sarah*)
* **Auto-Generated Default Password**: Sistem menghasilkan password acak bawaan aman yang mudah dibaca (`Mbk{4digit}!{chars}`).
* **Notifikasi Email Transaksional Islami (Resend API)**: Email aktivasi resmi yang memuat salam pembuka Islami (*Assalamu'alaikum Warahmatullahi Wabarakatuh*), detail kredensial, tautan login portal bimbel, dan salam penutup (*Wassalamu'alaikum...*).
* **Salin Kredensial & Format WhatsApp 1-Klik**: Opsi instan menyalin kredensial atau format pesan WhatsApp siap kirim yang sopan, santun, dan bebas duplikasi gelar (*"Halo Kak Abi..."*).
* **Reset Kredensial & Proteksi Hapus Berelasi**: Fitur kirim ulang kredensial bila tutor lupa password, serta proteksi *soft-deactivation* agar riwayat mengajar masa lalu tidak hilang.

### 2. 📅 Modul Penjadwalan & Sesi (Google Calendar Scope Pattern)
* **Master Jadwal Rutin (`/management/schedules`)**:
  * Pengaturan jadwal belajar berulang mingguan untuk kelas privat (1 murid) maupun multi-murid kelompok (misal TKA).
  * Pengulangan fleksibel ala kalender: pilihan multi-hari (`days_of_week[]`), interval 1–12 minggu, terminasi jumlah pertemuan (*count*) atau batas tanggal (*until*).
  * Pratinjau kejadian tanggal secara real-time sebelum disimpan.
* **Halaman Edit Master Jadwal (`/management/schedules/[id]/edit`)**:
  * Kemampuan mengedit seluruh data jadwal rutin master (pengajar, hari, jam, kurikulum, murid terdaftar, lokasi, dan catatan).
  * Sinkronisasi otomatis ke sesi-sesi mendatang yang masih berstatus `scheduled`.
* **Sesi Pembelajaran Aktual (`/management/sessions`)**:
  * Pencatatan pertemuan nyata per tanggal kalender dengan dukungan pergantian guru pengganti (*substitute tutor*) dan pembatalan sesi.
* **Dialog Edit Jadwal Sesi ala Google Calendar**:
  Saat mengubah sesi berulang, manajemen diberikan 3 opsi cakupan penyimpanan:
  1. **Hanya Sesi Ini (`this_session`)**: Memperbarui tanggal, jam, tutor, atau catatan pada sesi terpilih saja tanpa mengubah jadwal master atau sesi lain.
  2. **Sesi Ini dan Seterusnya (`this_and_following` / Split Recurrence)**: Memotong seri lama pada H-1, menerbitkan seri master baru mulai tanggal sesi tersebut, dan memindahkan seluruh sesi mendatang ke seri baru secara aman.
  3. **Seluruh Acara dalam Seri (`all_sessions`)**: Menyelaraskan seluruh sesi mendatang yang belum terlaksana dan memperbarui template master.
* **Proteksi Riwayat Belajar (*Immutable History*)**: Sesi yang telah berstatus `completed` atau memiliki catatan presensi/honor tidak akan pernah dimutasi retroaktif.

### 3. 📸 Modul Presensi & Audit Foto (Attendance)
* **Kamera Browser Langsung (`react-webcam`)**: Tutor mengambil foto bukti KBM murid langsung dari peramban ponsel atau laptop di kelas.
* **Kompresi Gambar Sisi Klien**: Mengurangi ukuran foto dari 4MB menjadi ~200KB sebelum diunggah via `browser-image-compression` untuk kecepatan maksimal di sinyal seluler.
* **Penyimpanan Terproteksi Supabase Storage**: Bucket privat `attendance` dengan validasi server (*MIME type*, *magic bytes*, *file size*) dan signed URL berbatas waktu.
* **Multi-Status Kehadiran**: `present` (Hadir), `late` (Terlambat), `permission` (Izin), `sick` (Sakit), dan `absent` (Alfa).
* **Keadilan Konsumsi Kuota**: Status `permission` dan `sick` **tidak memotong** jatah pertemuan paket murid dan dapat dijadwalkan ulang (*rescheduling*).
* **Alur Audit Foto Bulanan (Anti-Approval Fatigue)**:
  * Manajemen mengaudit foto presensi sekaligus saat proses penggajian bulanan di modul Payroll.
  * Preview thumbnail foto dan modal lightbox resolusi penuh.
  * Opsi **Minta Perbaikan Foto (`correction_requested`)**: Menuliskan catatan revisi (misal: *"Foto buram, silakan unggah ulang foto yang jelas"*).
  * Tutor menerima banner peringatan di dasbor dan dapat mengunggah ulang foto perbaikan; status otomatis kembali menjadi `submitted` untuk diaudit ulang.

### 4. 🎓 Modul Murid & Rapor Perkembangan (Students & Evaluation)
* **Master Data Murid**: Profil murid, NIS/`student_code`, kontak wali murid, asal sekolah, kelas, jenjang, dan status keaktifan.
* **Visualisasi Kuota Pertemuan Real-Time**: Tracking otomatis progres pertemuan ke-X dari total paket aktif (misal *Pertemuan 4 dari 8*), persentase kelulusan paket, dan histori sesi kronologis.
* **Impor Riwayat Sesi dari Google Sheets / Excel**:
  * Dialog impor cerdas untuk migrasi catatan belajar lama.
  * Parser otomatis mengenali format tanggal Indonesia, nama mentor, materi, dan pertemuan ke-X.
  * Menyimpan transaksi atomik pada `sessions`, `session_students`, `attendance` (*verified*), dan `learning_records`, sehingga absensi baru di aplikasi langsung melanjutkan urutan pertemuan selanjutnya (misal lanjut ke P5).
* **Rapor Evaluasi Murid Format Resmi Google Sheets (Cetak PDF A4)**:
  * Desain lembar evaluasi resmi 100% presisi dengan format cetak Google Sheets: Kop banner hijau tua dual logo Semesta Abhana & Mentorbelajarku, tabel materi `#9bbad6`, kolom mentor, dan catatan evaluasi.
  * **Popup Edit Keterangan Evaluasi**: Admin dapat menyunting catatan materi dan evaluasi per pertemuan sebelum dicetak.
  * **Cetak PDF Vektor Instan (0 ms)**: Memanfaatkan *Native Browser Vector Print Engine* (`window.print()`) menghasilkan PDF A4 tajam berukuran kecil tanpa membebani memori server.

### 5. 💵 Modul Honor & Penggajian Tutor (Tutor Payroll)
* **Kalkulasi Deterministik di Server**: Rumus honor transparan `fee = rate × payable_students`.
* **Integritas Tarif Historis (*Effective Dating*)**:
  * Tabel `tutor_rates` dengan masa berlaku `effective_from` s/d `effective_until`.
  * Perubahan tarif baru di masa mendatang tidak akan mengubah nilai honor pada sesi masa lalu.
  * Prioritas tarif spesifik tutor di atas tarif global bimbel.
* **Alur Status Payroll Berjenjang**:
  * `draft`: Tahap audit foto presensi per sesi/murid, penyesuaian bonus/potongan, dan opsi mengeluarkan sesi bermasalah.
  * `processed`: Difinalisasi oleh Bagian Keuangan/Owner.
  * `paid`: Flag bayar resmi setelah transfer dana dilakukan, menyimpan nomor referensi bank (`payment_reference`) dan catatan.
* **Transparansi Portal Tutor**: Tutor dapat melihat rincian honor per sesi, tanggal pembayaran riil, dan menyalin nomor referensi transfer bank dari manajemen.

### 6. 🔔 Modul Notifikasi Push & Lonceng Interaktif In-App
* **Web Push Notifications (W3C Standard)**:
  * Registrasi Service Worker (`public/sw.js`) dan langganan push via VAPID keys.
  * Notifikasi otomatis saat ada jadwal baru, pengingat sebelum sesi (`before_minutes`), dan pengingat setelah sesi (`after_minutes`) bila presensi belum diisi.
  * Sakelar toggle notifikasi di profil akun tutor dan tombol kirim pesan uji coba (*test push*).
* **Lonceng Notifikasi Interaktif In-App (`TutorNotificationBell`)**:
  * Popover interaktif di header portal tutor dengan badge jumlah belum dibaca (*unread count*) merah.
  * Riwayat notifikasi berpenanda waktu relatif Indonesia (*"5 menit yang lalu"*).
  * Aksi 1-klik tandai dibaca per notifikasi atau tandai semua dibaca sekaligus.
  * Navigasi langsung ke sesi mengajar terkait saat notifikasi diklik.
* **Konfigurasi Notifikasi Global (`/management/settings/notifications`)**:
  * Sakelar utama notifikasi, pengaturan durasi pengingat sesi, interval pengulangan, dan kuota repetisi.

### 7. 📚 Modul Kurikulum & Silabus (Curriculum & Materials)
* **Master Mata Pelajaran (`subjects`)**: Pengelompokan mata pelajaran berdasarkan tingkat/jenjang (TK, SD, SMP, SMA, Umum).
* **Bab Materi Kurikulum (`curriculum_topics`)**: Pengaturan bab materi, nomor bab, deskripsi pembelajaran, dan tautan lembar kerja (*worksheet*).
* **Unduh Worksheet 1-Klik**: Lembar kerja murid langsung tersedia di formulir presensi tutor sehingga tutor tidak perlu mencari bahan terpisah saat KBM dimulai.

### 8. 🛡️ Keamanan, Dynamic RBAC, & Audit Logs
* **Dynamic Role-Based Access Control**:
  * Tabel `roles`, `permissions`, dan `role_permissions`.
  * Hak akses dikelola dinamis di database; Owner dapat membuat role baru dan menyesuaikan perizinan dari antarmuka web tanpa perlu deploy ulang.
* **Server-Side Authorization Boundary**:
  * Seluruh Server Action dan Route Handler diproteksi guard terpusat (`requirePermissionUser`, `checkPermission`, `requireTutorApi`).
  * Endpoint portal tutor bersifat *fail-closed* untuk mencegah kerentanan IDOR.
* **Audit Logs Komprehensif**:
  * Mencatat otomatis *who, what, when, before, after* pada seluruh mutasi data sensitif (presensi, tarif honor, status payroll, role permission).

---

## ⚡ Pengalaman Pengguna Cepat & Halus (UX & Performa)

1. **Zero-Delay Database Fallback**: Deteksi otomatis status koneksi database untuk transisi instan saat mode prototipe tanpa error koneksi.
2. **Next.js Route Prefetching**: Data halaman di-*prefetch* di latar belakang untuk navigasi instan tanpa jeda antar menu portal.
3. **Optimistic Pending State**: Indikator respon seketika di menu sidebar saat pengguna mengeklik menu navigasi.
4. **Vector Print Engine 0 ms**: Menghasilkan PDF lembar evaluasi tajam resolusi tinggi tanpa membebani CPU server menggunakan `@media print` CSS native.
5. **Client-Side Image Compression**: Mengompres foto absensi kamera dari ~4 MB menjadi ~200 KB dalam hitungan milidetik sebelum diunggah ke storage.

---

## 🛠️ Tech Stack & Arsitektur Teknologi

| Lapisan | Komponen / Teknologi | Keterangan |
|---|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) | Server Components untuk data fetching, Server Actions untuk mutasi, Route Handlers untuk integrasi REST. |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Strict Type Checking dengan konsistensi 100% (0 errors). |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) | Source of truth tunggal untuk seluruh relasi dan transaksi bisnis. |
| **Storage** | [Supabase Storage](https://supabase.com/storage) | Bucket privat `attendance` untuk foto presensi murid dengan signed URL. |
| **Autentikasi** | [Better Auth](https://www.better-auth.com/) | Identity & session provider tunggal (scrypt hashing, multi-role session). |
| **Email Transaksional**| [Resend](https://resend.com/) | Pengiriman email kredensial tutor otomatis bertata karma Islami. |
| **Notifikasi** | Web Push API + Service Worker | Pengingat sesi belajar dan notifikasi jadwal real-time standar W3C. |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/) | Komponen modern, responsif, aksesibel, dan mendukung Dark Mode native. |
| **Icons & Visuals** | [Lucide React](https://lucide.dev/) & [Recharts](https://recharts.org/) | Ikonografi bersih dan grafik visualisasi operasional bimbel. |
| **Tabel Data** | [TanStack Table v9](https://tanstack.com/table) | Filter, sortir, dan paginasi data murid, tutor, jadwal, dan payroll. |
| **Formulir & Validasi**| React Hook Form + Zod | Shared validation schema antara sisi klien dan server. |
| **Kamera & Gambar** | `react-webcam` & `browser-image-compression` | Pengambilan foto langsung dari browser dan kompresi pra-unggah. |
| **State Manajemen** | [Zustand](https://zustand-demo.pmnd.rs/) | Khusus client-only UI state (sidebar, dialog draft, temporary filter). |

---

## 🔑 Akun Demo (Mode Uji Coba Cepat)

Untuk menguji fitur tanpa konfigurasi database, Anda dapat mengakses URL `/login` dan memilih salah satu akun demo berikut:

| Peran | Nama Pengguna | Email Demo | Akses Portal |
|---|---|---|---|
| **Owner (Manajemen)** | Siti Rahmawati | `owner@bimbel.test` | Seluruh Modul Manajemen, Keuangan, & Konfigurasi |
| **HRD (Manajemen)** | Dimas Anggara | `hrd@bimbel.test` | Data Murid, Tutor, Jadwal, & Presensi |
| **Keuangan (Manajemen)** | Rina Marlina | `finance@bimbel.test` | Verifikasi Presensi, Payroll, & Tarif Tutor |
| **Tutor (Pengajar)** | Abi Hanif | `abihanif@bimbel.test` | Presensi Kamera Murid, Jadwal Mengajar, Slip Fee |
| **Tutor (Pengajar)** | Sarah Nabila | `sarah@bimbel.test` | Presensi Kamera Murid, Jadwal Mengajar, Slip Fee |

---

## 🚀 Panduan Memulai Cepat (Quick Start)

### 1. Prasyarat Sistem
* Node.js v18.18+ atau v20+
* Package Manager: `pnpm` (direkomendasikan), `npm`, atau `yarn`

### 2. Kloning & Instalasi
```bash
git clone https://github.com/fikri210604/mentorbelajarku.git
cd mentorbelajarku
pnpm install
```

### 3. Konfigurasi Environment Variables
Salin berkas contoh atau buat berkas `.env.local` di root proyek:

```env
# URL & Secret Aplikasi
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_SECRET=rahasia-autentikasi-super-aman-32-karakter-atau-lebih
BETTER_AUTH_URL=http://localhost:3000

# Supabase (PostgreSQL & Storage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Email Transaksional (Resend API)
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=Mentor Belajarku <no-reply@mentorbelajarku.com>

# Web Push Notifications (VAPID Keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:admin@mentorbelajarku.com
```

> **Catatan Mode Demo**: Aplikasi dilengkapi dengan data sintetis mandiri (*built-in synthetic data*). Jika variabel Supabase di atas belum diisi, sistem otomatis berjalan dalam mode prototipe tanpa error koneksi.

### 4. Menjalankan Server Pengembangan
```bash
pnpm run dev
```
Buka browser Anda di [http://localhost:3000](http://localhost:3000).

---

## 📂 Struktur Direktori Proyek

Proyek ini menerapkan arsitektur *Role-Oriented, Feature-Driven, & Thin App Pages*:

```text
├── app/                                 # Next.js App Router
│   ├── (public)/                        # Landing Page publik & Login
│   │   ├── page.tsx                     # Beranda profil bimbel Kemiling
│   │   └── (auth)/login/page.tsx        # Gerbang login Better Auth
│   ├── (private)/                       # Portal terproteksi per peran
│   │   ├── dashboard/page.tsx           # Router penyeleksi portal otomatis
│   │   ├── (management)/management/     # Area Manajemen (Dashboard, Students, Tutors, Schedules, Payroll, Settings)
│   │   └── (tutor)/tutor/               # Area Pengajar (Dashboard, Sessions, Schedules, Payroll, Profile)
│   └── api/v1/                          # REST API v1 endpoints terproteksi
│
├── features/                            # Domain logika bisnis terisolasi
│   ├── management/                      # Antarmuka & aksi peran manajemen
│   │   ├── dashboard/
│   │   ├── students/                    # CRUD murid, rapor A4, impor excel
│   │   ├── tutors/                      # CRUD tutor, auto provisioning, email
│   │   ├── schedules/                   # Master jadwal, edit scope Google Calendar
│   │   ├── sessions/                    # Sesi KBM riil, reschedule, edit sesi
│   │   ├── attendance/                  # Monitoring presensi & audit
│   │   ├── payroll/                     # Audit bulanan, finalisasi & bayar honor
│   │   ├── reports/                     # Rekap laporan eksekutif
│   │   └── settings/                    # Master tarif, bimbel types, RBAC, notifikasi
│   ├── tutor/                           # Antarmuka & aksi peran pengajar
│   │   ├── dashboard/                   # Agenda hari ini & peringatan koreksi foto
│   │   ├── attendance/                  # Kamera browser react-webcam & input presensi
│   │   ├── schedules/                   # Kalender mengajar mandiri
│   │   ├── payroll/                     # Slip transparansi honor & bukti transfer
│   │   └── profile/                     # Pengaturan akun & toggle notifikasi push
│   └── shared/                          # Logika domain bersama
│       ├── sessions/services/           # Generator sesi berulang batch
│       ├── web-push/                    # Layanan Web Push W3C
│       └── attendance/                  # Validasi dan helper foto presensi
│
├── components/                          # Komponen UI Reusable
│   ├── ui/                              # Komponen dasar shadcn/ui
│   ├── shared/                          # PageHeader, StatusBadge, CameraCapture
│   ├── management/                      # Sidebar & Header Manajemen
│   └── tutor/                           # Header Tutor & Lonceng Notifikasi In-App
│
├── config/                              # Navigasi & pemetaan hak akses (permissions)
├── docs/                                # Dokumentasi resmi bisnis & arsitektur
├── lib/                                 # Utilitas inti (Supabase, Auth, Email, Date)
├── public/                              # Asset statis, logo, & Service Worker (sw.js)
├── supabase/                            # Skrip migrasi SQL & seed database
└── types/                               # Definisi tipe TypeScript & skema database
```

---

## 📄 Lisensi & Kredit

Hak Cipta &copy; 2026 **Mentor Belajarku** — Bimbingan Belajar & Les Privat di Kemiling, Bandar Lampung.  
Seluruh hak cipta dilindungi undang-undang.
