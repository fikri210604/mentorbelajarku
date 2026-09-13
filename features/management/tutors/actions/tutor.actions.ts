"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { tutorSchema, TutorInput } from "../schemas/tutor.schema";
import { SYNTHETIC_TUTORS } from "@/data/tutors";
import { getCurrentUser } from "@/lib/auth/session";
import { SYNTHETIC_USERS } from "@/data/users";

export async function updateTutorStatus(id: string, status: "active" | "inactive") {
  try {
    const supabase = createServerClient();
    await supabase
      .from("tutors")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
  } catch (err) {
    console.warn("Supabase updateTutorStatus fallback:", err);
  }

  // Update in-memory synthetic tutors for local demo/prototype
  try {
    const tutor = SYNTHETIC_TUTORS.find((t) => t.id === id || t.userId === id);
    if (tutor) {
      tutor.status = status;
    }
  } catch (err) {
    console.warn("SYNTHETIC_TUTORS update fallback error:", err);
  }

  revalidatePath("/management/tutors");
  revalidatePath(`/management/tutors/${id}`);
  revalidatePath("/management/dashboard");
  return {
    success: true,
    message: `Status tutor berhasil diubah menjadi ${status === "active" ? "Aktif" : "Nonaktif"}.`,
  };
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
    const currentUser = await getCurrentUser();

    // Pastikan hanya Owner yang boleh mengubah role
    if (currentUser.role !== "admin" && currentUser.subrole !== "owner") {
      return {
        success: false,
        error: "FORBIDDEN: Hanya Owner / Super Admin yang berhak mengubah role pengguna.",
      };
    }

    // Update data sintesis jika dalam mode sintesis
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
