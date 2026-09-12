# AGENTS.md — Engineering Rules for Bimbel Attendance System

Dokumen ini merupakan aturan engineering utama untuk seluruh kode, database, dan arsitektur yang dihasilkan atau dimodifikasi oleh AI agent di proyek ini.

Semua aturan di dalam dokumen ini bersifat **mandatory**.

Jika instruksi user bertentangan dengan aturan di dokumen ini, **jangan langsung menyimpang**. Jelaskan konflik tersebut dan minta konfirmasi user sebelum menerapkan perubahan yang melanggar aturan.

---

# 1. Project Context

Project ini adalah sistem manajemen bimbingan belajar (bimbel) yang menangani:

* Management
* Tutor
* Student
* Tutor–student assignment
* Class/group
* Bimbel type
* Schedule
* Learning session
* Attendance
* Rescheduling
* Learning records
* Tutor rates
* Tutor payroll/payment
* Reports
* Attendance photos
* Audit logs

Sistem harus dirancang dengan mempertimbangkan bahwa business process bimbel dapat berkembang.

Jangan membuat implementasi yang terlalu spesifik terhadap kondisi saat ini apabila hal tersebut dapat menghambat perubahan business rules di masa depan.

---

# 2. Mandatory Tech Stack

Stack berikut wajib digunakan dan tidak boleh diganti tanpa persetujuan user.

## Framework

* Next.js
* App Router
* TypeScript

Prioritaskan:

* Server Components untuk data fetching
* Server Actions untuk mutation yang sesuai
* Route Handlers untuk API/integration endpoint yang memang membutuhkan HTTP endpoint

Jangan menggunakan Pages Router untuk feature baru.

---

## Database

* Supabase PostgreSQL

Database merupakan source of truth untuk seluruh data bisnis.

Jangan menggunakan:

* SQLite
* MongoDB
* Firebase Database
* database lokal sebagai production data source

---

## Storage

* Supabase Storage

Digunakan terutama untuk foto absensi.

Binary image tidak boleh disimpan langsung di PostgreSQL.

Database hanya menyimpan:

* `photo_path`
* atau URL/reference yang sesuai

---

## Authentication

Gunakan:

* Better Auth

**Jangan menggunakan Supabase Auth secara bersamaan untuk login/identity yang sama.**

Better Auth bertanggung jawab atas:

* Authentication
* Session
* Identity
* Login
* Logout
* Credential/account management

Supabase bertanggung jawab atas:

* PostgreSQL
* Storage

Jangan mengimplementasikan dua sistem authentication untuk user yang sama.

---

## UI

* shadcn/ui
* Tailwind CSS
* Lucide React untuk icon apabila diperlukan

Jangan memperkenalkan UI framework lain tanpa alasan teknis yang kuat dan persetujuan user.

---

## Forms & Validation

Gunakan:

* React Hook Form
* Zod
* `@hookform/resolvers`

Client dan server harus menggunakan **shared Zod schema** yang sama apabila memvalidasi domain input yang sama.

Jangan membuat validation rules client dan server yang berbeda.

---

## Client State

Gunakan:

* Zustand

Zustand hanya digunakan untuk state client/UI.

Contoh:

* Sidebar state
* Modal state
* Selected item
* Filter state
* Camera state
* Form draft
* Temporary UI state

Zustand bukan database dan bukan source of truth untuk data server.

---

## Tables

Gunakan:

* TanStack Table

Untuk data kompleks seperti:

* Students
* Tutors
* Schedules
* Attendance
* Sessions
* Payroll
* Reports

---

# 3. Authentication & Authorization

## Authentication Boundary

Better Auth adalah satu-satunya authentication provider.

Jangan:

* Membuat login kedua menggunakan Supabase Auth
* Menyimpan session authentication sendiri tanpa alasan
* Menganggap Supabase RLS otomatis mengenali session Better Auth

Identitas Better Auth harus memiliki mapping yang eksplisit dan aman apabila digunakan dalam authorization/RLS.

---

## Roles

MVP hanya memiliki dua role:

```text
management
tutor
```

Namun desain authorization harus memungkinkan role tambahan di masa depan, misalnya:

```text
parent
admin
finance
```

Jangan menyebarkan pengecekan role secara hardcoded ke seluruh aplikasi.

Hindari pola seperti:

```ts
if (user.role === "management") {
  ...
}
```

di puluhan file berbeda apabila dapat dibuat melalui authorization helper terpusat.

Gunakan abstraction seperti:

```text
requireAuth()
requireRole()
requirePermission()
```

sesuai kebutuhan.

---

## Server-side Authorization

Setiap Server Action atau Route Handler yang menyentuh data sensitif **WAJIB melakukan authorization check di server**.

Minimal berlaku untuk:

* students
* tutors
* attendance
* schedules
* sessions
* tutor_rates
* tutor_payments
* payroll
* audit_logs

UI hiding bukan authorization.

Middleware juga bukan satu-satunya security boundary.

Pola yang benar:

```text
Request
  ↓
Authentication check
  ↓
Authorization / role check
  ↓
Input validation
  ↓
Business rule validation
  ↓
Database mutation
  ↓
Audit log
```

Jangan:

```text
Request
  ↓
Database mutation
```

---

# 4. Data Integrity

Database adalah source of truth.

Jangan menyimpan data turunan yang dapat dihitung dari transactional data kecuali terdapat alasan performa yang jelas dan mekanisme sinkronisasi yang benar.

Contoh data yang **tidak boleh disimpan sebagai field editable biasa**:

```text
total_meetings
completed_sessions
total_attendance
remaining_meetings
```

Data tersebut harus dihitung dari data aktual menggunakan query/aggregate.

Contoh:

```text
sessions
+
attendance
↓
COUNT / aggregate
↓
computed result
```

---

# 5. Business Rules — Bimbel Type

Sistem memiliki jenis bimbel:

```text
Reguler
Intensif
Private
```

Durasi default:

```text
Reguler   = 60 menit
Intensif  = 75 menit
Private   = 90 menit
```

Namun durasi harus dimodelkan sebagai data/configuration, bukan hardcoded di banyak tempat.

Contoh konsep:

```text
bimbel_types
├── id
├── name
├── duration_minutes
└── ...
```

Jangan menentukan jenis bimbel dengan menebak berdasarkan durasi schedule.

Jenis bimbel harus menjadi data eksplisit.

---

# 6. Business Rules — Schedule vs Session

Pisahkan dengan tegas:

## Schedule

Representasi jadwal/rencana belajar.

Contoh:

```text
Alghazy
Rabu
16:00
Reguler
Tutor: Abi Hanif
```

Schedule bukan bukti bahwa pembelajaran benar-benar terjadi.

---

## Session

Representasi kejadian pembelajaran aktual pada tanggal tertentu.

Contoh:

```text
9 September 2026
16:00–17:00
Tutor: Abi Hanif
Student: Alghazy
```

Session adalah dasar untuk:

* Attendance
* Learning record
* Session number
* Tutor fee

---

## Attendance

Attendance merupakan status kehadiran student terhadap suatu session.

Relasi konseptual:

```text
Schedule
   ↓
Session
   ↓
Attendance
```

Jangan memasukkan seluruh konsep tersebut ke satu tabel.

---

# 7. Tutor–Student Relationship

Jangan mengasumsikan:

```text
Tutor → 1 Student
```

atau:

```text
Student → 1 Tutor
```

secara permanen.

Sistem harus mendukung:

* Satu tutor mengajar banyak student
* Satu student memiliki lebih dari satu tutor
* Pergantian tutor
* Group/class
* Private session

Apabila group learning digunakan, model dapat menggunakan:

```text
class_groups
class_group_members
```

Jangan memaksa seluruh domain menjadi 1:1 hanya karena terdapat jadwal private.

---

# 8. Student Identifier

Gunakan:

```text
student_code
```

sebagai business identifier.

Jangan menggunakan:

```text
student.name
```

sebagai unique identifier.

Nama student dapat sama dan dapat berubah.

