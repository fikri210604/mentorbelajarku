# BUSINESS_RULES.md — Aturan Bisnis Sistem Bimbel & Presensi

Dokumen ini mendefinisikan seluruh aturan bisnis (*business rules*), invariant data, dan kebijakan perhitungan untuk sistem bimbingan belajar.

---

## 1. Identitas & Entitas Utama

### 1.1. Student Identifier
- `student_code` adalah business identifier unik bagi murid (contoh: `STD-2026-001`).
- Nama murid (`name`) tidak boleh diasumsikan unik.
- Primary key internal menggunakan UUID untuk menjaga relational integrity.

### 1.2. Relasi Tutor – Murid
- Hubungan bukan 1:1 kaku. Sistem mendukung:
  - 1 tutor mengajar banyak murid.
  - 1 murid dapat diajar oleh lebih dari 1 tutor untuk mata pelajaran/hari yang berbeda.
  - Pergantian tutor permanen maupun tutor pengganti per sesi.

---

## 2. Pemisahan Schedule vs Session vs Attendance

Ketiga konsep ini **HARUS DIPISAHKAN** ke tabel/model tersendiri:

1. **Schedule (Rencana / Jadwal Rutin)**:
   - Merepresentasikan rencana belajar berulang (misal: "Setiap Rabu jam 16:00, Reguler, Tutor Abi").
   - Schedule bukan bukti bahwa belajar telah terjadi.

2. **Session (Kejadian Belajar Aktual)**:
   - Merepresentasikan pertemuan nyata pada tanggal spesifik (misal: "Rabu, 9 September 2026 jam 16:00").
   - Memiliki status: `scheduled`, `completed`, `rescheduled`, `cancelled`.
   - Menyimpan `tutor_id` aktual yang mengajar (bukan semata-mata mengacu ke schedule).

3. **Attendance (Presensi Murid per Sesi)**:
   - Status kehadiran murid individual terhadap sesi tersebut.
   - Status: `present`, `absent`, `permission`, `sick`, `late`.
   - Menyimpan foto presensi (`photo_path` di Supabase Storage), waktu absen, dan pencatat absensi (`checked_in_by`).

---

## 3. Jenis Bimbel & Durasi

Sistem mendukung jenis bimbel terkonfigurasi dengan durasi default:
- **Reguler**: 60 menit
- **Intensif**: 75 menit
- **Private**: 90 menit

*Durasi dan tipe disimpan dalam database (`bimbel_types`) dan tidak di-hardcode dalam logika bisnis.*

---

## 4. Kehadiran, Izin, & Rescheduling

### 4.1. Kebijakan Izin (`permission`)
- Sesi dengan status `permission` (atau `sick` sesuai kebijakan):
  - **TIDAK** dihitung sebagai completed learning session bagi murid tersebut.
  - **TIDAK** memotong kuota paket murid (`total_sessions`).
  - Murid berhak dijadwalkan ulang (*rescheduled*).

### 4.2. Integritas Rescheduling
- Rescheduling **TIDAK BOLEH MENGHAPUS** riwayat sesi awal.
- Sesi awal ditandai sebagai `rescheduled`, dan sesi pengganti baru dibuat dengan referensi riwayat sesi awal.

---

## 5. Perhitungan & Pengkodean Nomor Pertemuan ("P1, P2, ...")

- **Format Pengkodean Pertemuan**: Pertemuan dikodekan secara baku menggunakan prefiks **P** diikuti nomor urut pertemuan efektif (contoh: pertemuan ke-1 dikodekan sebagai **P1**, pertemuan ke-2 sebagai **P2**, dst.).
- Nomor pertemuan tidak boleh dihitung dari sekadar urutan jadwal yang telah lewat (`COUNT(schedules)`).
- Nomor pertemuan dihitung secara dinamis dari **kehadiran riil yang sah** (`present` / status terhitung) dalam enrollment paket terkait.
- Contoh alur:
  - Sesi 1: Hadir -> **P1**
  - Sesi 2: Hadir -> **P2**
  - Sesi 3: Izin -> Tetap **P2** (kuota pertemuan utuh & tidak berkurang)
  - Sesi 3 (Pengganti): Hadir -> **P3**

