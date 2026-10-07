# AGENTS.md — Engineering Rules for Bimbel Attendance System

Dokumen ini merupakan aturan engineering utama untuk seluruh kode, database, dan arsitektur yang dihasilkan atau dimodifikasi oleh AI agent di proyek ini.

Semua aturan di dalam dokumen ini bersifat **mandatory**.

Jika instruksi user bertentangan dengan aturan di dokumen ini, **jangan langsung menyimpang**. Jelaskan konflik tersebut dan minta konfirmasi user sebelum menerapkan perubahan yang melanggar aturan.

Dokumen domain/bisnis pendamping: `docs/BUSINESS_RULES.md`, `docs/DESIGN.md`, `docs/PRD.md`. Untuk status implementasi terkini lihat `docs/DEVELOPMENT_STATUS_AND_RECOMMENDATIONS.md` dan `docs/IMPLEMENTATION_STATUS_2026-09-28.md`.

---

# 1. Project Context

Project ini adalah sistem manajemen bimbingan belajar (bimbel) yang menangani:

* Manajemen (management, tutor, dynamic roles)
* RBAC dinamis (roles, permissions, role_permissions)
* Student & `student_code`
* Enrollment / paket belajar (`enrollments`, `bimbel_packages`)
* Bimbel type & durasi
* Program / mata pelajaran (`programs`)
* Kurikulum & silabus (`subjects`, `curriculum_topics`, worksheet)
* Tutor–student assignment & relasi kelas
* Schedule (`schedules`, `schedule_students`)
* Learning session (`sessions`, `rescheduled_from_session_id`)
* Attendance + jendela waktu presensi (`attendance_window_settings`)
* Rescheduling
* Learning records (`learning_records`)
* Progress report / rapor perkembangan (`progress_reports`)
* Tutor rates & management rates
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

* Next.js (App Router)
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

Digunakan terutama untuk foto absensi (bucket privat `attendance`).

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
* Login / Logout
* Credential/account management

Supabase bertanggung jawab atas:

* PostgreSQL
* Storage

Jangan mengimplementasikan dua sistem authentication untuk user yang sama.

---

## UI

* shadcn/ui
* Tailwind CSS
* Lucide React untuk icon
* `recharts` untuk grafik dashboard
* `date-fns` untuk utilitas tanggal

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

Zustand hanya digunakan untuk state client/UI:

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

## Camera & Image

* `react-webcam` untuk pengambilan foto langsung dari browser.
* `browser-image-compression` untuk kompresi gambar sisi klien sebelum upload.

---

# 3. Authentication & Authorization

## Authentication Boundary

Better Auth adalah satu-satunya authentication provider.

Jangan:

* Membuat login kedua menggunakan Supabase Auth
* Menyimpan session authentication sendiri tanpa alasan
* Menganggap Supabase RLS otomatis mengenali session Better Auth

Identitas Better Auth harus memiliki mapping yang eksplisit dan aman apabila digunakan dalam authorization/RLS.

`getCurrentUser()` (`lib/auth/session.ts`) bersifat **fail-closed**: mengembalikan `null` bila tidak ada sesi Better Auth valid. Tidak ada fallback ke identitas sintetis.

---

## Roles (Dynamic RBAC)

Sistem **tidak** memakai pengecekan role hardcoded tersebar. Hak akses dikelola dinamis di database:

```text
roles                # name, display_name, is_system, description
permissions          # id (mis. 'student:create'), category, name
role_permissions     # pivot role_id <-> permission_id
user.role            # string kompatibel Better Auth & portal routing
user.role_id         # FK -> roles (otoritatif untuk permission)
```

* `profiles` **tidak** menyimpan role. SSOT authorization adalah `user.role` + `user.role_id`.
* Role portal yang dipakai routing: `management`, `tutor`, `admin`, `finance`.
* Subrole manajemen yang dikenal: `owner`, `curriculum`, `hrd`, `finance`, `general`.
* Role `owner` dan `tutor` adalah system role (`is_system = true`) dan tidak boleh dihapus.
* Owner dapat menambah role baru dan mengatur permission-nya dari UI tanpa deploy.
* Permission efektif diresolusi dari `role_permissions` (via `role_id`), fallback ke pemetaan statis `config/permissions.ts` (`lib/permissions/resolver.ts`).
* Session membawa `role`, `roleId`, `roleName`, `permissions[]`, `subrole`, dan `tutorId` (`CurrentUserSession`).

