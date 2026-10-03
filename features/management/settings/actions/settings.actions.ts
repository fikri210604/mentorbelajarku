"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuthUser, checkPermission } from "@/lib/auth/session";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";
import { STUDENTS_CACHE_TAG } from "@/lib/cache/tags";
import type { Permission } from "@/types/auth";
import {
  bimbelTypeSchema,
  BimbelTypeInput,
  programSchema,
  ProgramInput,
  tutorRateSchema,
  TutorRateInput,
  bimbelPackageSchema,
  BimbelPackageInput,
  managementRateSchema,
  ManagementRateInput,
  attendanceWindowSettingSchema,
  AttendanceWindowSettingInput,
  sessionAttendanceDeadlineSchema,
  SessionAttendanceDeadlineInput,
} from "../schemas/settings.schema";

interface ActionResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

// Nilai default tampilan bila belum ada konfigurasi tersimpan di database.
// Bukan sumber data: hanya untuk mengisi form saat database kosong.
const DEFAULT_ATTENDANCE_WINDOW_SETTING: {
  id: string;
  name: string;
  open_before_minutes: number;
  close_after_hours: number;
  max_days_allowed: number;
  daily_cutoff_time: string;
  allow_tutor_backdate: boolean;
  description: string;
  status: "active" | "inactive";
  updated_at: string;
} = {
  id: "att-win-default",
  name: "Pengaturan Standar Presensi",
  open_before_minutes: 15,
  close_after_hours: 4,
  max_days_allowed: 1,
  daily_cutoff_time: "23:59:59",
  allow_tutor_backdate: false,
  description: "Konfigurasi baku batas waktu presensi dan upload foto sesi oleh tutor.",
  status: "active",
  updated_at: new Date().toISOString(),
};

async function verifyManagementAuth() {
  const session = await requireAuthUser();
  if (session.role !== "management" && (session.role as string) !== "admin") {
    throw new Error("Akses ditolak: Hanya akun manajemen/owner yang berhak mengelola pengaturan.");
  }
  return session;
}

async function verifyOwnerAuth() {
  const session = await requireAuthUser();
  if (session.subrole !== "owner" && (session.role as string) !== "owner") {
    throw new Error("Akses Ditolak: Hanya akun Owner yang berwenang mengatur gaji dan tarif manajemen.");
  }
  return session;
}

/**
 * Guard berbasis permission dinamis. Menggantikan cek role hardcoded untuk
 * modul yang sudah dimigrasikan (mis. tarif tutor).
 */
async function verifyPermission(permission: Permission) {
  const { user, allowed } = await checkPermission(permission);
  if (!allowed) {
    throw new Error("Akses ditolak: Anda tidak memiliki hak akses yang dibutuhkan untuk aksi ini.");
  }
  return user;
}

// ==============================================================================
// 1. BIMBEL TYPES ACTIONS
// ==============================================================================
export async function saveBimbelType(input: BimbelTypeInput): Promise<ActionResponse> {
  try {
    const session = await verifyManagementAuth();
    const validated = bimbelTypeSchema.parse(input);
    const supabase = createServerClient();

    if (validated.id) {
      const { error } = await supabase
        .from("bimbel_types")
        .update({
          name: validated.name,
          duration_minutes: validated.duration_minutes,
          description: validated.description || null,
          status: validated.status as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", validated.id);

      if (error) throw new Error(error.message);

      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action: "UPDATE_BIMBEL_TYPE",
        entity_type: "bimbel_types",
        entity_id: validated.id,
        metadata: validated,
      });

      revalidatePath("/management/settings/bimbel-types");
      revalidatePath("/management/settings");
      revalidateTag(STUDENTS_CACHE_TAG, "max");
      return { success: true, message: `Jenis bimbel "${validated.name}" berhasil diperbarui.` };
    } else {
      const { data, error } = await supabase
        .from("bimbel_types")
        .insert({
          name: validated.name,
          duration_minutes: validated.duration_minutes,
          description: validated.description || null,
          status: validated.status as any,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action: "CREATE_BIMBEL_TYPE",
        entity_type: "bimbel_types",
        entity_id: data.id,
        metadata: validated,
      });

      revalidatePath("/management/settings/bimbel-types");
      revalidatePath("/management/settings");
      revalidateTag(STUDENTS_CACHE_TAG, "max");
      return { success: true, message: `Jenis bimbel "${validated.name}" berhasil ditambahkan.` };
    }
  } catch (err: unknown) {
    console.error("saveBimbelType error:", err);
    return { success: false, error: getSafeErrorMessage(err, "Gagal menyimpan jenis bimbel.") };
  }
}

