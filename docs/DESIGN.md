# DESIGN.md — Technical Design: Bimbel Attendance System

## 1. Tujuan Sistem

Sistem ini merupakan aplikasi manajemen bimbingan belajar yang menangani:

* Manajemen student
* Manajemen tutor
* Program/mata pelajaran
* Jenis bimbel
* Enrollment/paket belajar
* Relasi tutor–student
* Kelas kelompok
* Jadwal rutin
* Actual learning session
* Attendance
* Rescheduling
* Catatan pembelajaran
* Tarif tutor
* Payroll/honor tutor
* Laporan
* Foto absensi
* Audit log

Sistem harus memisahkan dengan jelas antara **rencana**, **kejadian aktual**, dan **data transaksi** agar histori dan perhitungan honor tetap akurat.

---

# 2. Arsitektur Tingkat Tinggi

```text
                         ┌─────────────────────┐
                         │       Browser       │
                         │ Next.js App Router  │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
             Server Components              Client Components
                    │                               │
                    │                      ┌────────┼─────────┐
                    │                      │        │         │
                    │                    Forms    Camera    Tables
                    │                      │        │         │
                    │                React Hook   react-   TanStack
                    │                Form + Zod    webcam   Table
                    │                      │
                    │                   Zustand
                    │                  (UI state)
                    │
        ┌───────────┴───────────────────────────┐
        │                                       │
   Server Actions                         Route Handlers
        │                                       │
        └──────────────────┬────────────────────┘
                           │
                  Authentication
                    Better Auth
                           │
                  Authorization Check
                           │
                    Zod Validation
                           │
                    Domain Services
                           │
        ┌──────────────────┼────────────────────┐
        │                  │                    │
     Students           Attendance            Payroll
     Tutors              Sessions          (server-only)
     Programs            Schedules
        │                  │                    │
        └──────────────────┼────────────────────┘
                           │
                  Supabase PostgreSQL
                           │
             ┌─────────────┴─────────────┐
             │                           │
         PostgreSQL                 Supabase Storage
      Business Data               Attendance Photos
             │
             │
       RLS + Server Authorization
```

### Prinsip utama

* Better Auth hanya untuk authentication/session/identity.
* Supabase hanya untuk PostgreSQL dan Storage.
* Server adalah security dan business-rule boundary.
* PostgreSQL adalah source of truth.
* Zustand bukan source of truth untuk server data.
* Foto tidak disimpan sebagai binary di PostgreSQL.
* Payroll selalu dihitung di server.

---

# 3. Technology Stack

## Application

* Next.js — App Router
* TypeScript
* Tailwind CSS
* shadcn/ui

## Authentication

* Better Auth

## Database

* Supabase PostgreSQL

## Storage

* Supabase Storage

## Form & Validation

* React Hook Form
* Zod
* `@hookform/resolvers`

## Client State

* Zustand

## Data Table

* TanStack Table

## Camera

* `react-webcam`

## Date Utility

* `date-fns`

---

# 4. Database Design Principles

Gunakan:

* UUID sebagai primary key internal.
* Business identifier terpisah dari primary key.
* Foreign key untuk menjaga referential integrity.
* Unique constraint untuk identifier yang memang unik.
* Check constraint untuk enum/domain values penting.
* Index untuk query yang sering dilakukan.
* Migration SQL eksplisit melalui Supabase migrations.
* Transaction untuk mutation yang menyentuh beberapa tabel dan harus atomic.

Jangan mengandalkan frontend untuk menjaga database integrity.

---

# 5. Profiles

```text
profiles
------------------------------------------------
id              uuid pk
user_id         uuid unique
full_name       text
phone            text
avatar_url       text nullable
role             text
created_at       timestamptz
updated_at       timestamptz
```

### Role MVP

```text
management
tutor
```

`role` harus didesain agar mudah diperluas di masa depan.

Contoh:

```text
parent
admin
finance
```

`user_id` merupakan identifier yang berasal dari Better Auth dan harus dipetakan secara eksplisit ke profile.

Jangan mengasumsikan Supabase `auth.uid()` otomatis sama dengan Better Auth user ID.

---

# 6. Students

```text
students
------------------------------------------------
id              uuid pk
student_code    text unique
name            text
gender          text
birth_date      date nullable
school          text nullable
grade           text nullable
parent_name     text nullable
parent_phone    text nullable
address         text nullable
status          text
created_at      timestamptz
updated_at      timestamptz
```

### Status

```text
active
inactive
graduated
```

`student_code` merupakan business identifier.

Nama student tidak boleh digunakan sebagai identifier unik.

---

# 7. Tutors

```text
tutors
------------------------------------------------
id              uuid pk
profile_id      uuid fk -> profiles.id
bio             text nullable
status          text
created_at      timestamptz
updated_at      timestamptz
```

### Status

```text
active
inactive
```

Satu tutor memiliki profile Better Auth melalui `profiles`.

---

# 8. Programs

Program merepresentasikan bidang/mata pelajaran yang dipelajari student.

```text
programs
------------------------------------------------
id              uuid pk
name            text
description     text nullable
level           text
status          text
created_at      timestamptz
updated_at      timestamptz
```

Contoh:

```text
Matematika
Bahasa Inggris
Fisika
TKA
```

Level dapat berupa:

```text
SD
SMP
SMA
```

---

# 9. Bimbel Types