Jangan menyebarkan pengecekan role hardcoded. Hindari:

```ts
if (user.role === "management") { ... }
```

Gunakan abstraction terpusat:

```text
# Server Component
requireAuthUser()
requireRoleUser([...])          # hanya untuk gerbang portal, bukan granular
requirePermissionUser(permission)

# Server Action
checkPermission(permission)

# Route Handler
requireApiUser()
requireManagementApi(permission?)
requirePermissionApi(permission)
requireTutorApi(permission?)    # fail-closed bila tanpa tutorId
```

`sessionHasPermission()` mengembalikan `true` untuk `owner`. Jangan membuat guard permission lokal per file.

---

## Server-side Authorization

Setiap Server Action atau Route Handler yang menyentuh data sensitif **WAJIB melakukan authorization check di server**.

Minimal berlaku untuk:

* students
* tutors
* attendance
* schedules
* sessions
* enrollments
* tutor_rates / management_rates
* tutor_payments / payroll
* roles / permissions / user role assignment
* audit_logs

UI hiding bukan authorization.

Middleware juga bukan satu-satunya security boundary.

Pola yang benar:

```text
Request
  ↓
Authentication check
  ↓
Authorization / permission check
  ↓
Input validation
  ↓
Business rule validation
  ↓
Database mutation (transaksional bila multi-tabel)
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
meeting_number
completed_sessions
total_attendance
used_meetings
remaining_meetings
```

Data tersebut dihitung dari attendance aktual (view/query/aggregate). Contoh view: `v_attendance_with_meeting_number`.

Namun atribut **paket/enrollment** berikut boleh disimpan karena bukan hasil transaksi:

```text
max_meetings
package_name
price
start_date / end_date
```

`enrollments.package_name` dan `enrollments.price` adalah snapshot paket saat enrollment dibuat.

---

# 5. Business Rules — Bimbel Type

Jenis bimbel master:

```text
Reguler   = 60 menit (default master)
Intensif  = 75 menit
Private   = 90 menit
```

Durasi harus dimodelkan sebagai data/configuration (`bimbel_types.duration_minutes`), bukan hardcoded di banyak tempat.

Paket per jenjang (`bimbel_packages`) dapat menimpa durasi default dan menyimpan `max_meetings` serta `monthly_price`.

Jangan menentukan jenis bimbel dengan menebak berdasarkan durasi schedule. Jenis bimbel harus menjadi data eksplisit.

## Jenis Bimbel adalah atribut PER MURID (enrollment), bukan per schedule/session

Satu jadwal boleh memuat murid dengan jenis bimbel berbeda (mis. Reguler 60 m + Intensif 75 m pada jam mulai sama). Karena itu (migration `0003`):

* `schedules.bimbel_type_id` dan `sessions.bimbel_type_id` boleh `NULL`.
* Jam selesai sesi = jam mulai + durasi tipe **paling lama**.
* Absensi cukup sekali pada jam selesai tersebut.
* Rate honor dihitung per murid dari `enrollment.bimbel_type_id` masing-masing.

Jangan menetapkan satu jenis bimbel pada jadwal lalu memakainya untuk semua murid.

## Enrollment / Paket

* `enrollments` merepresentasikan satu paket bimbel murid dengan `max_meetings` (umumnya 8/12).
* Nomor pertemuan dihitung per enrollment (lihat §11).
* Paket baru dibuat oleh **Management** (bukan Tutor) saat paket sebelumnya `completed`.
* Setelah `max_meetings` tercapai, enrollment `completed`; paket berikutnya mulai dari P1.

---

# 6. Business Rules — Schedule vs Session

Pisahkan dengan tegas:

## Schedule

Representasi jadwal/rencana belajar (`schedules` + `schedule_students`).

Contoh:

```text
Alghazy
Rabu
16:00
Reguler
Tutor: Abi Hanif
```

Schedule bukan bukti bahwa pembelajaran benar-benar terjadi.

## Session

Representasi kejadian pembelajaran aktual pada tanggal tertentu (`sessions`).

