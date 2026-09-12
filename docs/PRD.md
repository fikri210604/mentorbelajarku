# Product Requirements Document (PRD)
## Sistem Manajemen & Presensi Bimbingan Belajar (Bimbel)

---

## 1. Executive Summary

Sistem Manajemen & Presensi Bimbel ini dirancang untuk mendigitalkan dan mengoptimalkan seluruh operasional lembaga bimbingan belajar:
- Registrasi dan pengelolaan murid serta tutor.
- Penjadwalan rutin (schedule) dan pencatatan pertemuan riil (session).
- Presensi murid berbasis verifikasi foto kamera langsung (`react-webcam`) dan pencatatan status kehadiran (`present`, `absent`, `permission`, `sick`, `late`).
- Perhitungan honor/fee tutor otomatis di sisi server secara historis dan transaksional berdasarkan kehadiran riil (`fee = rate * payable_students`).
- Laporan berkala dan jejak audit (*audit logs*) untuk seluruh koreksi dan mutasi penting.

---

## 2. Target Pengguna & Persona

### 2.1. Management (Pengelola Bimbel)
- **Kebutuhan**:
  - Mengelola data master murid, tutor, program studi, jenis bimbel, dan konfigurasi tarif honor tutor.
  - Membuat dan memodifikasi jadwal belajar reguler/kelompok/private.
  - Memverifikasi absensi dan catatan materi pembelajaran harian.
  - Mengkalkulasi, mereview, memfinalisasi, dan menandai pembayaran honor tutor setiap periode payroll.
  - Memantau laporan performa operasional, kehadiran, dan keuangan secara real-time.
  - Melihat audit log perubahan data penting.

### 2.2. Tutor (Pengajar)
- **Kebutuhan**:
  - Melihat jadwal mengajar harian dan mingguan.
  - Melakukan presensi murid saat sesi berlangsung secara langsung dengan kamera dan bukti foto.
  - Mengisi ringkasan materi pembelajaran dan catatan evaluasi per murid.
  - Memantau riwayat mengajar dan rincian honor yang telah disetujui/dibayarkan.

---

## 3. Fitur Utama & Scope

| Modul | Deskripsi | Aktor Utama |
|---|---|---|
| **Autentikasi & Akun** | Login, sesi terpusat dengan Better Auth, pengalihan peran (role redirection), proteksi via Middleware. | Management, Tutor |
| **Data Murid (Students)** | CRUD data murid, NIS/kode unik (`student_code`), riwayat program & enrollment, riwayat kehadiran. | Management (Read/Write), Tutor (Read only) |
| **Data Tutor** | Profil tutor, spesialisasi, status keaktifan, riwayat murid binaan dan riwayat mengajar. | Management (Read/Write), Tutor (Self Read) |
| **Jadwal (Schedules)** | Pembuatan jadwal rutin berbasis hari, jam, program, jenis bimbel, tutor, dan murid/kelompok. | Management (Read/Write), Tutor (Read) |
| **Sesi Aktual (Sessions)** | Manifestasi riil dari jadwal pada tanggal kalender tertentu. Mencatat tutor aktual yang mengajar (termasuk tutor pengganti). | Management, Tutor |
| **Presensi (Attendance)** | Pengambilan presensi murid per sesi dengan kamera browser (`react-webcam`), upload ke Supabase Storage, status multi-opsi. | Tutor (Input), Management (Review/Koreksi) |
| **Payroll (Honor Tutor)** | Perhitungan otomatis di server berdasarkan tarif yang berlaku saat sesi berlangsung dan jumlah murid terbayar. Finalisasi & riwayat transfer. | Management (Kelola), Tutor (Lihat Rincian) |
| **Laporan (Reports)** | Rekapitulasi presensi, keaktifan murid, jam terbang tutor, dan pengeluaran payroll. | Management |
| **Pengaturan (Settings)** | Konfigurasi program studi, jenis bimbel (Reguler, Intensif, Private beserta durasi default), dan tarif tutor per jenis bimbel. | Management |
| **Audit Logs** | Pencatatan otomatis *who, what, when, before, after* untuk mutasi sensitif (koreksi absensi, perubahan tarif, payroll). | System, Management |

---

## 4. Metrik Keberhasilan (Success Metrics)

1. **Akurasi Data**: 100% konsistensi antara data sesi aktual dengan honor tutor yang dibayarkan.
2. **Integritas Historis**: Perubahan tarif baru di masa depan tidak mempengaruhi kalkulasi payroll masa lalu.
3. **Keandalan Presensi**: Foto presensi tersimpan aman di Supabase Storage dengan metadata yang valid dan tidak dapat dimanipulasi dari sisi client.
4. **Rescheduling Flow**: Sesi izin (`permission`) tidak memotong kuota paket murid dan dapat dijadwalkan ulang dengan histori utuh.

---

## 5. Non-Functional Requirements

- **Security**: Autentikasi ketat Better Auth, RBAC di level Server Component, Server Action, API v1 Route Handler, dan database constraints.
- **Performance**: Pemanfaatan Server Components Next.js untuk data fetching efisien dan TanStack Table untuk rendering tabel data besar.
- **Responsiveness**: Antarmuka responsif ramah mobile/tablet bagi tutor saat melakukan absensi langsung di kelas.
- **Modularity**: Arsitektur feature-oriented terstruktur (`src/features/*`) dengan Thin App Pages di `src/app/*`.