---

## 6. Tarif Tutor & Integritas Historis (Historical Rates)

### 6.1. Konfigurasi Tarif
- Tarif tutor dikonfigurasi per jenis bimbel dalam database (`tutor_rates`).
- Tarif tidak boleh di-hardcode dalam kode TypeScript/JavaScript.

### 6.2. Immutability Historis
- Tarif yang sudah digunakan dalam periode payroll historis **TIDAK BOLEH BERUBAH SECARA RETROAKTIF**.
- Pembaruan tarif menggunakan effective dating (`effective_from`, `effective_until`).
- Pembaruan tarif baru membuat baris baru dengan `effective_from` baru, sehingga perhitungan honor sesi lampau tetap akurat.

---

## 7. Kalkulasi Honor / Payroll Tutor

### 7.1. Formula Perhitungan
- Fee tutor dihitung berdasarkan jumlah murid yang menjadi dasar pembayaran pada sesi tersebut:
  $$\text{Fee Sesi} = \text{Tarif Berlaku} \times \text{Jumlah Murid Terbayar}$$
- Contoh:
  - Tarif = Rp25.000 / murid.
  - Murid hadir (payable) = 4 orang.
  - Fee sesi = Rp100.000.

### 7.2. Otoritas Server
- **Seluruh perhitungan honor WAJIB dieksekusi di server** (Server Action / API Route).
- Nilai fee dari browser/client tidak pernah dipercaya.

---

## 8. Verifikasi & Penyimpanan Foto Presensi

- Foto absensi diambil melalui browser webcam (`react-webcam`) dan diunggah ke **Supabase Storage**.
- Database PostgreSQL hanya menyimpan `photo_path` (misal: `attendance/{year}/{month}/{session_id}/{student_id}.jpg`).
- Validasi wajib di server: validasi MIME type (`image/jpeg`, `image/png`, `image/webp`), batas ukuran file (maks 5MB), dan otentikasi pengunggah.

---
## 9. Sesi dan biaya Bimbel

Reguler
- Calistung  (Anak TK) = 8 Sesi (per sesi 75 menit) = Rp. 350.000/bulan
- SD  (kelas 1-6) = 8 Sesi (per sesi 75 menit) = Rp. 400.000/bulan
- SMP  (kelas 7-9) = 8 Sesi (per sesi 90 menit) = Rp. 480.000/bulan
- SMA  (kelas 11-12) = 8 Sesi (per sesi 90 menit) = Rp. 560.000/bulan
Intensif
- Calistung (Anak TK) = 12 Sesi (per sesi 75 menit) = Rp. 500.000/bulan
- SD  (kelas 1-6) = 12 Sesi (per sesi 75 menit) = Rp. 600.000/bulan
- SMP  (kelas 7-9) = 12 Sesi (per sesi 90 menit) = Rp. 700.000/bulan
- SMA  (kelas 11-12) = 12 Sesi (per sesi 90 menit) = Rp. 800.000/bulan

## 10. Audit Logging

Setiap mutasi pada data sensitif wajib mencatat audit log di server:
- Koreksi status presensi murid oleh Management.
- Perubahan tarif tutor (`tutor_rates`).
- Transisi status payroll (`draft` -> `finalized` -> `paid`).
- Perubahan sesi/jadwal yang mempengaruhi kalkulasi honor.

Record audit log minimal mencatat: `user_id`, `action`, `entity_type`, `entity_id`, `old_data`, `new_data`, `created_at`.

## Alur sistem yang akan dimulai
Karena sistem ini baru dan belum memiliki data, jadi pertama seluruh tutor dan murid akan didaftarkan oleh manajemen, manajemen memiliki akun seeder, ketika sudah dibuat, tutor akan memiliki email dan password default. Tutor masuk ke sistem kemudian akan muncul notifikasi (alert) yang menyarankan untuk mengganti password dari defaultnya. 