export async function deleteBimbelType(id: string): Promise<ActionResponse> {
  try {
    const session = await verifyManagementAuth();
    const supabase = createServerClient();

    const { count: enrollCount } = await supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("bimbel_type_id", id);

    if (enrollCount && enrollCount > 0) {
      return {
        success: false,
        error: `Jenis bimbel tidak dapat dihapus karena sedang digunakan oleh ${enrollCount} pendaftaran murid aktif.`,
      };
    }

    const { error } = await supabase.from("bimbel_types").delete().eq("id", id);
    if (error) throw new Error(error.message);

    await supabase.from("audit_logs").insert({
      user_id: session.user.id,
      action: "DELETE_BIMBEL_TYPE",
      entity_type: "bimbel_types",
      entity_id: id,
    });

    revalidatePath("/management/settings/bimbel-types");
    revalidatePath("/management/settings");
    revalidateTag(STUDENTS_CACHE_TAG, "max");
    return { success: true, message: "Jenis bimbel berhasil dihapus." };
  } catch (err: unknown) {
    console.error("deleteBimbelType error:", err);
    return { success: false, error: getSafeErrorMessage(err, "Gagal menghapus jenis bimbel.") };
  }
}

// ==============================================================================
// 2. PROGRAMS (MATA PELAJARAN) ACTIONS
// ==============================================================================
export async function saveProgram(input: ProgramInput): Promise<ActionResponse> {
  try {
    const session = await verifyManagementAuth();
    const validated = programSchema.parse(input);
    const supabase = createServerClient();

    if (validated.id) {
      const { error } = await supabase
        .from("programs")
        .update({
          code: validated.code,
          name: validated.name,
          level: validated.level,
          description: validated.description || null,
          status: validated.status as any,
          updated_at: new Date().toISOString(),
        })
        .eq("id", validated.id);

      if (error) throw new Error(error.message);

      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action: "UPDATE_PROGRAM",
        entity_type: "programs",
        entity_id: validated.id,
        metadata: validated,
      });

      revalidatePath("/management/settings/programs");
      revalidatePath("/management/settings");
      revalidateTag(STUDENTS_CACHE_TAG, "max");
      return { success: true, message: `Mata pelajaran "${validated.name}" berhasil diperbarui.` };
    } else {
      const { data, error } = await supabase
        .from("programs")
        .insert({
          code: validated.code,
          name: validated.name,
          level: validated.level,
          description: validated.description || null,
          status: validated.status as any,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action: "CREATE_PROGRAM",
        entity_type: "programs",
        entity_id: data.id,
        metadata: validated,
      });

      revalidatePath("/management/settings/programs");
      revalidatePath("/management/settings");
      revalidateTag(STUDENTS_CACHE_TAG, "max");
      return { success: true, message: `Mata pelajaran "${validated.name}" (${validated.code}) berhasil ditambahkan.` };
    }
  } catch (err: unknown) {
    console.error("saveProgram error:", err);
    return { success: false, error: getSafeErrorMessage(err, "Gagal menyimpan program bimbel.") };
  }
}

