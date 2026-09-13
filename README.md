# 🎓 Mentor Belajarku — Sistem Manajemen & Presensi Bimbel Terpadu

<p align="center">
  <img src="public/logo.jpg" alt="Mentor Belajarku Logo" width="120" style="border-radius: 16px;" />
</p>

<p align="center">
  <strong>Platform manajemen operasional bimbingan belajar terpadu: absensi berfoto real-time, penjadwalan fleksibel, rekapitulasi sesi aktual, dan kalkulasi honor tutor otomatis.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15%2B-black?style=flat&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL_%26_Storage-3ECF8E?style=flat&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Auth-Better_Auth-purple?style=flat" alt="Better Auth" />
</p>

---

## 📌 Tentang Project

**Mentor Belajarku** adalah sistem informasi manajemen dan absensi modern yang dirancang khusus untuk lembaga bimbingan belajar (bimbel) dan les privat. 

Aplikasi ini mendigitalkan seluruh siklus operasional bimbel—mulai dari pendaftaran murid, penugasan tutor, penjadwalan kelas, pencatatan presensi berfoto langsung dari kelas, hingga perhitungan otomatis honor/payroll tutor di akhir periode secara akurat dan transparan.

---

## 💡 Mempermudah Siapa Saja? (Target Pengguna & Manfaat)

Sistem ini dirancang untuk menjawab tantangan operasional bimbel yang biasanya masih mengandalkan absensi kertas, grup chat WhatsApp yang tercecer, dan rekapitulasi honor manual di spreadsheet:

### 1. 🏢 Pemilik & Manajemen Bimbel (Owner, HRD, Keuangan)
* **Otomasi Perhitungan Honor (Zero Human Error)**: Honor tutor dihitung otomatis di server berdasarkan kehadiran murid terbayar (`fee = rate × payable_students`) dan tarif historis yang berlaku saat sesi berlangsung.
* **Pengawasan Operasional Real-Time**: Memantau sesi yang sedang berjalan hari ini, status kehadiran murid, serta foto dokumentasi kegiatan belajar mengajar secara langsung.
* **Integritas Data & Audit Trail**: Setiap perubahan sensitif (koreksi absensi, perubahan tarif, perubahan status pembayaran) tercatat lengkap dalam *Audit Logs* (*who, what, when, before, after*).
* **Konfigurasi Tarif & Program Fleksibel**: Bebas mengatur program bimbel, durasi default (Reguler, Intensif, Private), dan tarif tutor per jenis bimbel tanpa mengubah kode sumber.

### 2. 👨‍🏫 Tutor / Pengajar
* **Presensi Cepat via Ponsel/Laptop**: Mengambil absensi murid langsung di kelas menggunakan kamera browser (`react-webcam`) dengan kompresi otomatis dan unggah aman.
* **Jadwal & Catatan Belajar Terpusat**: Melihat agenda mengajar harian/mingguan dan mencatat materi yang diajarkan serta evaluasi perkembangan murid per pertemuan.
* **Transparansi Honor & Pembayaran**: Memantau rincian honor mengajar secara transparan untuk setiap sesi yang telah selesai diajar.

### 3. 👨‍👩‍👧 Orang Tua & Murid
* **Bukti Nyata Pembelajaran**: Kehadiran murid diverifikasi dengan foto kegiatan belajar dan rangkuman materi dari tutor di setiap pertemuan.
* **Keadilan Kuota Belajar**: Murid yang berhalangan hadir dengan status Izin (`permission`) tidak kehilangan kuota pertemuan secara sepihak dan dapat dijadwalkan ulang (*rescheduling*) dengan histori yang tetap terlacak rapi.

---

## ✨ Fitur-Fitur Utama

### 📸 1. Presensi Berfoto Kamera Langsung
* Pengambilan foto absensi langsung dari browser perangkat menggunakan kamera (`react-webcam`).
* Kompresi gambar sisi klien sebelum pengunggahan untuk menghemat kuota dan mempercepat respon.
* Penyimpanan foto terstruktur di **Supabase Storage** (`attendance/{year}/{month}/{session_id}/{student_id}.jpg`).
* Status kehadiran lengkap: Hadir (*Present*), Tidak Hadir (*Absent*), Izin (*Permission*), Sakit (*Sick*), dan Terlambat (*Late*).

### 📅 2. Manajemen Jadwal (Schedule) vs Sesi Aktual (Session)
* **Pemisahan Konseptual Tegas**: 
  * *Schedule*: Rencana jadwal rutin mingguan.
  * *Session*: Realisasi pembelajaran nyata pada tanggal kalender tertentu.
* Mendukung pergantian tutor pengajar (tutor pengganti/badal) pada sesi tertentu tanpa merusak master jadwal rutin.
* Pengelompokan fleksibel: Kelas privat 1-on-1, kelompok belajar, maupun kelas reguler multi-murid.

### 💵 3. Kalkulator Payroll & Honor Tutor Otomatis
* Perhitungan honor otomatis di server berdasarkan tarif aktif dan jumlah murid yang sah dihitung.
* **Integritas Tarif Historis (*Effective Dating*)**: Perubahan tarif baru di masa depan tidak akan mengubah perhitungan honor sesi masa lalu.
* Alur status payroll berjenjang: *Draft* $\rightarrow$ *Review* $\rightarrow$ *Finalized* $\rightarrow$ *Paid*.

### 📊 4. Dasbor Analitik & Laporan
* Statistik metrik operasional: Total murid aktif, tutor mengajar, jumlah sesi hari ini, dan estimasi beban honor bulan berjalan.
* Visualisasi grafik menggunakan **Recharts**: Tren sesi mingguan dan distribusi jenis bimbel (Reguler, Intensif, Private).
* Laporan presensi dan keaktifan murid yang dapat diekspor atau ditinjau berkala.