```text
bimbel_types
------------------------------------------------
id                  uuid pk
name                text
duration_minutes    int
description         text nullable
status              text
created_at          timestamptz
updated_at          timestamptz
```

Jenis bimbel MVP:

```text
Reguler
Intensif
Private
```

Default duration:

```text
Reguler   = 60 menit
Intensif  = 75 menit
Private   = 90 menit
```

Durasi disimpan sebagai data sehingga dapat dikonfigurasi dan tidak hardcoded di seluruh aplikasi.

Jenis bimbel harus menjadi field eksplisit.

Jangan menentukan jenis bimbel hanya dengan menghitung durasi schedule.

---

# 10. Student Programs / Enrollment

`student_programs` merepresentasikan student yang mengikuti suatu program/paket.

```text
student_programs
------------------------------------------------
id                  uuid pk
student_id          uuid fk -> students.id
program_id          uuid fk -> programs.id
start_date          date
end_date            date nullable
total_sessions      int nullable
status              text
created_at          timestamptz
updated_at          timestamptz
```

`total_sessions` adalah target/paket yang diberikan kepada student sehingga boleh disimpan.

Contoh:

```text
total_sessions = 20
```

Jangan menyimpan derived field seperti:

```text
completed_sessions
remaining_sessions
```

Nilai tersebut dihitung dari transactional data.

---

# 11. Tutor–Student Assignment

Sistem tidak boleh mengasumsikan hubungan tutor dan student sebagai 1:1.

Sistem harus mendukung:

* Tutor mengajar banyak student.
* Student dapat diajar lebih dari satu tutor.
* Tutor dapat berganti.
* Tutor pengganti dapat menangani session.
* Student dapat mengikuti group session.
* Student dapat mengikuti private session.

Jika assignment perlu memiliki histori, gunakan entitas assignment tersendiri.

Contoh konseptual:

```text
tutor_student_assignments
------------------------------------------------
id
tutor_id
student_id
start_date
end_date
status
```

Assignment adalah hubungan bisnis; jangan menggunakannya sebagai histori tutor aktual pada suatu session.

Histori tutor yang benar-benar mengajar harus berada pada `sessions.tutor_id`.

---

# 12. Class Groups

Untuk mendukung kelas kelompok:

```text
class_groups
------------------------------------------------
id              uuid pk
name            text
program_id      uuid fk -> programs.id
capacity        int nullable
status          text
created_at      timestamptz
updated_at      timestamptz
```

Jangan menjadikan `tutor_id` pada `class_groups` sebagai satu-satunya sumber tutor.

Tutor dapat berubah dari waktu ke waktu.

Tutor aktual pada learning session disimpan pada:

```text
sessions.tutor_id
```

---

# 13. Class Group Members

```text
class_group_members
------------------------------------------------
id                  uuid pk
class_group_id      uuid fk -> class_groups.id
student_id          uuid fk -> students.id
joined_at           date
left_at             date nullable
created_at          timestamptz
```

Dengan struktur ini, histori keanggotaan student dalam group dapat dipertahankan.

---

# 14. Schedules

Schedule merepresentasikan **rencana/jadwal rutin**, bukan kejadian pembelajaran aktual.

```text
schedules
------------------------------------------------
id                  uuid pk
student_id          uuid nullable
class_group_id      uuid nullable
tutor_id             uuid fk -> tutors.id
program_id           uuid fk -> programs.id
bimbel_type_id       uuid fk -> bimbel_types.id
day_of_week          int
start_time           time
end_time             time
location             text nullable
status               text
created_at           timestamptz
updated_at           timestamptz
```

### Schedule target

Schedule dapat ditujukan kepada:

```text
student_id
```

untuk individual/private.

atau:

```text
class_group_id
```

untuk group.

Pada satu schedule, salah satu target harus terisi sesuai tipe schedule.

---

# 15. Sessions

Session merupakan **kejadian aktual** yang berasal dari schedule.

```text
sessions
------------------------------------------------
id                  uuid pk
schedule_id         uuid fk -> schedules.id
tutor_id             uuid fk -> tutors.id
session_date        date
start_time           time
end_time             time
status               text
notes                text nullable
created_at           timestamptz
updated_at           timestamptz
```

### Status

```text
scheduled
completed
cancelled
rescheduled
```

### Important

`session.tutor_id` menyimpan **tutor aktual yang menjalankan session**.

Jangan mengambil tutor historis dari `schedule.tutor_id` ketika menghitung payroll.

Contoh:

```text
Schedule
Tutor A
    ↓
Actual Session
Tutor B
    ↓
Payroll
Tutor B
```

Hal ini memungkinkan tutor pengganti tanpa merusak histori schedule.

---

# 16. Session vs Schedule

Model mental:

```text
SCHEDULE
"Setiap Rabu pukul 16.00"
       │
       ▼
SESSION
"Rabu, 9 September 2026 pukul 16.00"
       │
       ▼
ATTENDANCE
"Student X hadir"
```

Schedule adalah rencana.

Session adalah kejadian aktual.

Attendance adalah status student terhadap kejadian tersebut.

Ketiga konsep tidak boleh digabung menjadi satu tabel.

---

# 17. Attendance

Attendance menyimpan status student terhadap suatu session.

```text
attendance
------------------------------------------------
id                  uuid pk
session_id          uuid fk -> sessions.id
student_id          uuid fk -> students.id
status              text
photo_path          text nullable
notes               text nullable
checked_in_at       timestamptz nullable
checked_in_by       uuid fk -> profiles.id
created_at          timestamptz
updated_at          timestamptz
```

