"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateSessionStatus(id: string, status: "scheduled" | "completed" | "cancelled" | "rescheduled") {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("sessions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/management/sessions");
  revalidatePath(`/management/sessions/${id}`);
  return { success: true, data };
}