Gunakan primary key internal seperti UUID untuk relational integrity, sedangkan `student_code` digunakan sebagai identifier bisnis yang dapat ditampilkan kepada user.

---

# 9. Attendance Workflow

Status minimum:

```text
present
absent
permission
sick
```

Status berikut dapat ditambahkan apabila dibutuhkan:

```text
late
```

Attendance hanya boleh dibuat terhadap:

```text
session
```

Bukan langsung terhadap:

```text
schedule
```

---

# 10. Permission & Rescheduling

Jika student:

```text
permission
```

atau izin, maka secara default:

* Session tidak dianggap sebagai completed learning session untuk student tersebut.
* Jatah pertemuan tidak otomatis berkurang.
* Student dapat dijadwalkan ulang.

Jangan menganggap:

```text
scheduled = completed
```

dan jangan mengurangi paket hanya karena tanggal schedule telah lewat.

Business rule rescheduling harus mempertahankan histori.

Jangan menghapus histori session hanya karena terjadi reschedule.

Jika session dibatalkan/rescheduled, gunakan status atau relationship yang dapat menjelaskan histori tersebut.

---

# 11. Session Number

`session_number` / nomor pertemuan harus merepresentasikan pertemuan pembelajaran yang valid, bukan sekadar jumlah schedule yang telah lewat.

Contoh:

```text
Session #1 → present
Session #2 → present
Session #3 → permission
Session #3 → rescheduled
Session #3 → present
```

Jangan menghasilkan:

```text
#1
#2
#3
#4
```

hanya karena terdapat empat record schedule/session jika salah satunya merupakan izin yang tidak menjadi pertemuan efektif.

Definisi final mengenai numbering harus mengikuti enrollment/package model yang digunakan.

---

# 12. Tutor Fee / Payroll

Fee tutor dihitung berdasarkan jumlah student yang menjadi dasar pembayaran pada session tersebut.

Konsep dasarnya:

```text
fee = rate × payable_students
```

Contoh:

```text
Rate = Rp25.000 / student

Payable students = 4

Fee = Rp25.000 × 4
    = Rp100.000
```

Jika hanya satu student:

```text
Fee = rate × 1
```

---

# 13. Fee Must Be Configurable

Jangan hardcode tarif:

```ts
const tutorFee = 25000;
```

atau:

```ts
const REGULAR_RATE = 20000;
```

Tarif harus berasal dari database.

Management harus dapat mengatur tarif sesuai business policy.

Contoh model:

```text
tutor_rates
├── tutor_id
├── bimbel_type_id
├── rate
├── effective_from
└── effective_until
```

Formula payroll juga harus memungkinkan perubahan business rule di masa depan.

Jangan membuat asumsi bahwa seluruh jenis bimbel selalu memiliki formula fee yang sama jika Management belum menetapkannya.

---

# 14. Historical Rate Integrity

Tarif yang telah digunakan untuk payroll historis tidak boleh berubah secara retroaktif.

Jangan melakukan:

```text
UPDATE tutor_rates
SET rate = new_rate
```

terhadap record tarif historis yang sudah digunakan.

Gunakan versioning/effective dating:

```text
effective_from
effective_until
```

Contoh:

```text
Rp20.000
effective_from = 2026-01-01
effective_until = 2026-09-30

Rp25.000
effective_from = 2026-10-01
effective_until = NULL
```

Dengan demikian payroll September tetap menggunakan tarif September meskipun Management mengubah tarif pada Oktober.

---

# 15. Payroll Calculation

Perhitungan payroll/honor **WAJIB dilakukan di server**.

Client tidak boleh menjadi source of truth untuk:

```text
fee
subtotal
total payroll
payable amount
```

Client hanya boleh menampilkan hasil.

Alur:

```text
Client
  ↓
Request
  ↓
Server authorization
  ↓
Fetch rate
  ↓
Fetch valid sessions
  ↓
Determine payable students
  ↓
Calculate fee
  ↓
Persist/return result
```

Jangan percaya nilai fee yang dikirim dari browser.