export async function deleteProgram(id: string): Promise<ActionResponse> {
  try {
    const session = await verifyManagementAuth();
    const supabase = createServerClient();

    const { count: enrollCount } = await supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("program_id", id);

    if (enrollCount && enrollCount > 0) {
      return {
        success: false,
        error: `Mata pelajaran tidak dapat dihapus karena masih digunakan oleh ${enrollCount} pendaftaran murid aktif.`,
      };
    }

    const { error } = await supabase.from("programs").delete().eq("id", id);
    if (error) throw new Error(error.message);

    await supabase.from("audit_logs").insert({
      user_id: session.user.id,
      action: "DELETE_PROGRAM",
      entity_type: "programs",
      entity_id: id,
    });

    revalidatePath("/management/settings/programs");
    revalidatePath("/management/settings");
    revalidateTag(STUDENTS_CACHE_TAG, "max");
    return { success: true, message: "Mata pelajaran berhasil dihapus." };
  } catch (err: unknown) {
    console.error("deleteProgram error:", err);
    return { success: false, error: getSafeErrorMessage(err, "Gagal menghapus program bimbel.") };
  }
}

// ==============================================================================
// 3. STANDAR TARIF HONOR TUTOR ACTIONS (BERLAKU SAMA PER ANAK PER JENIS BIMBEL)
// ==============================================================================
export async function saveTutorRate(input: TutorRateInput): Promise<ActionResponse> {
  try {
    const session = await verifyPermission("rates:manage");
    const validated = tutorRateSchema.parse(input);
    const supabase = createServerClient();

    if (validated.id) {
      const { error } = await supabase
        .from("tutor_rates")
        .update({
          bimbel_type_id: validated.bimbel_type_id,
          level: validated.level,
          rate_per_student: validated.rate_per_student,
          effective_from: validated.effective_from,
          effective_until: validated.effective_until || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", validated.id);

      if (error) throw new Error(error.message);

      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action: "UPDATE_TUTOR_RATE",
        entity_type: "tutor_rates",
        entity_id: validated.id,
        metadata: validated,
      });

      revalidatePath("/management/settings/tutor-rates");
      revalidatePath("/management/settings");
      return { success: true, message: "Standar tarif honor tutor berhasil diperbarui." };
    } else {
      const { data, error } = await supabase
        .from("tutor_rates")
        .insert({
          bimbel_type_id: validated.bimbel_type_id,
          level: validated.level,
          rate_per_student: validated.rate_per_student,
          effective_from: validated.effective_from,
          effective_until: validated.effective_until || null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action: "CREATE_TUTOR_RATE",
        entity_type: "tutor_rates",
        entity_id: data.id,
        metadata: validated,
      });

      revalidatePath("/management/settings/tutor-rates");
      revalidatePath("/management/settings");
      return { success: true, message: "Standar tarif honor tutor berhasil disimpan." };
    }
  } catch (err: unknown) {
    console.error("saveTutorRate error:", err);
    return { success: false, error: getSafeErrorMessage(err, "Gagal menyimpan tarif tutor.") };
  }
}

export async function deleteTutorRate(id: string): Promise<ActionResponse> {
  try {
    const session = await verifyPermission("rates:manage");
    const supabase = createServerClient();

    const { error } = await supabase.from("tutor_rates").delete().eq("id", id);
    if (error) throw new Error(error.message);

    await supabase.from("audit_logs").insert({
      user_id: session.user.id,
      action: "DELETE_TUTOR_RATE",
      entity_type: "tutor_rates",
      entity_id: id,
    });

    revalidatePath("/management/settings/tutor-rates");
    revalidatePath("/management/settings");
    return { success: true, message: "Tarif honor tutor berhasil dihapus." };
  } catch (err: unknown) {
    console.error("deleteTutorRate error:", err);
    return { success: false, error: getSafeErrorMessage(err, "Gagal menghapus tarif tutor.") };
  }
}