### 🔐 5. Keamanan & Role-Based Access Control (RBAC)
* Portal terpisah untuk **Manajemen** dan **Tutor**.
* Rute portal login internal privat (tidak diekspos secara bebas pada footer publik).
* Autentikasi terpusat menggunakan **Better Auth** dan proteksi rute di [middleware.ts](file:///D:/tugas-kuliah/SEMESTER%207/Project%20Bimbel/mentorbelajarku/middleware.ts).
* Pengecekan autorisasi ketat di level Server Component, Server Action, dan database.

### ⚡ 6. Pengalaman Pengguna Cepat & Halus
* **Zero-Delay Database Fallback**: Deteksi otomatis status koneksi database untuk transisi instan saat mode prototipe.
* **Next.js Route Prefetching**: Data halaman di-*prefetch* di latar belakang untuk navigasi instan tanpa jeda.
* **Optimistic Pending State**: Indikator respon seketika di menu sidebar saat pengguna mengeklik menu.

---

## 🛠️ Tech Stack

| Lapisan | Teknologi |
|---|---|
| **Framework** | [Next.js](https://nextjs.org/) (App Router, Server Components, Server Actions) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL & Storage) |
| **Authentication** | [Better Auth](https://www.better-auth.com/) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), Lucide Icons |
| **Data Tables** | [TanStack Table v9](https://tanstack.com/table) |
| **Data Visualization**| [Recharts](https://recharts.org/) |
| **Form & Validation**| [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/) |
| **Camera & Capture** | [react-webcam](https://www.npmjs.com/package/react-webcam), [browser-image-compression](https://www.npmjs.com/package/browser-image-compression) |
| **Client State** | [Zustand](https://zustand-demo.pmnd.rs/) (Sidebar, UI state, modal draft) |

---

## 🚀 Panduan Memulai (Quick Start)

### 1. Prasyarat Sistem
* Node.js versi 18.17 atau lebih baru
* Package manager: `npm`, `pnpm`, atau `yarn`

### 2. Kloning & Instalasi Dependensi
```bash
git clone https://github.com/fikri210604/mentorbelajarku.git
cd mentorbelajarku
npm install
```

### 3. Konfigurasi Environment Variable
Buat berkas `.env.local` di root direktori proyek (opsional untuk mode demo, wajib untuk koneksi database produksi):

```env
# URL & Secret Aplikasi
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_SECRET=rahasia-autentikasi-super-aman-32-karakter
BETTER_AUTH_URL=http://localhost:3000

# Supabase Database & Storage (Jika menghubungkan ke instance Supabase riil)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

> **Catatan Mode Demo**: Aplikasi dilengkapi dengan data sintetis mandiri (*built-in synthetic data*). Jika variabel Supabase di atas belum diisi, sistem otomatis berjalan dalam mode prototipe tanpa error koneksi.

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka peramban Anda di [http://localhost:3000](http://localhost:3000).

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

## 📂 Struktur Direktori Proyek

Proyek ini menerapkan arsitektur *Role-Oriented, Feature-Driven, & Thin App Pages*:

```text
├── app/                                 # Next.js App Router
│   ├── (public)/                        # Landing Page publik & Login
│   │   ├── page.tsx                     # Beranda publik (Wali murid/Siswa)
│   │   └── (auth)/login/page.tsx        # Portal autentikasi terpusat
│   ├── (private)/                       # Portal terproteksi (Role-separated)
│   │   ├── (management)/management/     # Rute khusus Manajemen (Dashboard, Students, Payroll, dll)
│   │   └── (tutor)/tutor/               # Rute khusus Tutor (Dashboard, Attendance, Schedules, dll)
│   └── api/v1/                          # REST API v1 endpoint terproteksi
│
├── features/                            # Modul logika bisnis per domain
│   ├── auth/                            # Komponen login, session actions
│   ├── management/                      # Domain logic & antarmuka Manajemen
│   │   ├── dashboard/
│   │   ├── students/
│   │   ├── tutors/
│   │   ├── schedules/
│   │   ├── sessions/
│   │   ├── attendance/
│   │   ├── payroll/
│   │   └── settings/
│   ├── tutor/                           # Domain logic & antarmuka Tutor
│   │   ├── dashboard/
│   │   ├── students/
│   │   ├── schedules/
│   │   ├── attendance/                  # Logika kamera & input presensi
│   │   └── payroll/
│   └── shared/                          # Services, schemas, & tipe data bersama
│
├── components/                          # UI Primitives & Widget
│   ├── ui/                              # Komponen dasar shadcn/ui
│   ├── shared/                          # Skeletons, PageHeader, StatusBadge, Camera
│   ├── sections/                        # Bagian-bagian halaman publik (Hero, FAQ, dll)
│   ├── management/                      # Layout navigasi Manajemen
│   └── tutor/                           # Layout navigasi Tutor
│
├── data/                                # Data sintetis prototipe (Users, Students, Schedules)
├── lib/                                 # Utilitas (Supabase, Auth, WhatsApp, Utils)
├── stores/                              # Zustand UI state (Sidebar, modal, form draft)
└── types/                               # Definisi tipe TypeScript terpusat
```

---

## 📄 Lisensi & Kredit

Hak Cipta &copy; 2026 **Mentor Belajarku** — Bimbingan Belajar & Les Privat Kemiling, Bandar Lampung. Seluruh hak cipta dilindungi undang-undang.
