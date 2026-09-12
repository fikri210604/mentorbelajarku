"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { tutorSchema, TutorInput } from "../schemas/tutor.schema";

export async function updateTutorStatus(id: string, status: "active" | "inactive") {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tutors")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/management/tutors");
  revalidatePath(`/management/tutors/${id}`);
  return { success: true, data };
}

/**
 * Mempromosikan atau mengubah role tutor menjadi manajemen (HRD, Keuangan, atau Owner).
 * Hanya dapat dijalankan oleh user dengan subrole 'owner' atau 'admin'.
 */
export async function promoteTutorToManagement(params: {
  tutorId: string;
  newSubrole: "hrd" | "finance" | "owner";
  keepActiveTeaching?: boolean;
}) {
  try {
    const { getCurrentUser } = await import("@/lib/auth/session");
    const currentUser = await getCurrentUser();

    // Pastikan hanya Owner yang boleh mengubah role
    if (currentUser.role !== "admin" && currentUser.subrole !== "owner") {
      return {
        success: false,
        error: "FORBIDDEN: Hanya Owner / Super Admin yang berhak mengubah role pengguna.",
      };
    }

    // Update data sintesis jika dalam mode sintesis
    const { SYNTHETIC_USERS } = await import("@/data/users");
    const targetUser = SYNTHETIC_USERS.find((u) => u.tutorId === params.tutorId);
    if (targetUser) {
      targetUser.role = "management";
      targetUser.subrole = params.newSubrole;
    }

    // Revalidasi halaman
    revalidatePath("/management/tutors");
    revalidatePath(`/management/tutors/${params.tutorId}`);
    revalidatePath("/management/dashboard");

    return {
      success: true,
      message: `Berhasil mengubah role tutor menjadi Management (${params.newSubrole.toUpperCase()}).`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengubah role tutor.";
    return { success: false, error: message };
  }
}