// ==============================================================================
// 4. BIMBEL PACKAGES ACTIONS
// ==============================================================================
export async function saveBimbelPackage(input: BimbelPackageInput): Promise<ActionResponse> {
  try {
    const session = await verifyManagementAuth();
    const validated = bimbelPackageSchema.parse(input);
    const supabase = createServerClient();

    if (validated.id) {
      const { error } = await supabase
        .from("bimbel_packages")
        .update({
          bimbel_type_id: validated.bimbel_type_id,
          name: validated.name,
          level: validated.level,
          max_meetings: validated.max_meetings,
          duration_minutes: validated.duration_minutes,
          monthly_price: validated.monthly_price,
          description: validated.description || null,
          status: validated.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", validated.id);

      if (error) throw new Error(error.message);

      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action: "UPDATE_BIMBEL_PACKAGE",
        entity_type: "bimbel_packages",
        entity_id: validated.id,
        metadata: validated,
      });

      revalidatePath("/management/settings/packages");
      revalidatePath("/management/settings");
      return { success: true, message: `Paket belajar "${validated.name}" berhasil diperbarui.` };
    } else {
      const { data, error } = await supabase
        .from("bimbel_packages")
        .insert({
          bimbel_type_id: validated.bimbel_type_id,
          name: validated.name,
          level: validated.level,
          max_meetings: validated.max_meetings,
          duration_minutes: validated.duration_minutes,
          monthly_price: validated.monthly_price,
          description: validated.description || null,
          status: validated.status,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action: "CREATE_BIMBEL_PACKAGE",
        entity_type: "bimbel_packages",
        entity_id: data.id,
        metadata: validated,
      });

      revalidatePath("/management/settings/packages");
      revalidatePath("/management/settings");
      return { success: true, message: `Paket belajar "${validated.name}" berhasil ditambahkan.` };
    }
  } catch (err: unknown) {
    console.error("saveBimbelPackage error:", err);
    return { success: false, error: getSafeErrorMessage(err, "Gagal menyimpan paket belajar.") };
  }
}

export async function deleteBimbelPackage(id: string): Promise<ActionResponse> {
  try {
    const session = await verifyManagementAuth();
    const supabase = createServerClient();

    const { error } = await supabase.from("bimbel_packages").delete().eq("id", id);
    if (error) throw new Error(error.message);

    await supabase.from("audit_logs").insert({
      user_id: session.user.id,
      action: "DELETE_BIMBEL_PACKAGE",
      entity_type: "bimbel_packages",
      entity_id: id,
    });

    revalidatePath("/management/settings/packages");
    revalidatePath("/management/settings");
    return { success: true, message: "Paket belajar berhasil dihapus." };
  } catch (err: unknown) {
    console.error("deleteBimbelPackage error:", err);
    return { success: false, error: getSafeErrorMessage(err, "Gagal menghapus paket belajar.") };
  }
}

// ==============================================================================
// 5. MANAGEMENT RATES ACTIONS (KHUSUS OWNER)
// ==============================================================================
export async function saveManagementRate(input: ManagementRateInput): Promise<ActionResponse> {
  try {
    const session = await verifyOwnerAuth();
    const validated = managementRateSchema.parse(input);
    const supabase = createServerClient();

    if (validated.id) {
      const { error } = await supabase
        .from("management_rates")
        .update({
          title: validated.title,
          role_level: validated.role_level,
          rate_type: validated.rate_type,
          amount: validated.amount,
          effective_from: validated.effective_from,
          effective_until: validated.effective_until || null,
          description: validated.description || null,
          status: validated.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", validated.id);

      if (error) throw new Error(error.message);

      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action: "UPDATE_MANAGEMENT_RATE",
        entity_type: "management_rates",
        entity_id: validated.id,
        metadata: validated,
      });

      revalidatePath("/management/settings/management-rates");
      revalidatePath("/management/settings");
      return { success: true, message: `Tarif gaji manajemen "${validated.title}" berhasil diperbarui.` };
    } else {
      const { data, error } = await supabase
        .from("management_rates")
        .insert({
          title: validated.title,
          role_level: validated.role_level,
          rate_type: validated.rate_type,
          amount: validated.amount,
          effective_from: validated.effective_from,
          effective_until: validated.effective_until || null,
          description: validated.description || null,
          status: validated.status,
          created_by: session.user.id,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action: "CREATE_MANAGEMENT_RATE",
        entity_type: "management_rates",
        entity_id: data.id,
        metadata: validated,
      });

      revalidatePath("/management/settings/management-rates");
      revalidatePath("/management/settings");
      return { success: true, message: `Tarif gaji manajemen "${validated.title}" berhasil ditambahkan.` };
    }
  } catch (err: unknown) {
    console.error("saveManagementRate error:", err);
    return { success: false, error: getSafeErrorMessage(err, "Gagal menyimpan tarif gaji manajemen.") };
  }
}