```text
9 September 2026
16:00–17:00
Tutor: Abi Hanif
Student: Alghazy
```

Session adalah dasar untuk attendance, learning record, nomor pertemuan, dan tutor fee.

Session menyimpan `rescheduled_from_session_id` untuk menjaga histori reschedule.

## Attendance

Attendance (`attendance`) merupakan status kehadiran student terhadap suatu session, terhubung ke `enrollment_id`.

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
* Tutor pengganti per session
* Group/class
* Private session

Tutor aktual yang mengajar disimpan pada `sessions.tutor_id`, bukan `schedules.tutor_id`. Payroll memakai `sessions.tutor_id`.

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

sebagai unique identifier. Nama student dapat sama dan dapat berubah.

Gunakan primary key internal seperti UUID untuk relational integrity, sedangkan `student_code` ditampilkan kepada user.

---

# 9. Attendance Workflow

Status (`attendance_status`):

```text
present
absent
permission
sick
late
```

Attendance hanya boleh dibuat terhadap `session`, bukan langsung terhadap `schedule`.

Aturan konsumsi paket & payable (eksplisit, jangan hardcode `WHERE status='present'`):

| Status | `consumes_meeting` | Payable |
|---|---|---|
| present | Ya | Ya |
| late | Ya | Ya |
| permission | Tidak | Tidak |
| sick | Tidak | Tidak |
| absent | Tidak | Tidak |

Verification (`verification_status`): `submitted` (default), `verified`, `correction_requested`. Untuk MVP, payroll tidak mewajibkan `verified`.

Foto presensi **wajib** saat submit; bypass jendela waktu tidak boleh berasal dari input client.

## Jendela Waktu Presensi

Konfigurasi `attendance_window_settings` (open before, close after, max days, daily cutoff, allow backdate) divalidasi **di server**. Pengecualian hanya melalui operasi Management teraudit (`overrideAttendanceWindow`, permission `attendance:update`).

---

# 10. Permission & Rescheduling

Jika student `permission` (atau `sick`):

* Session tidak dianggap sebagai completed learning session untuk student tersebut.
* Jatah pertemuan tidak otomatis berkurang.
* Student dapat dijadwalkan ulang.

Jangan menganggap `scheduled = completed` dan jangan mengurangi paket hanya karena tanggal schedule telah lewat.

Business rule rescheduling harus mempertahankan histori. Jangan menghapus histori session hanya karena terjadi reschedule. Sesi lama ditandai `rescheduled`; sesi pengganti dibuat dan dihubungkan via `rescheduled_from_session_id`.

---

# 11. Session Number

`session_number` / nomor pertemuan merepresentasikan pertemuan efektif, bukan jumlah schedule yang lewat.

Aturan (migration `0004`):

* Nomor dihitung **per enrollment/paket murid**.
* Bila `enrollment_id` NULL, fallback per `student_id`.
* Hanya `present`/`late` dihitung; `permission`/`sick`/`absent` tidak menambah urutan.
* Nomor **tidak disimpan** sebagai kolom; dihitung via view `v_attendance_with_meeting_number` (`meeting_number`, `meeting_code = 'P' || n`).
* Setelah `max_meetings` tercapai, paket `completed`; paket baru mulai dari P1 (tanpa meng-update data lama).

Contoh:

```text
P1 present
P2 present
-- permission (tidak menambah)
P3 present
...
P12 present → completed
P1 (paket baru)
```

Jangan pernah melakukan `UPDATE attendance SET meeting_number = ...`. Data historis immutable.

---

# 12. Tutor Fee / Payroll

Fee tutor dihitung dari jumlah student payable pada session tersebut:

```text
fee = rate × payable_students
```

Contoh:

```text
Rate = Rp25.000 / student
Payable students = 4
Fee = Rp100.000
```

Untuk satu student: `Fee = rate × 1`.

`payable_students` ditentukan oleh aturan status (§9), bukan asumsi bahwa `present` selalu satu-satunya payable.

---

# 13. Fee Must Be Configurable

Jangan hardcode tarif:

```ts
const tutorFee = 25000;
const REGULAR_RATE = 20000;
```

Tarif berasal dari database dan dapat diatur Management.

Model:

```text
tutor_rates
├── tutor_id            (NULL = tarif global)
├── bimbel_type_id
├── level
├── rate_per_student
├── effective_from
└── effective_until
```

Hierarki resolusi: **tarif tutor-spesifik menang** atas tarif global untuk `(bimbel_type_id, level)` yang sama; bila tidak ada, pakai global.

Untuk peran manajemen gunakan `management_rates` (`role_level`, `rate_type`, `amount`, effective dating) — jangan campur dengan fee per-sesi tutor.

Formula payroll harus memungkinkan perubahan business rule di masa depan. Jangan mengasumsikan seluruh jenis bimbel memiliki formula fee yang sama jika Management belum menetapkannya.

---

# 14. Historical Rate Integrity

Tarif yang telah digunakan untuk payroll historis tidak boleh berubah secara retroaktif.

Jangan melakukan:

```text
UPDATE tutor_rates SET rate = new_rate
```

terhadap record tarif historis yang sudah digunakan.

Gunakan versioning/effective dating:

```text
Rp20.000  effective_from = 2026-01-01, effective_until = 2026-09-30
Rp25.000  effective_from = 2026-10-01, effective_until = NULL
```

Payroll September tetap memakai tarif September meskipun Management mengubah tarif pada Oktober.

Periode tarif tumpang tindih ditolak oleh constraint `ex_tutor_rates_no_overlap` (EXCLUDE USING gist).

---

# 15. Payroll Calculation

Perhitungan payroll/honor **WAJIB dilakukan di server**.

Client tidak boleh menjadi source of truth untuk:

```text
fee
subtotal
gross_amount
net_amount
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
Server authorization (payroll:generate/finalize/pay)
  ↓
Fetch rate (historis, deterministik)
  ↓
Fetch valid sessions + attendance
  ↓
Determine payable students (present/late)
  ↓
Calculate fee
  ↓
Persist transaksi (header + items)
```

Jangan percaya nilai fee yang dikirim dari browser.

Model tabel: `tutor_payments` (dengan `gross_amount`/`bonus`/`deduction`/`net_amount`/`total_amount` serta status `draft`/`processed`/`paid`) dan `tutor_payment_items` (detail per sesi/murid/tarif). Trigger `set_tutor_payment_amounts` menyinkronkan `net_amount` dan `total_amount`. Idempotensi dijaga UNIQUE `(tutor_id, period_start, period_end)`.

---

# 16. Audit Logs

Perubahan terhadap data sensitif wajib dicatat ke `audit_logs` di server/database layer, tidak hanya di client.

Minimal mencatat:

```text
who        (user_id)
what       (action, entity_type, entity_id)
when       (created_at)
before     (metadata.before)
after      (metadata.after)
```

Data yang wajib diaudit minimal:

* Attendance changes / koreksi
* Koreksi learning record / progress report
* Tutor rate / management rate changes
* Tutor payment/payroll status changes
* Sensitive schedule/session changes yang memengaruhi payroll
* Mutasi role/permission & penugasan role ke user
* Management corrections

Mutasi presensi via RPC `submit_session_attendance` menulis audit dalam transaksi yang sama. Jangan menelan kegagalan audit tanpa jejak.

---

# 17. Attendance Photo Storage

Foto absensi disimpan di:

```text
Supabase Storage (bucket privat: attendance)
```

Database hanya menyimpan `photo_path`.

Recommended path:

```text
attendance/{year}/{month}/{session_id}/{student_id}.jpg
```

Contoh:

```text
attendance/2026/09/session-uuid/student-uuid.jpg
```

Bucket diset privat (`public = false`), limit ukuran 5 MB, MIME allow-list (`image/jpeg`, `image/png`, `image/webp`). Akses hanya lewat signed URL yang dibuat server setelah otorisasi (`getAuthorizedAttendancePhotoUrl` / `signAttendancePhotoPath`).

---

## Photo Validation

File harus divalidasi di server sebelum diterima.

Minimal validasi:

* Estimasi ukuran pre-decode
* Magic bytes (JPEG/PNG/WebP)
* MIME type
* Penolakan file spoofed

Jangan mempercayai `file.name`/`file.type` dari browser sebagai satu-satunya security validation.

---

## Photo Compression