---

# 16. Audit Logs

Perubahan terhadap data sensitif wajib dicatat ke:

```text
audit_logs
```

Minimal mencatat:

```text
who
what
when
before
after
```

Data yang wajib diaudit minimal:

* Attendance changes
* Tutor rate changes
* Tutor payment/payroll status changes
* Sensitive schedule/session changes apabila memengaruhi payroll
* Management corrections

Audit log harus dapat menjawab:

> Siapa yang mengubah data?

> Apa yang berubah?

> Kapan perubahan terjadi?

> Nilai sebelum perubahan apa?

> Nilai setelah perubahan apa?

Jangan membuat audit log hanya di client.

---

# 17. Attendance Photo Storage

Foto absensi disimpan di:

```text
Supabase Storage
```

Database hanya menyimpan:

```text
photo_path
```

atau reference yang sesuai.

Recommended path:

```text
attendance/{year}/{month}/{session_id}/{student_id}.jpg
```

Contoh:

```text
attendance/2026/09/session-uuid/student-uuid.jpg
```

---

## Photo Validation

File harus divalidasi di server sebelum diterima.

Minimal validasi:

* MIME type
* File size
* Extension jika diperlukan
* File content apabila diperlukan

Jangan mempercayai:

```text
file.name
file.type
```

dari browser sebagai satu-satunya security validation.

---

# 18. Browser Camera

Untuk pengambilan foto langsung dari browser, gunakan:

```text
react-webcam
```

Camera UI harus menjadi Client Component.

Contoh architecture:

```text
Attendance Form
      ↓
CameraCapture
      ↓
react-webcam
      ↓
Image Blob/File
      ↓
Server validation
      ↓
Supabase Storage
```

Jangan menyimpan binary image di Zustand sebagai persistent application state.

Temporary camera state diperbolehkan di client.

---

# 19. Validation Architecture

Gunakan shared schemas:

```text
src/
└── features/
    ├── students/
    ├── tutors/
    ├── attendance/
    ├── schedules/
    └── payroll/
```

Schema dapat ditempatkan pada:

```text
features/{feature}/schemas/
```

atau shared validation directory apabila digunakan lintas feature.

Contoh:

```text
attendance.schema.ts
```

Schema tersebut digunakan untuk:

```text
React Hook Form
       +
Server Action
```

Jangan menduplikasi rules:

```text
client schema
server schema
```

dengan definisi berbeda.

---

# 20. State Management Rules

Zustand hanya untuk client/UI state.

### Boleh

```text
sidebarOpen
selectedStudent
attendanceModalOpen
cameraState
tableFilter
temporaryFormDraft
```

### Jangan

```text
students[]
tutors[]
sessions[]
attendance[]
payroll[]
```

sebagai permanent source of truth.

Server data harus berasal dari:

* Server Components
* Server Actions
* Route Handlers
* fetch
* atau cache/data-fetching library jika ditambahkan di masa depan

---

# 21. Server Components First

Default architecture:

```text
Server Component
```

Gunakan Client Component hanya apabila membutuhkan:

* User interaction
* React state
* Browser API
* Camera
* Form interaction
* Zustand
* TanStack Table interaction
* Other client-only APIs

Jangan menjadikan seluruh dashboard sebagai:

```tsx
"use client";
```

tanpa alasan.

---

# 22. Database Migration

Setiap perubahan schema wajib menggunakan migration SQL eksplisit.

Gunakan Supabase migrations.

Jangan mengandalkan perubahan manual di Supabase Dashboard.

Contoh:

```text
supabase/
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_add_attendance.sql
    └── 003_add_payroll.sql
```

Database schema harus dapat direproduksi dari migration.

---

# 23. Database Design Principles

Gunakan:

* Foreign keys
* Unique constraints
* Check constraints
* Not-null constraints
* Indexes pada kolom yang sering digunakan untuk lookup/filter
* Transactional operations apabila mutation menyentuh beberapa tabel

Jangan mengandalkan validation di frontend untuk menjaga database integrity.