export async function deleteManagementRate(id: string): Promise<ActionResponse> {
  try {
    const session = await verifyOwnerAuth();
    const supabase = createServerClient();

    const { error } = await supabase.from("management_rates").delete().eq("id", id);
    if (error) throw new Error(error.message);

    await supabase.from("audit_logs").insert({
      user_id: session.user.id,
      action: "DELETE_MANAGEMENT_RATE",
      entity_type: "management_rates",
      entity_id: id,
    });

    revalidatePath("/management/settings/management-rates");
    revalidatePath("/management/settings");
    return { success: true, message: "Tarif gaji manajemen berhasil dihapus." };
  } catch (err: unknown) {
    console.error("deleteManagementRate error:", err);
    return { success: false, error: getSafeErrorMessage(err, "Gagal menghapus tarif gaji manajemen.") };
  }
}

// ==============================================================================
// 6. MASTER BATAS WAKTU ABSENSI ACTIONS
// ==============================================================================
export async function getAttendanceWindowSetting(): Promise<ActionResponse<any>> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("attendance_window_settings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[getAttendanceWindowSetting] error:", error.message);
      return {
        success: false,
        error: getSafeErrorMessage(error, "Gagal memuat pengaturan batas waktu presensi."),
      };
    }

    if (data) {
      const setting = {
        id: data.id,
        name: data.name || DEFAULT_ATTENDANCE_WINDOW_SETTING.name,
        open_before_minutes: data.open_before_minutes ?? DEFAULT_ATTENDANCE_WINDOW_SETTING.open_before_minutes,
        close_after_hours: data.close_after_hours ?? DEFAULT_ATTENDANCE_WINDOW_SETTING.close_after_hours,
        max_days_allowed: data.max_days_allowed ?? DEFAULT_ATTENDANCE_WINDOW_SETTING.max_days_allowed,
        daily_cutoff_time: data.daily_cutoff_time || DEFAULT_ATTENDANCE_WINDOW_SETTING.daily_cutoff_time,
        allow_tutor_backdate: data.allow_tutor_backdate ?? DEFAULT_ATTENDANCE_WINDOW_SETTING.allow_tutor_backdate,
        description: data.description || DEFAULT_ATTENDANCE_WINDOW_SETTING.description,
        status: data.status || DEFAULT_ATTENDANCE_WINDOW_SETTING.status,
        updated_at: data.updated_at || new Date().toISOString(),
      };
      return { success: true, data: setting };
    }

    // Belum ada konfigurasi tersimpan: tampilkan nilai default form.
    return { success: true, data: DEFAULT_ATTENDANCE_WINDOW_SETTING };
  } catch (err: unknown) {
    return {
      success: false,
      error: getSafeErrorMessage(err, "Gagal memuat pengaturan batas waktu presensi."),
    };
  }
}

