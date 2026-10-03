import { z } from "zod";

// ==============================================================================
// 1. BIMBEL TYPE SCHEMA
// ==============================================================================
export const bimbelTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nama jenis bimbel minimal 2 karakter"),
  duration_minutes: z
    .number({ message: "Durasi harus berupa angka" })
    .min(15, "Durasi minimal 15 menit")
    .max(240, "Durasi maksimal 240 menit"),
  description: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]),
});

export type BimbelTypeInput = z.infer<typeof bimbelTypeSchema>;

// ==============================================================================
// 2. PROGRAM / MATA PELAJARAN SCHEMA
// ==============================================================================
export const programSchema = z.object({
  id: z.string().optional(),
  code: z
    .string()
    .min(2, "Kode mata pelajaran minimal 2 karakter")
    .max(10, "Kode mata pelajaran maksimal 10 karakter"),
  name: z.string().min(2, "Nama program/mata pelajaran minimal 2 karakter"),
  level: z.string().min(1, "Jenjang pendidikan wajib dipilih"),
  description: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]),
});

export type ProgramInput = z.infer<typeof programSchema>;

// ==============================================================================
// 3. STANDAR TARIF HONOR TUTOR SCHEMA (BERLAKU SAMA PER ANAK PER JENIS BIMBEL)
// ==============================================================================
export const tutorRateSchema = z.object({
  id: z.string().optional(),
  bimbel_type_id: z.string().min(1, "Jenis bimbel wajib dipilih"),
  level: z.string().min(1, "Jenjang pendidikan wajib dipilih"),
  rate_per_student: z
    .number({ message: "Tarif honor per murid harus berupa angka" })
    .min(0, "Tarif tidak boleh negatif"),
  effective_from: z.string().min(1, "Tanggal mulai berlaku wajib diisi"),
  effective_until: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]),
});

export type TutorRateInput = z.infer<typeof tutorRateSchema>;

// ==============================================================================
// 4. PAKET BELAJAR BIMBEL SCHEMA
// ==============================================================================
export const bimbelPackageSchema = z.object({
  id: z.string().optional(),
  bimbel_type_id: z.string().min(1, "Jenis bimbel wajib dipilih"),
  name: z.string().min(2, "Nama paket belajar minimal 2 karakter"),
  level: z.string().min(1, "Jenjang wajib diisi"),
  max_meetings: z
    .number({ message: "Jumlah pertemuan harus angka" })
    .min(1, "Jumlah pertemuan minimal 1 kali")
    .max(30, "Jumlah pertemuan maksimal 30 kali"),
  duration_minutes: z
    .number({ message: "Durasi harus angka" })
    .min(15, "Durasi minimal 15 menit")
    .max(240, "Durasi maksimal 240 menit"),
  monthly_price: z
    .number({ message: "Biaya harus angka" })
    .min(0, "Biaya bulanan tidak boleh negatif"),
  description: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]),
});

export type BimbelPackageInput = z.infer<typeof bimbelPackageSchema>;

// ==============================================================================
// 5. GAJI & TARIF MANAJEMEN SCHEMA (KHUSUS OWNER)
// ==============================================================================
export const managementRateSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Judul kompensasi/jabatan minimal 3 karakter"),
  role_level: z.enum(["owner", "hrd", "finance", "admin"]),
  rate_type: z.enum(["monthly", "allowance", "hourly"]),
  amount: z
    .number({ message: "Nominal gaji/tunjangan harus berupa angka" })
    .min(0, "Nominal tidak boleh negatif"),
  effective_from: z.string().min(1, "Tanggal mulai berlaku wajib diisi"),
  effective_until: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]),
});

export type ManagementRateInput = z.infer<typeof managementRateSchema>;

// ==============================================================================
// 6. MASTER BATAS WAKTU ABSENSI & UPLOAD PRESENSI SCHEMA
// ==============================================================================
export const attendanceWindowSettingSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nama pengaturan minimal 2 karakter"),
  open_before_minutes: z
    .number({ message: "Menit buka awal harus berupa angka" })
    .min(0, "Minimal 0 menit")
    .max(180, "Maksimal 180 menit (3 jam)"),
  close_after_hours: z
    .number({ message: "Jam toleransi upload harus berupa angka" })
    .min(1, "Minimal 1 jam")
    .max(72, "Maksimal 72 jam (3 hari)"),
  max_days_allowed: z
    .number({ message: "Toleransi hari harus berupa angka" })
    .min(0, "Minimal 0 hari (hanya hari H)")
    .max(30, "Maksimal 30 hari"),
  daily_cutoff_time: z.string(),
  allow_tutor_backdate: z.boolean(),
  description: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]),
});

export type AttendanceWindowSettingInput = z.infer<typeof attendanceWindowSettingSchema>;

// ==============================================================================
// 7. OVERRIDE DISPENSASI DEADLINE PRESENSI PER SESI
// ==============================================================================
export const sessionAttendanceDeadlineSchema = z.object({
  sessionId: z.string().min(1, "ID Sesi tidak valid"),
  attendance_deadline: z.string().min(1, "Batas tanggal & waktu dispensasi wajib diisi"),
  allow_late_upload: z.boolean(),
  late_upload_reason: z.string().optional().nullable(),
});

export type SessionAttendanceDeadlineInput = z.infer<typeof sessionAttendanceDeadlineSchema>;