Kompresi di sisi klien (`browser-image-compression`) diperbolehkan untuk mempercepat upload, tetapi validasi final tetap di server. Jangan mengandalkan hasil kompresi client sebagai bukti keaslian.

---

# 18. Browser Camera

Untuk pengambilan foto langsung dari browser, gunakan `react-webcam`. Camera UI harus menjadi Client Component.

```text
Attendance Form
      ↓
CameraCapture
      ↓
react-webcam
      ↓
Image Blob/File
      ↓
(client compression opsional)
      ↓
Server validation
      ↓
Supabase Storage
      ↓
photo_path
```

Jangan menyimpan binary image di Zustand sebagai persistent application state. Temporary camera state diperbolehkan di client.

---

# 19. Validation Architecture

Gunakan shared schemas. Struktur project **root-level** (bukan `src/`):

```text
features/
├── management/{feature}/schemas/
├── tutor/{feature}/schemas/
└── shared/{feature}/schemas/
```

Contoh:

```text
features/shared/attendance/schemas/attendance.schema.ts
features/management/payroll/schemas/payroll.schema.ts
```

Schema tersebut digunakan untuk:

```text
React Hook Form
       +
Server Action / Route Handler
```

Jangan menduplikasi rules client dan server dengan definisi berbeda.

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

Server data harus berasal dari Server Components, Server Actions, Route Handlers, fetch, atau cache/data-fetching library resmi.

---

# 21. Server Components First

Default architecture adalah Server Component.

Gunakan Client Component hanya apabila membutuhkan:

* User interaction
* React state
* Browser API
* Camera
* Form interaction
* Zustand
* TanStack Table interaction
* Other client-only APIs

Jangan menjadikan seluruh dashboard `"use client"` tanpa alasan.

---

# 22. Database Migration

Setiap perubahan schema wajib menggunakan migration SQL eksplisit (Supabase migrations). Jangan mengandalkan perubahan manual di Supabase Dashboard.

Struktur saat ini:

```text
supabase/
└── migrations/
    ├── 0001_initial_schema.sql          # schema inti + RLS + storage + RPC + triggers
    ├── 0002_delete_student_function.sql # RPC delete_student_cascade
    ├── 0003_per_student_bimbel_type.sql # jenis bimbel per murid
    └── 0004_meeting_number_per_student.sql
```

Database harus dapat direproduksi dari migration. Jangan mengedit migration yang sudah dirilis; buat migration baru.

---

# 23. Database Design Principles

Gunakan:

* Foreign keys
* Unique constraints
* Check constraints
* Not-null constraints
* Indexes pada kolom yang sering digunakan untuk lookup/filter
* Transactional operations / RPC apabila mutation menyentuh beberapa tabel

Contoh invariant yang sudah ada:

* UNIQUE `(session_id, student_id)` pada `attendance`.
* UNIQUE `(schedule_id, session_date)` pada `sessions`.
* UNIQUE `(tutor_id, period_start, period_end)` pada `tutor_payments`.
* EXCLUDE `ex_tutor_rates_no_overlap` pada `tutor_rates`.

Jangan mengandalkan validation frontend untuk menjaga database integrity.

---

# 24. Role-Oriented & Feature-Driven Folder Structure & Thin App Pages

Gunakan struktur folder yang **menghighlight peran (role-based separation)** langsung di root project:

```text
├── app/
│   ├── (public)/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   ├── register/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx                     # landing
│   │
│   ├── (private)/
│   │   ├── dashboard/page.tsx           # gerbang redirect per role
│   │   ├── (management)/
│   │   │   └── management/
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── students/(page,new,[studentId]/{page,edit,progress-report})
│   │   │       ├── tutors/(page,[tutorId])
│   │   │       ├── schedules/(page,new,[scheduleId])
│   │   │       ├── sessions/(page,[sessionId])
│   │   │       ├── attendance/(page,[attendanceId])
│   │   │       ├── learning-records/page.tsx
│   │   │       ├── progress-reports/page.tsx
│   │   │       ├── payroll/(page,[payrollId])
│   │   │       ├── reports/{attendance,students,tutors,payroll}/page.tsx
│   │   │       └── settings/
│   │   │           ├── page.tsx
│   │   │           ├── subjects/page.tsx
│   │   │           ├── programs/page.tsx
│   │   │           ├── bimbel-types/page.tsx
│   │   │           ├── packages/page.tsx
│   │   │           ├── tutor-rates/page.tsx
│   │   │           ├── management-rates/page.tsx
│   │   │           ├── roles/page.tsx
│   │   │           ├── permissions/page.tsx
│   │   │           ├── users/page.tsx
│   │   │           └── attendance-window/page.tsx
│   │   └── (tutor)/
│   │       └── tutor/
│   │           ├── dashboard/page.tsx
│   │           ├── students/(page,[studentId])
│   │           ├── schedules/(page,[scheduleId])
│   │           ├── sessions/[sessionId]/page.tsx
│   │           ├── attendance/(page,[attendanceId])
│   │           ├── payroll/page.tsx
│   │           └── profile/page.tsx
│   │
│   └── api/
│       ├── auth/[...all]/route.ts
│       ├── health/route.ts
│       └── v1/
│           ├── auth/{session,logout}/route.ts
│           ├── management/        # endpoint khusus Management (requireManagementApi/requirePermissionApi)
│           │   ├── students/... [studentId]/{route,history,enrollments,schedules}
│           │   ├── tutors/... [tutorId]/{route,students,schedules,payroll}
│           │   ├── programs/route.ts
│           │   ├── bimbel-types/route.ts
│           │   ├── enrollments/{route,[enrollmentId]/route}
│           │   ├── schedules/{route,[scheduleId]/{route,sessions}}
│           │   ├── sessions/{route,generate,[sessionId]/{route,students,attendance}}
│           │   ├── attendance/{route,[attendanceId]/route}
│           │   ├── tutor-rates/{route,[rateId]/route}
│           │   ├── payroll/{route,generate,[payrollId]/{route,finalize,pay}}
│           │   ├── reports/{students,attendance,payroll}/route.ts
│           │   └── audit-logs/route.ts
│           └── tutor/             # endpoint khusus Tutor (requireTutorApi, fail-closed)
│               ├── dashboard/route.ts
│               ├── students/{route,[studentId]/route}
│               ├── schedules/route.ts
│               ├── sessions/[sessionId]/route.ts
│               ├── attendance/{route,[attendanceId]/route}
│               └── payroll/route.ts
│
├── features/
│   ├── auth/ (actions/, components/, schemas/)
│   ├── landing/ (components/)
│   ├── management/
│   │   ├── attendance/ (actions, components, queries, schemas, services)
│   │   ├── audit-logs/ (components, queries)
│   │   ├── dashboard/ (components, queries)
│   │   ├── learning-records/ (components)
│   │   ├── payroll/ (actions, components, queries, schemas, services)
│   │   ├── progress-reports/ (actions, components, queries)
│   │   ├── reports/ (components, queries, services)
│   │   ├── schedules/ (actions, components, queries, schemas)
│   │   ├── sessions/ (actions, components, queries)
│   │   ├── settings/ (actions, components, queries, schemas)
│   │   ├── students/ (actions, components, hooks, queries, schemas)
│   │   ├── subjects/ (actions, components, queries, schemas)
│   │   └── tutors/ (actions, components, queries, schemas)
│   ├── tutor/
│   │   ├── attendance/ (actions, components, queries, schemas, services)
│   │   ├── dashboard/ (components)
│   │   ├── payroll/ (actions, components, queries, schemas, services)
│   │   ├── profile/ (actions, components, schemas)
│   │   ├── schedules/ (actions, components, queries, schemas)
│   │   ├── sessions/ (actions, components, queries)
│   │   └── students/ (actions, components, hooks, queries, schemas)
│   └── shared/
│       ├── attendance/ (schemas, services)
│       ├── common/
│       ├── learning-records/ (queries)
│       ├── payroll/ (components, queries, services)
│       ├── progress-reports/ (actions, queries)
│       ├── sessions/ (components, services)
│       └── students/ (components, services)
│
├── components/
│   ├── ui/          # primitives shadcn/ui
│   ├── shared/      # DataTable, Camera, StatusBadge, PageHeader, skeletons
│   ├── sections/    # section landing / publik
│   ├── management/  # ManagementSidebar, ManagementHeader
│   └── tutor/       # TutorSidebar, TutorHeader
│
├── lib/
│   ├── auth/        # auth.ts, session.ts, guards.ts, authorization.ts
│   ├── permissions/ # resolver.ts, index.ts
│   ├── supabase/
│   ├── storage/
│   └── utils/
│
├── stores/
├── types/           # database.types.ts, auth.ts, common.ts
├── config/          # navigation.ts, permissions.ts, app.ts
├── middleware.ts
│
supabase/
├── migrations/
├── seed.sql
├── seed-auth.ts
└── config.toml

docs/
├── PRD.md
├── DESIGN.md
└── BUSINESS_RULES.md
```