### Status minimum

```text
present
absent
permission
sick
```

Opsional:

```text
late
```

Satu student tidak boleh memiliki dua attendance record untuk session yang sama.

Gunakan unique constraint:

```text
UNIQUE(session_id, student_id)
```

---

# 18. Attendance Verification

MVP dapat menggunakan:

```text
submitted
```

sebagai status verifikasi.

Workflow yang dapat dikembangkan:

```text
Tutor
  ↓
submitted
  ↓
Management
  ├── verified
  └── correction_requested
```

Jika Management mengoreksi attendance, perubahan harus masuk ke audit log.

---

# 19. Permission & Rescheduling

Jika student mendapatkan status:

```text
permission
```

maka secara default:

* Tidak dianggap sebagai completed learning session.
* Tidak mengurangi jatah paket.
* Dapat dijadwalkan ulang.
* Histori kejadian awal tetap dipertahankan.

Jangan menghapus session lama ketika melakukan rescheduling.

Contoh:

```text
09 Sep
Session A
Permission
    ↓
Rescheduled
    ↓
12 Sep
Session B
Present
```

Histori harus tetap menunjukkan bahwa session awal terjadi/dijadwalkan tetapi student tidak mengikuti pembelajaran pada waktu tersebut.

Detail implementasi rescheduling dapat menggunakan relationship/reference tambahan apabila diperlukan.

---

# 20. Session Number

Nomor pertemuan student tidak boleh hanya berasal dari:

```text
COUNT(sessions)
```

atau:

```text
COUNT(attendance)
```

karena satu session dapat memiliki banyak student dan satu student dapat memiliki histori yang berbeda.

Konsep nomor pertemuan harus dihitung berdasarkan:

```text
student
+
student_program/enrollment
+
valid learning session
```

Contoh:

```text
Student A
Program Matematika

Session valid:
1
2
3
4
```

Jika terdapat:

```text
permission
rescheduled
cancelled
```

record tersebut tidak boleh otomatis dihitung sebagai completed learning session.

Nomor pertemuan dapat dihitung dari transactional records atau diturunkan saat query.

Jika `session_number` disimpan untuk kebutuhan snapshot/historical payroll, field tersebut harus diperlakukan sebagai historical snapshot dan tidak boleh diedit sembarangan.

Untuk MVP, prioritaskan perhitungan dari transactional data daripada menyimpan counter manual.

---

# 21. Learning Records

Learning record digunakan untuk menyimpan detail pembelajaran student pada suatu session.

```text
learning_records
------------------------------------------------
id                  uuid pk
attendance_id       uuid fk -> attendance.id
tutor_id             uuid fk -> tutors.id
material             text
notes                text nullable
created_at           timestamptz
updated_at           timestamptz
```

Contoh:

```text
Attendance:
present

Learning Record:
material = "Operasi pecahan"
notes = "Student masih perlu latihan penyebut berbeda"
```

Jangan menggunakan `attendance.notes` dan `learning_records.material` untuk menyimpan informasi yang sama.

Jika kebutuhan learning record sangat sederhana, `learning_records` dapat dihilangkan dan `material` cukup ditempatkan pada attendance.

Keputusan ini dapat disesuaikan berdasarkan kebutuhan MVP.

---

# 22. Tutor Rates

```text
tutor_rates
------------------------------------------------
id                  uuid pk
tutor_id             uuid fk -> tutors.id
bimbel_type_id       uuid fk -> bimbel_types.id
rate_per_student     numeric
effective_from       date
effective_until      date nullable
created_at           timestamptz
updated_at           timestamptz
```

Tarif tidak boleh hardcoded di application code.

Contoh:

```text
Tutor A
Reguler   → Rp20.000
Intensif  → Rp25.000
Private   → Rp35.000
```

Management dapat mengubah tarif melalui data configuration.

---

# 23. Historical Tutor Rates

Tarif yang telah digunakan pada histori payroll tidak boleh berubah secara retroaktif.

Jangan overwrite tarif historis.

Gunakan:

```text
effective_from
effective_until
```

Contoh:

```text
Rate A
2026-01-01 → 2026-09-30
Rp20.000

Rate B
2026-10-01 → NULL
Rp25.000
```

Payroll pada September menggunakan Rate A.

Payroll pada Oktober menggunakan Rate B.

---

# 24. Payroll Model

Payroll terdiri dari:

```text
tutor_payments
        │
        └── tutor_payment_items
```

## Tutor Payments

```text
tutor_payments
------------------------------------------------
id                  uuid pk
tutor_id             uuid fk -> tutors.id
period_start        date
period_end          date
gross_amount        numeric
bonus               numeric
deduction           numeric
net_amount          numeric
status              text
paid_at             timestamptz nullable
created_at          timestamptz
updated_at          timestamptz
```

Status:

```text
draft
processed
paid
```

---

# 25. Payroll Items

Detail payroll harus dapat ditelusuri sampai session dan student.

```text
tutor_payment_items
------------------------------------------------
id                  uuid pk
tutor_payment_id    uuid fk -> tutor_payments.id
session_id          uuid fk -> sessions.id
student_id          uuid fk -> students.id
bimbel_type_id      uuid fk -> bimbel_types.id
rate                numeric
quantity            numeric
amount              numeric
created_at          timestamptz
```