Database harus memiliki constraint untuk invariant penting.

---

# 24. Role-Oriented & Feature-Driven Folder Structure & Thin App Pages

Gunakan struktur folder yang **menghighlight peran (role-based separation)** langsung di root project sehingga rute, API, komponen, dan modul fitur terpisah secara eksplisit antara **management** dan **tutor**:

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

### Thin App Pages Rule
File `page.tsx` di dalam `app/` **HANYA** bertindak sebagai thin route wrapper yang mendefinisikan metadata dan merender page component dari feature module (`@/features/...`).

Contoh baku:
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

Jangan menuliskan UI layout kompleks, state form panjang, atau fetching langsung di `page.tsx` jika fitur tersebut memiliki modul di `features/{feature}/components/`.

---

# 24.1. Middleware & Route Protection

`middleware.ts` diletakkan di root project dan mengelompokkan rute ke dalam:
* **Public Routes**: `/login`, `/register`, `/`, `/api/v1/auth/*`
* **Private Routes**: `/management/*`, `/tutor/*`, `/api/v1/*` (kecuali auth)

Role-based routing:
* Pengguna role `tutor` yang mencoba mengakses `/management/*` akan diarahkan ke `/tutor/dashboard`.
* Pengguna role `management` yang mencoba mengakses `/tutor/*` akan diarahkan ke `/management/dashboard`.
* Pengguna yang belum login yang mengakses rute privat akan di-redirect ke `/login?callbackUrl=...`.

---

# 25. Business Logic Boundary

Business logic jangan ditempatkan hanya di UI component.

Hindari:

```text
AttendanceForm.tsx
    ↓
calculate payroll
    ↓
update database
```

Gunakan pemisahan:

```text
UI
 ↓
Server Action / Route Handler
 ↓
Validation
 ↓
Authorization
 ↓
Domain/business logic
 ↓
Database
```

UI bertanggung jawab terhadap presentation dan interaction.

Server/domain layer bertanggung jawab terhadap business rules.

---

# 26. CRUD Implementation

Untuk setiap CRUD feature, pertimbangkan:

```text
Create
Read
Update
Delete
Authorization
Validation
Audit
Error handling
```

Untuk data historis seperti:

* Attendance
* Payroll
* Tutor rates
* Sessions

jangan sembarangan menggunakan hard delete.

Pertimbangkan:

* Status
* Correction
* Soft delete
* Audit trail
* Historical record

sesuai kebutuhan domain.

---

# 27. Error Handling

Jangan menampilkan raw database error kepada user.

Bad:

```text
PostgresError: duplicate key violates unique constraint...
```

User-facing message harus jelas.

Contoh:

```text
Student dengan kode tersebut sudah terdaftar.
```

Namun error teknis tetap dapat dicatat untuk debugging/server logging.

---

# 28. TypeScript Rules

TypeScript harus strict.

Hindari:

```ts
any
```

kecuali benar-benar diperlukan dan diberi alasan.

Jangan menggunakan type assertion secara berlebihan untuk menutupi type error.

Prefer:

```text
proper type
schema inference
type guards
safe parsing
```

Zod dapat digunakan untuk runtime validation dan type inference.

---

# 29. No Premature Abstraction

Jangan membuat abstraction hanya karena terlihat "clean".

Buat abstraction apabila:

* Logic digunakan lebih dari satu tempat
* Business rule membutuhkan centralization
* Security check harus konsisten
* Database access memiliki pola berulang
* Abstraction membuat feature lebih mudah dipelihara

Hindari membuat:

```text
10 layer
```

untuk CRUD sederhana.

Prioritaskan maintainability dibanding kompleksitas arsitektur.

---

# 30. Agent Workflow

Sebelum mengerjakan task yang signifikan, agent harus:

### Step 1 — Understand

Baca:

```text
AGENTS.md
```

kemudian periksa architecture dan feature terkait.

### Step 2 — Inspect

Jangan mengasumsikan struktur project.

Periksa:

* Existing files
* Existing schema
* Existing migrations
* Existing components
* Existing Server Actions
* Existing validation
* Existing auth
* Existing database access