Karena jadwal dll belum ada, manajemen perlu juga untuk membuat jadwal, dalam jadwal itu, juga bisa buat seed seperti ini. Ketika sudah dibuatkan jadwal, maka tutor bisa mengisikan jadwalnya. Ketika tutor sudah melakukan absen, maka akan terlihat bahwa murid tersebut sudah pertemuan ke berapanya 

| No | Nama Murid         | Kelas & Materi | Waktu       | Mentor     |
| -: | ------------------ | ------------ | ----------- | ---------- |
|  1 | Ralisa             | 1 SD+ngaji   | 13.00–14.00 | Umi Fara   |
|  2 | Arsyila            | 2 SD+ngaji   | 13.00–14.00 | Umi Fara   |
|  3 | Rumaisaha          | 5 SD         | 14.00–15.15 | Umi Fara   |
|  4 | Nadiv              | 9 SMP        | 16.00–17.15 | Umi Fara   |
|  5 | Dhea               | 9 SMP        | 16.00–17.15 | Umi Fara   |
|  5 | Zihan              | 9 SMP        | 16.00–17.15 | Umi Fara   |
|  6 | Banita mtk         | 9 SMP        | 16.00–17.15 | Abi Yoko   |
|  7 | Zaneta mtk         | 9 SMP        | 16.00–17.15 | Abi Yoko   |
|  8 | Dero mtk           | 9 SMP        | 16.00–17.15 | Abi Yoko   |
|  9 | Amira (B.Ing)      | TKA 9 SMP    | 16.30–17.45 | Abi Ihsan  |
| 10 | Meysha             | TKA 9 SMP    | 16.30–17.45 | Abi Ihsan  |
| 11 | Almaira            | TKA 9 SMP    | 16.30–17.45 | Abi Ihsan  |
| 12 | Shafa              | TKA 9 SMP    | 16.30–17.45 | Abi Ihsan  |
| 13 | Urfa               | TKA 9 SMP    | 16.30–17.45 | Abi Ihsan  |
| 14 | Annisa SD          | 4 SD         | 08.00–09.15 | Abi Herwin |
| 15 | Melody             | 4 SD         | 09.30–10.30 | Abi Herwin |
| 16 | Miqdad             | 3 SD Menulis | 10.00–11.15 | Abi Herwin |
| 17 | Alfatih            | calistung SD | 11.00–12.00 | Abi Herwin |
| 18 | Tian               | Calistung SD | 13.00–14.15 | Abi Herwin |
| 19 | Sena               | 1 SD         | 13.00–14.00 | Abi Herwin |
| 20 | Mauza              | Calistung TK | 13.00–14.00 | Abi Herwin |
| 21 | Kayla              | 9 SMP+ngaji  | 16.00–17.15 | Abi Herwin |
| 23 | Nuri               | 5 SD         | 15.00–16.15 | Umi Anjel  |
| 24 | Zoeya              | 2 SD         | 16.00–17.00 | Umi Anjel  |
| 25 | Yasmin             | Calistung    | 16.30–17.30 | Umi Anjel  |
| 26 | Rafa bimbel (TKA)  | 6 SD         | 16.00–17.15 | Abi Hanif  |
| 27 | Salman (TKA)       | 6 SD         | 16.00–17.00 | Abi Hanif  |
| 28 | Najmi (kimia)      | 10 SMA       | 14.00–15.30 | Abi Govin  |
| 29 | Lionel             | 10 SMA       | 14.00–15.30 | Abi Govin  |
| 30 | Fathan             | 8 SMP        | 16.00–17.15 | Abi Govin  |
| 31 | Yani               | 12 SMA       | 16.00–17.30 | Abi Govin  |
| 32 | Naufal             | 12 SMA       | 17.00–18.00 | Abi Govin  |
| 33 | Inara privat       | Mengaji      | 15.00–16.15 | Umi Elsa   |
| 34 | Cicam privat       | Calistung SD | 16.20–17.35 | Umi Elsa   |
| 35 | Amirah privat      | 2 SD         | 18.30–20.00 | Umi Nabila |
| 36 | Sesha privat ngaji | 3 SD         | 16.30–17.45 | Umi Nasywa |
| 37 | Afsheena privat    | 5 SD         | 16.00–17.15 | Umi Firda  |