Contoh:

```text
Tutor: Abi Govin

Session:
09 September 2026
Intensif

Student:
Frisca   → Rp25.000
Nadiy    → Rp25.000
Zihan    → Rp25.000
Dero     → Rp25.000

Session total = Rp100.000
```

Dengan detail item, Management dapat menelusuri asal nilai payroll.

---

# 26. Tutor Fee Calculation

Konsep dasar:

```text
fee = applicable_rate × payable_student_count
```

Contoh:

```text
Rate = Rp25.000 / student
Payable students = 4

Fee = Rp25.000 × 4
    = Rp100.000
```

Namun sistem **tidak boleh mengasumsikan selamanya bahwa `present` = payable**.

Penentuan `payable_student_count` harus mengikuti payroll/business rules.

Contoh kemungkinan:

```text
present    → payable
late       → payable
absent     → not payable
permission → not payable
sick       → not payable
```

Aturan final harus mengikuti kebijakan Management.

---

# 27. Payroll Calculation Boundary

Payroll wajib dihitung di server.

Alur:

```text
Client
   ↓
Request payroll
   ↓
Authentication
   ↓
Authorization
   ↓
Fetch actual sessions
   ↓
Fetch attendance
   ↓
Determine payable students
   ↓
Fetch applicable historical rate
   ↓
Calculate payroll
   ↓
Create payment items
   ↓
Calculate gross
   ↓
Apply bonus/deduction
   ↓
Calculate net
   ↓
Persist transaction
```

Client tidak boleh menjadi source of truth untuk:

```text
gross_amount
bonus
deduction
net_amount
payment items
```

---

# 28. Payroll Historical Integrity

Setelah payroll diproses, detail yang digunakan untuk menghasilkan payroll harus dapat ditelusuri.

Payroll harus dapat menjawab:

```text
Tutor
  ↓
Payment
  ↓
Payment Items
  ↓
Session
  ↓
Student
  ↓
Attendance
  ↓
Rate
```

Jangan membuat payroll hanya sebagai:

```text
gross_amount = 5000000
```

tanpa detail yang dapat diaudit.

---

# 29. Audit Logs

```text
audit_logs
------------------------------------------------
id              uuid pk
user_id         uuid fk -> profiles.id
action          text
entity_type     text
entity_id       uuid
metadata        jsonb
created_at      timestamptz
```

`metadata` dapat menyimpan:

```json
{
  "before": {},
  "after": {}
}
```

Minimal audit perubahan pada:

* Attendance
* Tutor rates
* Payroll/payment status
* Session corrections
* Schedule changes yang memengaruhi histori
* Management corrections

Audit log harus dibuat di server/database layer, bukan hanya di browser.

---

# 30. Supabase Storage

Gunakan Supabase Storage untuk foto absensi.

Bucket:

```text
attendance
```

Recommended path:

```text
attendance/
  {year}/
    {month}/
      {session_id}/
        {student_id}.jpg
```

Contoh:

```text
attendance/2026/09/session-uuid/student-uuid.jpg
```

Database hanya menyimpan:

```text
photo_path
```

Tidak menyimpan binary image.

---

# 31. Browser Camera

Untuk pengambilan foto langsung dari browser:

```text
react-webcam
```

Flow:

```text
Attendance Form
       ↓
CameraCapture
       ↓
react-webcam
       ↓
Captured image
       ↓
Blob/File
       ↓
Server validation
       ↓
Supabase Storage
       ↓
photo_path
```

Camera component harus berupa Client Component karena menggunakan browser API.

---

# 32. Photo Validation

Foto harus divalidasi sebelum upload.

Minimal:

* MIME type
* File size
* Extension apabila diperlukan

Jangan mempercayai metadata file dari browser sebagai satu-satunya security validation.

Validasi final harus dilakukan di server.

---

# 33. Authentication Architecture

Better Auth menangani:

```text
Authentication
Session
Identity
Login
Logout
```

Supabase menangani:

```text
PostgreSQL
Storage
```

Mapping:

```text
Better Auth User
       │
       ▼
profiles.user_id
       │
       ▼
profiles.role
       │
       ▼
Server Authorization
       │
       ▼
Supabase Database
```

Jangan mengasumsikan:

```text
Better Auth user.id
==
Supabase auth.uid()
```

Mapping harus dirancang secara eksplisit.

---

# 34. Authorization Architecture

Security boundary utama:

```text
Request
   ↓
Better Auth session
   ↓
Load profile
   ↓
Check role/permission
   ↓
Validate input
   ↓
Execute business logic
   ↓
Database
```

UI visibility bukan authorization.

Contoh:

```text
Management melihat menu Payroll
Tutor tidak melihat menu Payroll
```

tidak berarti tutor tidak dapat mengakses endpoint payroll.

Endpoint tetap wajib melakukan authorization check.

### Granular Permissions vs Static `is_owner`

Untuk entitas sensitif seperti `attendance`, status kepemilikan dan hak akses tidak boleh hanya direpresentasikan sebagai boolean statis seperti `"is_owner": true/false`. Sebaliknya, model respons harus menyediakan object `permissions` yang dihitung secara dinamis di server:

**Response untuk Tutor Pemilik:**
```json
{
  "id": "att_123",
  "student": { ... },
  "tutor": { ... },
  "permissions": {
    "can_view": true,
    "can_edit": true,
    "can_delete": true,
    "can_verify": false
  }
}
```