### Thin App Pages Rule

File `page.tsx` di dalam `app/` **HANYA** bertindak sebagai thin route wrapper yang mendefinisikan metadata dan merender page component dari feature module (`@/features/...`).

```tsx
import StudentListPage from "@/features/management/students/components/StudentListPage";
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

`middleware.ts` di root **hanya** menangani dua hal:

1. Mewajibkan keberadaan cookie sesi Better Auth pada rute privat (lapisan pertama).
2. Mengarahkan user yang sudah login menjauh dari `/login` dan `/register`.

```text
Public Routes : /login, /register, /, /api/v1/auth/*
Private Routes: /management/*, /tutor/*, /api/v1/* (kecuali auth)
```

Middleware **tidak** melakukan otorisasi role/permission. Role/portal redirect ditegakkan di layout/Server Component, Server Action, dan Route Handler.

Jangan menganggap `middleware = complete authorization`.

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
Authentication
 ↓
Authorization (permission)
 ↓
Validation (Zod)
 ↓
Domain/business logic
 ↓
Database (transaksional bila perlu)
 ↓
Audit log
```

UI bertanggung jawab terhadap presentation dan interaction. Server/domain layer bertanggung jawab terhadap business rules.

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

Untuk data historis (attendance, payroll, tutor rates, sessions, enrollments), jangan sembarangan hard delete. Pertimbangkan status, correction, soft delete, audit trail, dan historical record sesuai kebutuhan domain. Penghapusan murid yang tetap dibutuhkan memakai RPC atomik `delete_student_cascade` + audit.

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

Namun error teknis tetap dicatat untuk debugging/server logging. Route Handler memakai `getSafeErrorMessage`/`apiJsonError` dan mengembalikan 401/403/500 yang aman.

---

# 28. TypeScript Rules

TypeScript harus strict.

Hindari `any` kecuali benar-benar diperlukan dan diberi alasan.

Jangan menggunakan type assertion secara berlebihan untuk menutupi type error.

Prefer proper type, schema inference, type guards, safe parsing.

Zod dapat digunakan untuk runtime validation dan type inference. Selaraskan `types/database.types.ts` dengan migration (regenerate bila memungkinkan).

---

# 29. No Premature Abstraction

Buat abstraction apabila:

* Logic digunakan lebih dari satu tempat
* Business rule membutuhkan centralization
* Security check harus konsisten
* Database access memiliki pola berulang
* Abstraction membuat feature lebih mudah dipelihara

Hindari membuat 10 layer untuk CRUD sederhana. Prioritaskan maintainability dibanding kompleksitas arsitektur.

---

# 30. Agent Workflow

Sebelum mengerjakan task yang signifikan:

### Step 1 — Understand
Baca `AGENTS.md`, lalu periksa architecture dan feature terkait.

### Step 2 — Inspect
Jangan mengasumsikan struktur project. Periksa existing files, schema, migrations, components, Server Actions, validation, auth, dan database access.

### Step 3 — Plan
Untuk task multi-layer, buat rencana singkat:

```text
1. Database
2. Validation
3. Server logic
4. UI
5. Testing
```

### Step 4 — Implement
Ikuti rules dalam dokumen ini.

### Step 5 — Verify
Minimal lakukan (jika tersedia): TypeScript check (`pnpm typecheck`), lint (`pnpm lint`), relevant tests (`pnpm test`), dan build check (`pnpm build`).

### Step 6 — Report
Laporkan: file yang berubah, migration yang dibuat, business rule yang diterapkan, validation, authorization, test/check, dan hal yang belum diverifikasi.

---

# 31. Do Not Guess Business Rules

Jika requirement bisnis belum jelas dan dapat memengaruhi database, payroll, attendance, session numbering, rescheduling, authorization, atau historical data — **jangan menebak**. Tanyakan user terlebih dahulu.

Agent boleh memakai judgement untuk UI detail kecil, naming lokal, formatting, dan non-breaking implementation detail.

Referensi keputusan yang sudah dikunci: `docs/BUSINESS_RULES.md` §18. Referensi yang masih terbuka: `docs/BUSINESS_RULES.md` §19.

---

# 32. Important Business Decisions

Beberapa hal harus tetap configurable:

* Tutor fee rate (`tutor_rates`) & management rate (`management_rates`)
* Payroll formula
* Rescheduling policy detail
* Group/class behavior
* Attendance verification workflow
* Dynamic roles & permissions
* Additional attendance status

Jangan hardcode asumsi yang belum menjadi keputusan resmi.

Keputusan yang **sudah** dikunci (28 September 2026): payroll tidak mewajibkan `verified`; `late` payable & mengurangi kuota; `sick` = `permission`; hierarki tarif tutor > global per (type + level); foto wajib; Reguler 60 menit pada master.

---

# 33. Attendance Verification (MVP)

Workflow yang dipertimbangkan:

```text
Tutor → submitted → Management → verified / correction_requested
```

Untuk MVP:

* Status default `submitted` sudah cukup dan **payable** untuk payroll.
* Management dapat melakukan koreksi dengan audit trail (`attendance:update`).
* Foto presensi wajib saat submit.
* Jangan membangun workflow approval kompleks sebelum diperlukan.

---

# 34. Security Priorities

1. Authentication
2. Authorization (permission dinamis, fail-closed)
3. Server-side validation
4. Database constraints
5. RLS/mapping identity yang benar (saat ini RLS deny-by-default; server memakai service_role)
6. Storage access control (bucket privat + signed URL)
7. Audit logging
8. Secure error handling
9. Input/file validation

Jangan menganggap `hidden UI = secure` atau `middleware = complete authorization`.

---

# 35. Core Architecture

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
             │                    react-webcam
             │                    browser-image-compression
             │                    TanStack Table / recharts
             │
             ▼
       Server Actions / Route Handlers
             │
       Authentication — Better Auth
             │
       Authorization — Dynamic RBAC (requirePermission*)
             │
       Zod Validation
             │
       Business Logic (services/RPC)
             │
             ▼
       ┌─────┴───────────────┐
       │                     │
Supabase PostgreSQL    Supabase Storage
       │                     │
       │                     └── Attendance Photos (privat)
       │
       ├── user / roles / permissions / role_permissions
       ├── students
       ├── enrollments / bimbel_packages / bimbel_types
       ├── programs / subjects / curriculum_topics
       ├── schedules / schedule_students
       ├── sessions
       ├── attendance / learning_records
       ├── progress_reports
       ├── tutor_rates / management_rates
       ├── tutor_payments / tutor_payment_items
       ├── attendance_window_settings
       └── audit_logs
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

---

# 37. Known Gaps & Alignment Notes

Catatan agar agent berikutnya tidak salah asumsi:

1. `types/database.types.ts` diselaraskan manual; disarankan regenerasi via `supabase gen types typescript` dan menghapus drift (`profiles.role` sudah tidak ada di migration).
2. Permission `reports:read` direferensikan di `config/permissions.ts`/resolver tetapi belum ada di master `permissions`/seed — selaraskan sebelum dipakai sebagai enforcement.
3. RLS saat ini **deny-by-default** (server memakai service_role). Bila ingin defense-in-depth berbasis identitas, perlu pemetaan Better Auth user → policy eksplisit.
4. Cache session in-memory 45 detik (`lib/auth/session.ts`) harus diinvalidasi (`invalidateUserSessionCache`) setelah perubahan role/permission.
5. Belum ada snapshot peserta sesi (`session_students`); perubahan membership jadwal dapat memengaruhi sesi lama.
6. State machine formal session/attendance/reschedule dan auto-generate sesi (cron) masih backlog (lihat `docs/BUSINESS_RULES.md` §19).