* Ini Contoh untuk laporan bimbel

ini seed untuk ke database nya
insert into students (
    name,
    level
)
values
    ('Ralisa', '1 SD'),
    ('Arsyila', '2 SD'),
    ('Rumaisaha', '5 SD'),
    ('Nadiv', '9 SMP'),
    ('Dhea', '9 SMP'),
    ('Zihan', '9 SMP'),
    ('Banita', '9 SMP'),
    ('Zaneta', '9 SMP'),
    ('Dero', '9 SMP'),
    ('Amira', 'TKA 9 SMP'),
    ('Meysha', 'TKA 9 SMP'),
    ('Almaira', 'TKA 9 SMP'),
    ('Shafa', 'TKA 9 SMP'),
    ('Urfa', 'TKA 9 SMP'),
    ('Annisa', '4 SD'),
    ('Melody', '4 SD'),
    ('Miqdad', '3 SD'),
    ('Alfatih', 'Calistung SD'),
    ('Tian', 'Calistung SD'),
    ('Sena', '1 SD'),
    ('Mauza', 'Calistung TK'),
    ('Kayla', '9 SMP'),
    ('Nuri', '5 SD'),
    ('Zoeya', '2 SD'),
    ('Yasmin', 'Calistung'),
    ('Rafa', '6 SD'),
    ('Salman', '6 SD'),
    ('Najmi', '10 SMA'),
    ('Lionel', '10 SMA'),
    ('Fathan', '8 SMP'),
    ('Yani', '12 SMA'),
    ('Naufal', '12 SMA'),
    ('Inara', 'Mengaji'),
    ('Cicam', 'Calistung SD'),
    ('Amirah', '2 SD'),
    ('Sesha', '3 SD'),
    ('Afsheena', '5 SD');


insert into tutors (
    name
)
values
    ('Umi Fara'),
    ('Abi Yoko'),
    ('Abi Ihsan'),
    ('Abi Herwin'),
    ('Umi Anjel'),
    ('Abi Hanif'),
    ('Abi Govin'),
    ('Umi Elsa'),
    ('Umi Nabila'),
    ('Umi Nasywa'),
    ('Umi Firda');

insert into programs (
    code,
    name
)
values
    ('MTK', 'Matematika'),
    ('BINDO', 'Bahasa Indonesia'),
    ('BING', 'Bahasa Inggris'),
    ('TKA', 'TKA'),
    ('MENGAJI', 'Mengaji'),
    ('CALISTUNG', 'Calistung'),
    ('MENULIS', 'Menulis'),
    ('KIMIA', 'Kimia');

Nah, contoh ini justru mengungkap satu hal penting yang perlu kita revisi dari rancangan sebelumnya: konsep pertemuan ke-X ternyata tidak selalu merupakan counter global berdasarkan seluruh riwayat murid.

Pada laporan ini:

22 Oktober → pertemuan 12
23 Oktober → kembali menjadi 1
28 Oktober → 2
30 Oktober → 3
dan seterusnya.

Artinya ada kemungkinan paket/periode/program bimbel baru yang memulai kembali hitungan pertemuan. Jadi kalau kita hanya membuat:

COUNT(attendance WHERE status = present)

sebagai meeting_number, desain tersebut tidak cukup.

1. Yang saya tangkap dari laporan ini

Struktur laporan sebenarnya mengandung beberapa informasi berbeda:

Informasi	Contoh
Tanggal	1 Oktober 2025
Status kehadiran	Hadir, telat, terhitung masuk
Materi	MTK, SBD, IPAS, B. Lampung
Catatan pembelajaran	latihan soal, penguatan materi
Pertemuan	2
Tutor	Umi Novita
Periode/paket	tersirat dari reset pertemuan
Pencapaian	ada bagian evaluasi terpisah

Jadi jangan jadikan satu kolom notes untuk semuanya.

2. Saya akan mengubah konsep Enrollment

Sebelumnya kita punya:

student
    ↓
student_program

Saya rasa perlu dibuat lebih eksplisit:

Student
   ↓
Enrollment
   ↓
Sessions
   ↓
Attendance

Enrollment berarti keikutsertaan murid pada suatu paket/program/periode bimbel tertentu.

Contohnya:

Alghazy
│
├── Enrollment #1
│   ├── mulai: September 2026
│   ├── program: TKA
│   └── pertemuan: 1–12
│
└── Enrollment #2
    ├── mulai: Oktober 2026
    ├── program: MTK
    └── pertemuan: 1–12

Sehingga:

23 Oktober 2025 → Pertemuan 1

bukan karena database menghitung ulang seluruh attendance, tetapi karena itu merupakan pertemuan pertama pada enrollment/periode baru.

3. Schema yang lebih tepat

Saya akan mengubah:

student_programs

menjadi atau dilengkapi dengan:

enrollments

Contoh:

enrollments
-----------------------------
id
student_id
program_id
bimbel_type_id
start_date
end_date
total_meetings
status
created_at
updated_at

Misalnya:

Alghazy
Enrollment #1
MTK
Regular
01-09-2025
30-09-2025
12 meetings

Kemudian enrollment berikutnya:

Alghazy
Enrollment #2
MTK
Regular
23-10-2025
...
12 meetings
4. meeting_number tetap tidak perlu menjadi source of truth

Tetapi saya perlu sedikit mengoreksi pernyataan sebelumnya.

Saya masih tidak menyarankan meeting_number bebas diedit oleh user.

Namun sistem membutuhkan cara menentukan:

"Ini pertemuan keberapa dalam enrollment ini?"

Maka:

Enrollment
    ↓
eligible attendance
    ↓
sequence

Contohnya:

Enrollment #2

Attendance
23 Okt → 1
28 Okt → 2
30 Okt → 3
4 Nov  → 4
5 Nov  → 5
...

Jadi secara konsep:

meeting_number =
jumlah pertemuan yang dihitung
dalam enrollment tersebut

Bukan:

jumlah seluruh attendance sepanjang hidup murid
5. Status kehadiran juga perlu dipisahkan

Dari contoh:

"Hadir, namun hanya sebentar karena telat"

Ini sebenarnya bukan notes semata.

Saya akan menggunakan:

status

dengan:

present
late
permission
sick
absent

Kemudian:

notes

berisi:

Hanya mengikuti pembelajaran sebentar karena datang terlambat.

Sehingga:

{
  "status": "late",
  "material": "MTK: pecahan, persen, desimal",
  "notes": "Murid hadir tetapi terlambat."
}

Ini jauh lebih mudah untuk laporan dan statistik.

6. Tetapi ada kasus "terhitung masuk"

Contoh:

3 Oktober → terhitung masuk

Ini menarik.

Kita jangan langsung menganggap:

status = present

karena secara bisnis bisa saja ada alasan khusus.

Saya justru akan menambahkan:

attendance_status

dan:

attendance_notes

Misalnya:

{
  "status": "present",
  "material": null,
  "notes": "Terhitung masuk"
}

Jadi sistem tidak memaksa tutor mengisi materi ketika memang tidak ada materi yang dicatat.

7. Pencapaian dan Evaluasi juga perlu masuk desain

Ini sebelumnya belum cukup kita masukkan.

Saya melihat ada dua kemungkinan desain.

Opsi A — per pertemuan
Attendance
├── material
├── notes
├── achievement
└── evaluation

Misalnya:

Materi:
MTK: Pecahan

Pencapaian:
Murid mampu membandingkan pecahan.

Evaluasi:
Masih perlu latihan pada pecahan senilai.
Opsi B — laporan perkembangan berkala

Ini menurut saya lebih cocok dengan format spreadsheet yang kamu tunjukkan.

Student
   ↓
Progress Reports
   ↓
Achievement
Evaluation

Karena "Pencapaian dan Evaluasi" kemungkinan merupakan kesimpulan perkembangan murid, bukan sekadar catatan satu kali pertemuan.

Saya lebih condong ke Opsi B, tetapi tetap menyediakan notes pada attendance.