**Response untuk Tutor Lain:**
```json
{
  "id": "att_123",
  "student": { ... },
  "tutor": { ... },
  "permissions": {
    "can_view": true,
    "can_edit": false,
    "can_delete": false,
    "can_verify": false
  }
}
```

**Response untuk Management:**
```json
{
  "id": "att_123",
  "student": { ... },
  "tutor": { ... },
  "permissions": {
    "can_view": true,
    "can_edit": true,
    "can_delete": true,
    "can_verify": true
  }
}
```

Pendekatan ini jauh lebih scalable daripada hanya `"is_owner": false` karena:
* Memungkinkan rule multi-dimensi seperti: `can_edit = false`, `can_delete = false`, `can_verify = true` (misalnya Management dapat memverifikasi absensi tetapi tutor tidak bisa memverifikasi dirinya sendiri).
* `is_owner` tidak disimpan di database fisik; nilainya selalu **computed** di runtime dari `attendance.checked_in_by` / `session.tutor_id` vs identitas pengguna yang sedang login.
* **Ownership wajib diverifikasi di backend**: UI menggunakan `permissions` hanya untuk render tombol aksi (edit/delete/verify). Setiap Server Action / Route Handler mutasi wajib memverifikasi ulang hak akses di server dan tidak boleh mempercayai status dari frontend.

---

# 35. RLS

Supabase RLS harus diperlakukan sebagai defense-in-depth dan bukan pengganti server authorization.

Jangan mengasumsikan Better Auth session otomatis tersedia di Supabase RLS.

Strategi identity mapping harus ditentukan secara eksplisit sebelum production deployment.

Untuk MVP, seluruh mutation sensitif tetap wajib melewati server-side authorization.

---

# 36. Derived Data

Jangan menyimpan counter yang dapat dihitung dari transaksi.

Contoh:

```text
JANGAN:
completed_sessions
remaining_sessions
total_attendance
```

Gunakan query:

```text
COUNT(...)
SUM(...)
GROUP BY ...
```

Contoh:

```text
total_sessions
-
completed_sessions_count
=
remaining_sessions
```

`total_sessions` tetap boleh disimpan karena merupakan data paket/enrollment.

---

# 37. Data Fetching

Prioritaskan Server Components untuk data fetching.

Contoh:

```text
Management Dashboard
        ↓
Server Component
        ↓
Database
        ↓
Render
```

Gunakan Client Component apabila membutuhkan:

* Form interaction
* Camera
* Modal
* Zustand
* Interactive table
* Browser API

Jangan membuat seluruh halaman:

```tsx
"use client";
```

tanpa alasan.

---

# 38. State Management

Zustand hanya untuk UI/client state.

### Contoh yang diperbolehkan

```text
sidebarOpen
selectedStudent
selectedSession
attendanceModal
cameraState
tableFilter
temporaryFormDraft
```

### Contoh yang tidak diperbolehkan sebagai source of truth

```text
students[]
tutors[]
sessions[]
attendance[]
payroll[]
```

Server data harus tetap berasal dari database/server layer atau cache resmi apabila data-fetching library ditambahkan.

---

# 39. Validation

Shared Zod schema harus digunakan oleh:

```text
React Hook Form
        +
Server Action / Route Handler
```

Contoh:

```text
features/
└── students/
    ├── schemas/
    │   └── student.schema.ts
    ├── actions/
    ├── components/
    └── ...
```

Jangan membuat validation rule client dan server secara terpisah jika domain rule-nya sama.

---

# 40. Folder Structure & Thin App Pages Architecture

Gunakan arsitektur feature-oriented langsung di root project:

```text
├── app/
│   ├── (public)/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── (private)/
│   │   ├── (management)/
│   │   │   ├── management/
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── students/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [studentId]/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── edit/page.tsx
│   │   │   │   ├── tutors/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [tutorId]/page.tsx
│   │   │   │   ├── schedules/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [scheduleId]/page.tsx
│   │   │   │   ├── sessions/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [sessionId]/page.tsx
│   │   │   │   ├── attendance/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [attendanceId]/page.tsx
│   │   │   │   ├── payroll/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [payrollId]/page.tsx
│   │   │   │   ├── reports/
│   │   │   │   │   ├── attendance/page.tsx
│   │   │   │   │   ├── students/page.tsx
│   │   │   │   │   ├── tutors/page.tsx
│   │   │   │   │   └── payroll/page.tsx
│   │   │   │   └── settings/
│   │   │   │       ├── programs/page.tsx
│   │   │   │       ├── bimbel-types/page.tsx
│   │   │   │       └── tutor-rates/page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   └── (tutor)/
│   │       ├── tutor/
│   │       │   ├── dashboard/page.tsx
│   │       │   ├── students/
│   │       │   │   ├── page.tsx
│   │       │   │   └── [studentId]/page.tsx
│   │       │   ├── schedules/page.tsx
│   │       │   ├── sessions/[sessionId]/page.tsx
│   │       │   ├── attendance/
│   │       │   │   ├── page.tsx
│   │       │   │   └── [attendanceId]/page.tsx
│   │       │   └── payroll/page.tsx
│   │       └── layout.tsx
│   │
│   └── api/
│       └── v1/
│           ├── auth/
│           │   └── session/route.ts
│           │
│           ├── management/                      # Endpoint Khusus Management
│           │   ├── students/
│           │   │   ├── route.ts
│           │   │   └── [studentId]/
│           │   │       ├── route.ts
│           │   │       ├── history/route.ts
│           │   │       ├── enrollments/route.ts
│           │   │       └── schedules/route.ts
│           │   ├── tutors/
│           │   │   ├── route.ts
│           │   │   └── [tutorId]/
│           │   │       ├── route.ts
│           │   │       ├── students/route.ts
│           │   │       ├── schedules/route.ts
│           │   │       └── payroll/route.ts
│           │   ├── programs/route.ts
│           │   ├── bimbel-types/route.ts
│           │   ├── enrollments/
│           │   │   ├── route.ts
│           │   │   └── [enrollmentId]/route.ts
│           │   ├── schedules/
│           │   │   ├── route.ts
│           │   │   └── [scheduleId]/
│           │   │       ├── route.ts
│           │   │       └── sessions/route.ts
│           │   ├── sessions/
│           │   │   ├── route.ts
│           │   │   └── [sessionId]/
│           │   │       ├── route.ts
│           │   │       ├── students/route.ts
│           │   │       └── attendance/route.ts
│           │   ├── attendance/
│           │   │   ├── route.ts
│           │   │   └── [attendanceId]/route.ts
│           │   ├── tutor-rates/
│           │   │   ├── route.ts
│           │   │   └── [rateId]/route.ts
│           │   ├── payroll/
│           │   │   ├── route.ts
│           │   │   ├── generate/route.ts
│           │   │   └── [payrollId]/
│           │   │       ├── route.ts
│           │   │       ├── finalize/route.ts
│           │   │       └── pay/route.ts
│           │   ├── reports/
│           │   │   ├── students/route.ts
│           │   │   ├── attendance/route.ts
│           │   │   └── payroll/route.ts
│           │   └── audit-logs/route.ts
│           │
│           └── tutor/                           # Endpoint Khusus Tutor Mandiri
│               ├── dashboard/route.ts
│               ├── students/
│               │   ├── route.ts
│               │   └── [studentId]/route.ts
│               ├── schedules/route.ts
│               ├── sessions/[sessionId]/route.ts
│               ├── attendance/
│               │   ├── route.ts
│               │   └── [attendanceId]/route.ts
│               └── payroll/route.ts
│
├── features/
│   ├── auth/
│   │   └── components/LoginPage.tsx
│   │
│   ├── management/                              # Domain Logic & UI Management
│   │   ├── dashboard/ (components/)
│   │   ├── students/ (components/, actions/, queries/, schemas/, hooks/, types.ts)
│   │   ├── tutors/ (components/, actions/, queries/, schemas/, types.ts)
│   │   ├── schedules/ (components/, actions/, queries/, schemas/, types.ts)
│   │   ├── sessions/ (components/, actions/, queries/, types.ts)
│   │   ├── attendance/ (components/, queries/, types.ts)
│   │   ├── payroll/ (components/, actions/, queries/, types.ts)
│   │   ├── reports/ (components/, queries/, services/)
│   │   └── settings/ (components/)
│   │
│   ├── tutor/                                   # Domain Logic & UI Tutor
│   │   ├── dashboard/ (components/)
│   │   ├── students/ (components/, queries/, types.ts)
│   │   ├── schedules/ (components/, queries/, types.ts)
│   │   ├── sessions/ (components/, queries/, types.ts)
│   │   ├── attendance/ (components/, queries/, types.ts)
│   │   └── payroll/ (components/, queries/, types.ts)
│   │
│   └── shared/                                  # Domain Services & Shared Schemas
│       ├── attendance/ (services/, schemas/, types.ts)
│       ├── payroll/ (services/, types.ts)
│       └── common/ (types.ts)
│
├── components/
│   ├── ui/                                      # Atomic base UI primitives
│   ├── shared/                                  # Shared common widgets (DataTable, Camera, StatusBadge, PageHeader)
│   ├── management/                              # Management Layout & Navigation (ManagementSidebar, ManagementHeader)
│   └── tutor/                                   # Tutor Layout & Navigation (TutorSidebar, TutorHeader)
│
├── lib/
│   ├── auth/
│   ├── supabase/
│   ├── storage/
│   ├── permissions/
│   └── utils/
│
├── stores/
│   ├── attendance-store.ts
│   ├── schedule-store.ts
│   └── ui-store.ts
│
├── types/
│   ├── database.ts
│   ├── auth.ts
│   └── common.ts
│
├── config/
│   ├── navigation.ts
│   ├── permissions.ts
│   └── app.ts
│
├── middleware.ts
│
supabase/
├── migrations/
├── seed.sql
└── config.toml

docs/
├── PRD.md
├── DESIGN.md
└── BUSINESS_RULES.md
```

### Pola Thin App Pages
Seluruh file `page.tsx` di dalam `app/` berfungsi murni sebagai route entrypoint & metadata provider tipis yang mendelegasikan view ke feature components:

```tsx
import StudentListPage from "@/features/students/components/StudentListPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Murid | Bimbel Management",
};

export default function Page() {
  return <StudentListPage />;
}
```

