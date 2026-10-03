"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { checkPermission } from "@/lib/auth/session";

export async function updateTutorStatus(id: string, status: "active" | "inactive") {
  const { allowed } = await checkPermission("tutor:update");
  if (!allowed) {
    return { success: false, error: "FORBIDDEN: Anda tidak memiliki hak mengubah status tutor." };
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("tutors")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, error: "Gagal mengubah status tutor." };
  }

  revalidatePath("/management/tutors");
  return {
    success: true,
    message: `Status tutor berhasil diubah menjadi ${status === "active" ? "Aktif" : "Nonaktif"}.`,
  };
}