export async function saveAttendanceWindowSetting(
  input: AttendanceWindowSettingInput
): Promise<ActionResponse> {
  try {
    const session = await verifyManagementAuth();
    const validated = attendanceWindowSettingSchema.parse(input);
    const supabase = createServerClient();

    let savedData: { id: string } | null = null;

    if (validated.id && validated.id !== "att-win-default") {
      const { data, error } = await supabase
        .from("attendance_window_settings")
        .update({
          name: validated.name,
          open_before_minutes: validated.open_before_minutes,
          close_after_hours: validated.close_after_hours,
          max_days_allowed: validated.max_days_allowed,
          daily_cutoff_time: validated.daily_cutoff_time,
          allow_tutor_backdate: validated.allow_tutor_backdate,
          description: validated.description || null,
          status: validated.status,
          updated_by: session.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", validated.id)
        .select()
        .single();

      if (error || !data) {
        return {
          success: false,
          error: getSafeErrorMessage(error, "Gagal memperbarui master batas waktu absensi."),
        };
      }
      savedData = data;
    } else {
      const { data, error } = await supabase
        .from("attendance_window_settings")
        .insert({
          name: validated.name,
          open_before_minutes: validated.open_before_minutes,
          close_after_hours: validated.close_after_hours,
          max_days_allowed: validated.max_days_allowed,
          daily_cutoff_time: validated.daily_cutoff_time,
          allow_tutor_backdate: validated.allow_tutor_backdate,
          description: validated.description || null,
          status: validated.status,
          updated_by: session.user.id,
        })
        .select()
        .single();

      if (error || !data) {
        return {
          success: false,
          error: getSafeErrorMessage(error, "Gagal menyimpan master batas waktu absensi."),
        };
      }
      savedData = data;
    }

    await supabase.from("audit_logs").insert({
      user_id: session.user.id,
      action: validated.id ? "UPDATE_ATTENDANCE_WINDOW_SETTINGS" : "CREATE_ATTENDANCE_WINDOW_SETTINGS",
      entity_type: "attendance_window_settings",
      entity_id: savedData?.id || validated.id || "att-win-default",
      metadata: validated as unknown as import("@/types/database.types").Json,
    });

    revalidatePath("/management/settings/attendance-window");
    revalidatePath("/management/settings");
    revalidatePath("/tutor/attendance");

    return {
      success: true,
      message: "Master batas waktu absensi berhasil disimpan.",
      data: savedData ?? undefined,
    };
  } catch (err: unknown) {
    console.error("[saveAttendanceWindowSetting] error:", err);
    return {
      success: false,
      error: getSafeErrorMessage(err, "Gagal menyimpan master batas waktu absensi."),
    };
  }
}

// ==============================================================================
// 7. OVERRIDE DISPENSASI DEADLINE PRESENSI SESI TERTENTU (KHUSUS MANAJEMEN)
// ==============================================================================
export async function updateSessionAttendanceDeadline(
  input: SessionAttendanceDeadlineInput
): Promise<ActionResponse> {
  try {
    const session = await verifyManagementAuth();
    const validated = sessionAttendanceDeadlineSchema.parse(input);
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("sessions")
      .update({
        attendance_deadline: validated.attendance_deadline,
        allow_late_upload: validated.allow_late_upload,
        late_upload_reason: validated.late_upload_reason || null,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.sessionId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    await supabase.from("audit_logs").insert({
      user_id: session.user.id,
      action: "EXTEND_SESSION_ATTENDANCE_DEADLINE",
      entity_type: "sessions",
      entity_id: validated.sessionId,
      metadata: {
        attendance_deadline: validated.attendance_deadline,
        allow_late_upload: validated.allow_late_upload,
        late_upload_reason: validated.late_upload_reason,
      },
    });

    revalidatePath(`/management/sessions/${validated.sessionId}`);
    revalidatePath("/management/sessions");
    revalidatePath(`/tutor/sessions/${validated.sessionId}`);
    revalidatePath(`/tutor/attendance`);
    return {
      success: true,
      message: "Batas waktu absensi untuk sesi ini berhasil diperpanjang.",
      data,
    };
  } catch (err: unknown) {
    console.error("updateSessionAttendanceDeadline error:", err);
    return {
      success: false,
      error: getSafeErrorMessage(err, "Gagal memperpanjang batas waktu absensi sesi."),
    };
  }
}