### Middleware & Route Authorization Guard
File `middleware.ts` memisahkan secara eksplisit:
1. **Rute Publik**: `/login`, `/register`, `/`, `/api/v1/auth/*`
2. **Rute Privat**:
   - `/management/*`: khusus role `management`
   - `/tutor/*`: khusus role `tutor`
   - `/api/v1/*` (kecuali auth): wajib sesi valid & permission check

Jika user tidak terautentikasi mengakses private route, middleware mengarahkan ke `/login?callbackUrl=...`. Jika user role tutor mengakses `/management/*`, akan di-redirect ke `/tutor/dashboard`. Sebaliknya jika management mengakses `/tutor/*`, akan di-redirect ke `/management/dashboard`.

---

# 41. Server Action / Domain Flow

Mutation standar:

```text
Client
  ↓
Server Action
  ↓
Authentication
  ↓
Authorization
  ↓
Zod validation
  ↓
Business rule validation
  ↓
Database transaction
  ↓
Audit log
  ↓
Return result
```

Jangan melakukan mutation sensitif langsung dari Client Component.

---

# 42. Database Migration

Semua perubahan database harus menggunakan Supabase migration.

Contoh:

```text
supabase/
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_add_attendance.sql
    ├── 003_add_payroll.sql
    └── ...
```

Jangan mengandalkan perubahan manual di Supabase Dashboard.

Database harus dapat direproduksi dari migration.

---

# 43. Wireframe Reference

## Management Dashboard

Menampilkan:

```text
┌────────────────────────────────────────────┐
│ Active Students │ Tutors │ Today's Sessions│
└────────────────────────────────────────────┘

Today's Sessions
─────────────────────────────────────────────
Time | Tutor | Student/Group | Status
─────────────────────────────────────────────

Attendance / Payroll Summary
```

Management dapat mengakses:

* Student management
* Tutor management
* Schedule
* Sessions
* Attendance
* Tutor rates
* Payroll
* Reports

---

## Tutor Dashboard

Menampilkan:

```text
Today's Sessions
────────────────────────────────────
16:00–17:00
Student/Group
[ Mulai Absensi ]

17:15–18:15
Student/Group
[ Mulai Absensi ]
```

Flow:

```text
Mulai Absensi
      ↓
Checklist student
      ↓
Attendance status
      ↓
Take photo
      ↓
Isi catatan
      ↓
Submit
```

---

# 44. Student Search

Search dapat menggunakan:

```text
student_code
name
parent_phone
```

Endpoint/search action wajib melalui authorization check.

Hasil dapat menampilkan:

```text
Student
Student Code
Program
Current/Recent Tutor
Progress
Upcoming Schedule
Recent Sessions
```

Search berdasarkan nama tidak boleh dianggap sebagai unique identification.

---

# 45. Important Domain Relationships

Model utama:

```text
Student
   │
   ├── Student Program / Enrollment
   │
   ├── Tutor Assignment
   │
   ├── Class Group Membership
   │
   └── Attendance
            │
            ▼
          Session
            │
            ├── Schedule
            ├── Actual Tutor
            └── Learning Record
```

Payroll:

```text
Session
   │
   ├── Actual Tutor
   ├── Attendance
   │      └── Student
   │
   ▼
Tutor Payment Item
   │
   ▼
Tutor Payment
```

---

# 46. Core Business Flow

```text
Student Enrollment
        ↓
Tutor / Group Assignment
        ↓
Schedule
        ↓
Session Generated
        ↓
Tutor Executes Session
        ↓
Attendance
        ↓
Learning Record
        ↓
Determine Payable Students
        ↓
Apply Historical Tutor Rate
        ↓
Payroll Item
        ↓
Tutor Payment
```

---

# 47. Important Business Rules

## Bimbel

```text
Reguler   = 60 menit
Intensif  = 75 menit
Private   = 90 menit
```

## Permission

```text
Permission
    ↓
Tidak dianggap completed learning session
    ↓
Tidak mengurangi jatah paket
    ↓
Dapat dijadwalkan ulang
```

## Tutor Fee

```text
Fee = applicable rate × payable students
```

Tarif berasal dari database.

## Historical Rate

Tarif lama tidak boleh berubah secara retroaktif.

## Tutor

Tutor pada actual session adalah:

```text
sessions.tutor_id
```

bukan semata-mata:

```text
schedules.tutor_id
```

## Attendance

Attendance hanya berlaku terhadap:

```text
session
```

bukan langsung terhadap:

```text
schedule
```

---

# 48. Unresolved Business Rules

Agent **tidak boleh menebak** beberapa keputusan berikut apabila belum ditentukan Management:

1. Apakah student dengan `late` selalu dibayar penuh?
2. Apakah `sick` diperlakukan sama dengan `permission`?
3. Apakah tutor mendapat fee ketika student `absent`?
4. Apakah group session dan private session memiliki formula fee berbeda?
5. Apakah satu tutor dapat memiliki rate berbeda untuk student/program tertentu?
6. Apakah rescheduled session menggunakan rate berdasarkan tanggal session awal atau tanggal session pengganti?
7. Apakah nomor pertemuan mengikuti enrollment atau program secara global?
8. Apakah payroll item dikunci setelah payroll berstatus `processed`?
9. Apakah Management dapat mengubah attendance setelah payroll diproses?
10. Apakah satu schedule dapat memiliki lebih dari satu tutor dalam kondisi tertentu?

Jika keputusan tersebut diperlukan untuk implementasi dan belum ditentukan, agent harus meminta klarifikasi sebelum membuat asumsi permanen.