8. Maka struktur domain kita menjadi seperti ini
STUDENT
   │
   ├── ENROLLMENT
   │       │
   │       ├── Program
   │       ├── Bimbel Type
   │       ├── Total Meetings
   │       └── Period
   │
   ├── SCHEDULE
   │       │
   │       └── Tutor
   │
   └── PROGRESS REPORT
           │
           ├── Achievement
           └── Evaluation


SCHEDULE
   │
   ▼
SESSION
   │
   ▼
ATTENDANCE
   ├── Student
   ├── Tutor
   ├── Status
   ├── Material
   ├── Notes
   └── Photo
9. Ada satu hal lagi yang sangat penting: tutor bisa berganti

Laporanmu menunjukkan:

1 Okt → Umi Novita
2 Okt → Umi Nopu
3 Okt → Umi Nopu
...
9 Okt → Umi Novita
...

Ini memperkuat keputusan kita sebelumnya bahwa:

students.tutor_id

tidak boleh ada.

Tutor yang mengajar harus ditentukan pada konteks schedule/session/attendance.

Contohnya:

Alghazy
   │
   ├── 1 Okt
   │     └── Umi Novita
   │
   ├── 2 Okt
   │     └── Umi Nopu
   │
   └── 9 Okt
         └── Umi Novita

Ini persis kebutuhan domain yang kamu jelaskan sejak awal.

10. Struktur database yang sekarang lebih matang

Saya akan arahkan ke:

users
│
├── tutors
└── management


students
│
├── enrollments
│     │
│     ├── programs
│     └── bimbel_types
│
├── student_programs
│
└── progress_reports


tutors
│
├── tutor_students
├── schedules
└── tutor_rates


schedules
│
├── tutor
├── schedule_students
└── sessions


sessions
│
└── attendances
       │
       ├── student
       ├── tutor
       ├── status
       ├── material
       ├── notes
       └── photo


attendances
│
└── payroll_items
11. Dan untuk synthetic data, contoh ini sangat berguna

Sekarang kita punya edge case nyata yang bisa dimasukkan ke seed:

Alghazy
│
├── Enrollment A
│   ├── Meeting 1
│   ├── Meeting 2
│   ├── ...
│   └── Meeting 12
│
└── Enrollment B
    ├── Meeting 1  ← reset
    ├── Meeting 2
    ├── Meeting 3
    └── ...

Dengan tutor:

Meeting 2 → Umi Novita
Meeting 3 → Umi Nopu
Meeting 4 → Umi Nopu
Meeting 7 → Umi Novita

Dan status:

present
present
present
late
permission

Ini jauh lebih realistis untuk mengetes sistem daripada synthetic data random.

Jadi ada revisi penting terhadap PRD-mu

Bagian:

total_meetings / pertemuan ke-X tidak boleh disimpan sebagai angka bebas-edit — harus dihitung (COUNT(attendance WHERE status='present'))

perlu diubah.

Lebih tepat:

Nomor pertemuan merupakan urutan kehadiran yang dihitung dalam konteks enrollment/periode bimbel tertentu. Nomor pertemuan tidak boleh diedit bebas oleh user. Attendance yang berstatus tidak mengonsumsi pertemuan, seperti izin/sakit, tidak menambah urutan pertemuan.

Dengan perubahan ini, rancangan kita jauh lebih sesuai dengan laporan bimbel yang sebenarnya.

Dan saya akan menahan diri untuk belum membuat SQL final sampai kita menentukan satu hal: apa sebenarnya yang menyebabkan pertemuan kembali dari 12 menjadi 1 pada 23 Oktober — apakah paket 12x selesai, pergantian bulan, atau memang admin membuat periode baru. Itu bukan detail kecil; itu menentukan desain enrollment dan perhitungan honor.

jadi pertemuan itu tiap 12 kali, karena paket bimbel itu maksimal 12 kali, dan ketika sudah 12, maka akan reset ke 1

Nah, kalau begitu sekarang konsepnya jelas. Ini justru membuat model enrollment/package jauh lebih kuat.

Berarti aturan bisnis sebenarnya:

Satu paket bimbel terdiri dari maksimal 12 pertemuan. Setelah pertemuan ke-12 selesai, paket tersebut berakhir dan pertemuan pada paket berikutnya kembali dihitung dari 1.

Jadi meeting_number bukan counter global murid, tetapi counter di dalam satu paket bimbel.

Contoh
Alghazy
│
├── Paket #1
│   ├── Pertemuan 1
│   ├── Pertemuan 2
│   ├── ...
│   └── Pertemuan 12
│
└── Paket #2
    ├── Pertemuan 1
    ├── Pertemuan 2
    ├── Pertemuan 3
    └── ...

Ini menjelaskan persis laporan yang kamu berikan:

22 Okt 2025 → Pertemuan 12
23 Okt 2025 → Pertemuan 1
28 Okt 2025 → Pertemuan 2
30 Okt 2025 → Pertemuan 3
1. Saya akan ubah model enrollment

Menurut saya nama yang lebih tepat bahkan bisa:

enrollments

dengan konsep:

enrollment = 1 paket bimbel murid

Misalnya:

enrollment_id: ENR-001
student: Alghazy
package: 12 pertemuan
start_date: 2025-09-01
end_date: 2025-10-22
status: completed

Kemudian:

ENR-002
student: Alghazy
package: 12 pertemuan
start_date: 2025-10-23
status: active
2. Schema yang saya rekomendasikan
enrollments
------------------------------
id
student_id
bimbel_type_id
start_date
end_date
max_meetings
status
created_at
updated_at

Contoh:

id              ENR-001
student_id      STU-001
bimbel_type     REGULAR
start_date      2025-09-01
end_date        2025-10-22
max_meetings    12
status          completed

Kemudian paket kedua:

id              ENR-002
student_id      STU-001
bimbel_type     REGULAR
start_date      2025-10-23
end_date        null
max_meetings    12
status          active
3. Apakah max_meetings perlu disimpan?

Ya.

Ini berbeda dengan meeting_number.

Sebelumnya saya mengatakan angka pertemuan jangan disimpan. Itu masih benar untuk meeting_number.

Tetapi:

max_meetings = 12

boleh disimpan karena itu adalah atribut paket, bukan hasil transaksi.

Bahkan saya sarankan:

max_meetings

bukan hardcode 12.

Karena suatu saat Management mungkin membuat:

Paket 4x
Paket 8x
Paket 12x
Paket 16x

Maka sistem tetap fleksibel.

4. Bagaimana menghitung pertemuan?

Misalnya:

Enrollment #1
max_meetings = 12

Ada attendance:

1
2
3
4
5
6
7
8
9
10
11
12

Maka:

remaining_meetings = 0

Enrollment berubah:

completed

Ketika murid mengambil paket berikutnya:

Enrollment #2

maka:

meeting_number = 1
5. Status permission tidak menambah pertemuan

Ini juga sesuai dengan aturan yang kamu jelaskan sebelumnya.

Misalnya:

Paket #1

3 Sep → Present → Pertemuan 1
5 Sep → Present → Pertemuan 2
10 Sep → Permission
12 Sep → Present → Pertemuan 3

Bukan:

10 Sep → Pertemuan 3
12 Sep → Pertemuan 4 ❌

Tetapi:

10 Sep → Permission → tidak mengonsumsi paket
12 Sep → Pertemuan 3

Jadi kita perlu mendefinisikan eligible attendance.

6. Jangan menghitung berdasarkan attendance secara sembarangan

Ini bagian yang cukup penting.

Misalnya:

present
late
permission
sick
absent

Yang mengonsumsi paket:

present
late

Sedangkan:

permission
sick
absent

tidak mengonsumsi pertemuan.

Namun kamu sebelumnya juga mengatakan kalau murid izin, jadwal bisa diganti/reschedule.

Jadi secara domain:

Attendance
    ↓
Apakah mengonsumsi paket?
    │
    ├── YES → meeting_number bertambah
    │
    └── NO  → tidak bertambah

Saya bahkan akan membuat aturan ini eksplisit di backend, bukan sekadar:

WHERE status = 'present'

karena nanti status bisa berkembang.