### Step 3 — Plan

Untuk task yang memengaruhi beberapa layer, buat rencana singkat:

```text
1. Database
2. Validation
3. Server logic
4. UI
5. Testing
```

### Step 4 — Implement

Implementasikan perubahan dengan mengikuti rules dalam dokumen ini.

### Step 5 — Verify

Minimal lakukan:

```text
TypeScript check
Lint
Relevant tests
Build check
```

jika tersedia.

### Step 6 — Report

Laporkan:

* File yang berubah
* Migration yang dibuat
* Business rule yang diterapkan
* Validation yang ditambahkan
* Authorization yang ditambahkan
* Test/check yang dilakukan
* Hal yang belum dapat diverifikasi

---

# 31. Do Not Guess Business Rules

Jika requirement bisnis belum jelas dan keputusan tersebut dapat memengaruhi:

* Database
* Payroll
* Attendance
* Session numbering
* Rescheduling
* Authorization
* Historical data

jangan menebak.

Tanyakan user terlebih dahulu.

Namun jika keputusan tersebut bersifat:

* UI detail kecil
* naming lokal
* formatting
* non-breaking implementation detail

agent boleh menggunakan judgement yang wajar.

---

# 32. Important Business Decisions

Beberapa hal harus tetap configurable karena belum tentu final:

* Tutor fee rate
* Payroll formula
* Rescheduling policy detail
* Group/class behavior
* Attendance verification workflow
* Additional roles
* Additional attendance status

Jangan hardcode asumsi yang belum menjadi keputusan resmi.

---

# 33. MVP Attendance Verification

Workflow yang dipertimbangkan:

```text
Tutor
  ↓
submitted
  ↓
Management
  ↓
verified
```

atau:

```text
submitted
  ↓
correction_requested
```

Untuk MVP, status minimum dapat berupa:

```text
submitted
```

dan Management dapat melakukan koreksi dengan audit trail.

Jangan membangun workflow approval kompleks sebelum memang diperlukan.

---

# 34. Security Priorities

Prioritas keamanan:

1. Authentication
2. Authorization
3. Server-side validation
4. Database constraints
5. RLS/mapping identity yang benar
6. Storage access control
7. Audit logging
8. Secure error handling
9. Input/file validation

Jangan menganggap:

```text
hidden UI = secure
```

atau:

```text
middleware = complete authorization
```

---

# 35. Core Architecture

Secara konseptual:

```text
                    ┌──────────────┐
                    │   Browser    │
                    └──────┬───────┘
                           │
                    Next.js App Router
                           │
             ┌─────────────┴─────────────┐
             │                           │
       Server Components          Client Components
             │                           │
             │                    React Hook Form
             │                    Zustand
             │                    Camera
             │                    TanStack Table
             │
             ▼
       Server Actions
       Route Handlers
             │
       Authentication
        Better Auth
             │
       Authorization
             │
       Zod Validation
             │
       Business Logic
             │
       ┌─────┴───────────────┐
       │                     │
       ▼                     ▼
Supabase PostgreSQL    Supabase Storage
       │                     │
       │                     └── Attendance Photos
       │
       ├── Students
       ├── Tutors
       ├── Schedules
       ├── Sessions
       ├── Attendance
       ├── Tutor Rates
       ├── Payroll
       └── Audit Logs
```

---

# 36. Final Rule

Prioritaskan:

```text
Correctness
    >
Security
    >
Data Integrity
    >
Business Rules
    >
Maintainability
    >
Performance
    >
UI polish
```

Jangan mengorbankan data integrity atau security hanya untuk membuat feature selesai lebih cepat.

Jika terdapat konflik antara implementasi cepat dan business rule, **business rule harus menang**.

Jika terdapat konflik antara UI convenience dan security, **security harus menang**.

Jika terdapat ketidakjelasan pada business rule yang dapat menyebabkan data historis atau payroll salah, **berhenti pada boundary tersebut dan minta klarifikasi user sebelum membuat asumsi permanen**.