---

# 49. Design Priority

Prioritas desain:

```text
Data Integrity
      >
Security
      >
Business Rule Correctness
      >
Historical Accuracy
      >
Maintainability
      >
Performance
      >
UI Polish
```

Jangan mengorbankan histori, payroll accuracy, atau authorization hanya demi implementasi yang lebih cepat.

---

# 50. Final Architecture Principle

Sistem harus mempertahankan pemisahan:

```text
PLAN
Schedule
   ↓
ACTUAL EVENT
Session
   ↓
STUDENT RESULT
Attendance
   ↓
LEARNING
Learning Record
   ↓
FINANCIAL TRANSACTION
Payroll Item
   ↓
PAYMENT
Tutor Payment
```

Dengan pemisahan tersebut, perubahan jadwal, pergantian tutor, izin, reschedule, attendance correction, dan perubahan tarif dapat dilakukan tanpa merusak histori transaksi.

PostgreSQL menjadi source of truth untuk business data.

Better Auth menjadi source of truth untuk authentication/session.

Supabase Storage menjadi source of truth untuk file foto.

Server menjadi security dan business-rule boundary.

---

# 51. Kesimpulan Desain: Hierarki Model & 8 Prinsip Terpenting

Model hierarki relasi domain yang paling sehat dan scalable:

```text
                USER
                 │
        ┌────────┴────────┐
        │                 │
   MANAGEMENT           TUTOR
                          │
                          │
                    ┌─────┴─────┐
                    │           │
                 STUDENT      TUTOR
                    │
                    │
                 PROGRAM
                    │
                ENROLLMENT
                    │
                 SCHEDULE
                    │
                 SESSION
                    │
                ATTENDANCE
                 /   │   \
              FOTO MATERI STATUS
```

### 8 Prinsip Terpenting:

1. **Tutor – Murid adalah Many-to-Many**: Satu tutor mengajar banyak murid, satu murid dapat diajar banyak tutor, dan pergantian tutor/tutor pengganti didukung tanpa merusak relasi.
2. **Program/Enrollment sebagai Bagian Relasi**: Konteks pengajaran, mata pelajaran/tingkat, dan kuota paket sesi terikat pada enrollment murid (`student_programs`), bukan berdiri tanpa konteks.
3. **Pemisahan Tegas Schedule – Session – Attendance**:
   - `Schedule` = rencana jadwal rutin (kapan seharusnya).
   - `Session` = kejadian pembelajaran aktual pada tanggal tertentu dan tutor aktual yang mengajar.
   - `Attendance` = status individual murid pada sesi tersebut.
4. **`is_owner` Tidak Disimpan di Database**: Jangan simpan status `is_owner` di kolom fisik database. Hak kepemilikan dihitung secara dinamis (*computed*) dari `attendance.checked_in_by` atau `session.tutor_id` vs identitas pengguna yang sedang login, lalu dikembalikan sebagai granular `permissions` (`can_view`, `can_edit`, `can_delete`, `can_verify`).
5. **Ownership Wajib Diverifikasi di Backend**: UI hanya menyembunyikan/menampilkan tombol; setiap mutasi di Server Action / API wajib melakukan verifikasi otorisasi di server.
6. **Audit Fields (`created_by` & `updated_by`) Tetap Ada**: Seluruh tabel transaksional wajib mencatat siapa yang membuat dan mengupdate data untuk kebutuhan audit trail.
7. **"Pertemuan ke-X" Dihitung Dinamis dari Histori Valid**: Nomor pertemuan tidak boleh menggunakan counter manual atau sekadar urutan jadwal yang telah lewat. Nomor pertemuan harus diturunkan dari riwayat enrollment dan kehadiran yang valid (`present` / status terhitung lainnya), sehingga sesi izin/rescheduled tidak mengacaukan penomoran.
8. **Riwayat Materi Dapat Dilihat Multidimensi**: Catatan materi pembelajaran harus dapat di-query baik sebagai riwayat keseluruhan kelas/murid (lintas tutor) maupun riwayat spesifik tutor tertentu.

---

# 52. Tahapan Lanjutan: Kunci Fondasi Database Sebelum Next.js

Sebelum memulai penulisan kode UI dan fitur Next.js, tahapan wajib berikutnya adalah **mengunci spesifikasi database PostgreSQL** melalui migrasi SQL Supabase:

1. **ERD PostgreSQL**: Memetakan seluruh entitas, kardinalitas, dan relasi secara presisi.
2. **Enums & Domain Constraints**: Menetapkan enum untuk role, attendance status, session status, payroll status, bimbel type, dll.
3. **Foreign Keys & Referential Integrity**: Menentukan aksi `ON DELETE RESTRICT` / `CASCADE` yang tepat agar data historis (absensi, honor) tidak dapat terhapus secara tidak sengaja.
4. **Unique Constraints & Business Keys**: Menjaga integritas bisnis seperti `UNIQUE(student_code)`, `UNIQUE(session_id, student_id)`, dll.
5. **Indexing**: Membuat indeks pada kolom pencarian dan filtering kritis (`student_code`, `session_date`, `tutor_id`, `status`).
6. **RLS & Server Authorization Policy**: Mendefinisikan baseline security level database serta audit logging triggers.

Mengunci fondasi ini di awal mencegah terjadinya migrasi database besar atau perombakan skema destruktif di tengah-tengah development aplikasi Next.js.