7. late bagaimana?

Dari laporan:

Hadir, namun hanya sebentar karena telat

Maka saya akan perlakukan:

status = late

dan:

consumes_meeting = true

Jadi:

late → tetap pertemuan

Karena murid tetap menerima pembelajaran.

8. Bagaimana dengan tutor berbeda?

Ini tidak mengganggu konsep paket sama sekali.

Misalnya:

Enrollment Alghazy #1
│
├── Meeting 1 → Abi Yoko
├── Meeting 2 → Abi Govin
├── Meeting 3 → Abi Hanif
├── Meeting 4 → Umi Nopu
└── ...

Jadi:

Enrollment
    │
    └── Sessions
           │
           └── Attendance
                  │
                  └── Tutor

Tutor ditentukan pada session/attendance, bukan pada enrollment sebagai pemilik tetap.

9. Ini juga menyelesaikan masalah laporanmu

Laporan:

Tanggal	Materi	Pertemuan	Mentor
1 Okt	MTK dan SBD ujian	2	Umi Novita
2 Okt	IPAS dan B.Lampung	3	Umi Nopu
3 Okt	Terhitung masuk	4	Umi Nopu
...	...	...	...
22 Okt	MTK pola gambar	12	Umi Nopu
23 Okt	MTK pecahan senilai	1	Umi Nopu

Di database:

Enrollment #1
    ↓
Attendance 1–12
    ↓
COMPLETED

Enrollment #2
    ↓
Attendance 1...

Tidak perlu melakukan "reset counter" terhadap data lama.

Ini penting.

Jangan pernah melakukan:

UPDATE attendance
SET meeting_number = 1

ketika paket baru dimulai.

Data lama harus tetap immutable secara historis:

Paket #1 → 1–12
Paket #2 → 1–12
Paket #3 → 1–12
10. Bahkan API-nya jadi lebih jelas

Untuk mendapatkan progres murid:

GET /api/v1/students/:studentId/enrollments/current

Response:

{
  "enrollment": {
    "id": "enr_002",
    "max_meetings": 12,
    "used_meetings": 3,
    "remaining_meetings": 9,
    "status": "active"
  }
}

Ketika tutor mencari Alghazy:

Alghazy
Kelas 6 SD

Paket aktif
3 / 12 pertemuan
Sisa 9 pertemuan

Kemudian tampilkan:

Riwayat pertemuan

#1 — Abi Yoko
#2 — Abi Govin
#3 — Abi Hanif

Ini jauh lebih informatif daripada sekadar:

Pertemuan ke-3
11. Ada satu keputusan yang sekarang juga perlu kita kunci

Siapa yang membuat enrollment/paket baru?

Menurut saya:

Management
Management
   ↓
Buat paket baru
   ↓
Student
   ↓
12 pertemuan

Tutor tidak boleh membuat paket baru ketika pertemuan ke-12 selesai.

Ketika:

used_meetings = 12

sistem memberi status:

COMPLETED

dan Management kemudian membuat enrollment berikutnya.

Ini mencegah tutor secara tidak sengaja membuat paket baru dan mengacaukan perhitungan honor.

Jadi model domain kita sekarang
STUDENT
   │
   ├───────────────┐
   │               │
   ▼               ▼
ENROLLMENT     PROGRESS REPORT
   │
   │ max 12
   ▼
SCHEDULE
   │
   ▼
SESSION
   │
   ▼
ATTENDANCE
   │
   ├── status
   ├── material
   ├── notes
   ├── photo
   └── tutor

Dengan:

Enrollment #1
    └── Meeting 1–12

Enrollment #2
    └── Meeting 1–12

Enrollment #3
    └── Meeting 1–12

Ini menurut saya sudah jauh lebih sesuai dengan probis nyata bimbelmu.

Dan setelah aturan ini dikunci, rancangan ERD + migration Supabase sebaiknya mengikuti model ini. Terutama kita perlu menentukan apakah Schedule berada di bawah Enrollment, karena kalau jadwal berubah/reschedule dan paket tetap sama, relasinya harus dirancang supaya histori tidak rusak.