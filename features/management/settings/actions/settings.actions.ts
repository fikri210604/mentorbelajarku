"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuthUser } from "@/lib/auth/session";
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
} from "../schemas/settings.schema";

interface ActionResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

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
      return { success: true, message: `Jenis bimbel "${validated.name}" berhasil ditambahkan.` };
    }
  } catch (err: unknown) {
    console.error("saveBimbelType error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Gagal menyimpan jenis bimbel." };
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
    return { success: true, message: "Jenis bimbel berhasil dihapus." };
  } catch (err: unknown) {
    console.error("deleteBimbelType error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus jenis bimbel." };
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
      return { success: true, message: `Mata pelajaran "${validated.name}" (${validated.code}) berhasil ditambahkan.` };
    }
  } catch (err: unknown) {
    console.error("saveProgram error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Gagal menyimpan mata pelajaran." };
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
    return { success: true, message: "Mata pelajaran berhasil dihapus." };
  } catch (err: unknown) {
    console.error("deleteProgram error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus mata pelajaran." };
  }
}

// ==============================================================================
// 3. STANDAR TARIF HONOR TUTOR ACTIONS (BERLAKU SAMA PER ANAK PER JENIS BIMBEL)
// ==============================================================================
export async function saveTutorRate(input: TutorRateInput): Promise<ActionResponse> {
  try {
    const session = await verifyManagementAuth();
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
    return { success: false, error: err instanceof Error ? err.message : "Gagal menyimpan tarif tutor." };
  }
}

export async function deleteTutorRate(id: string): Promise<ActionResponse> {
  try {
    const session = await verifyManagementAuth();
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
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus tarif tutor." };
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
    return { success: false, error: err instanceof Error ? err.message : "Gagal menyimpan paket belajar." };
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
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus paket belajar." };
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
    return { success: false, error: err instanceof Error ? err.message : "Gagal menyimpan tarif gaji manajemen." };
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
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus tarif gaji manajemen." };
  }
}
