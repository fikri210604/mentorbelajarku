# Task: Review and Revise DESIGN.md — Bimbel Management & Attendance System

Kamu bertindak sebagai software architect yang bertugas mereview dan merevisi `DESIGN.md` untuk sebuah website manajemen bimbel.

Jangan langsung melakukan implementasi kode.

Tujuan utama task ini adalah memastikan `DESIGN.md` benar-benar merepresentasikan business process bimbel yang sebenarnya, memiliki domain model yang konsisten, tidak over-engineered, dan siap digunakan sebagai technical reference untuk development selanjutnya.

---

## 1. Existing Project Context

Stack utama yang digunakan:

- Next.js
- TypeScript
- Supabase PostgreSQL
- Supabase Storage
- Better Auth
- shadcn/ui
- Zustand
- React Hook Form
- Zod

Arsitektur aplikasi:

- Next.js sebagai frontend/application layer
- Supabase PostgreSQL sebagai database
- Supabase Storage untuk file/foto
- Better Auth untuk authentication
- Server-side authorization wajib diterapkan
- Row Level Security (RLS) Supabase harus menjadi bagian dari security architecture jika relevan

Jangan mengganti stack tersebut kecuali terdapat alasan teknis yang sangat kuat.

---

# 2. Business Context

Sistem digunakan untuk menunjang operasional bimbel, terutama:

- autentikasi
- pencarian murid
- manajemen murid
- manajemen tutor
- manajemen jadwal
- absensi murid
- pencatatan materi pembelajaran
- histori perkembangan murid
- manajemen honor tutor
- laporan perkembangan murid

Saat ini terdapat dua role utama:

1. Management
2. Tutor

Jangan menambahkan role lain kecuali benar-benar diperlukan oleh domain model.

---

# 3. Core Business Rules

Gunakan aturan berikut sebagai source of truth.

## 3.1 Tutor dan Murid

Relasi tutor dan murid adalah many-to-many.

Artinya:

- satu tutor dapat mengajar banyak murid
- satu murid dapat diajar oleh beberapa tutor
- tutor yang mengajar seorang murid dapat berbeda dari satu pertemuan ke pertemuan lainnya

Contoh:

Alghazy:

- Pertemuan #1 → Abi Yoko
- Pertemuan #2 → Abi Govin
- Pertemuan #3 → Abi Hanif

Jangan mengasumsikan bahwa satu murid hanya memiliki satu tutor permanen.

Jika diperlukan histori assignment tutor, desain harus mampu menyimpan histori tersebut.

---

# 4. Jenis Bimbel

Terdapat tiga jenis layanan bimbel:

| Jenis | Durasi |
|---|---:|
| Reguler | 60 menit |
| Intensif | 75 menit |
| Private | 90 menit |

Jenis bimbel harus menjadi data eksplisit.

Jangan menentukan jenis bimbel hanya berdasarkan durasi waktu.

Contoh:

```text
bimbel_type = reguler
duration_minutes = 60