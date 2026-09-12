import { createServerClient } from "@/lib/supabase/server";
import { AttendanceWithDetails } from "../types";

export async function getAttendances(): Promise<AttendanceWithDetails[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("attendance")
    .select(`
      *,
      students (*),
      sessions (
        *,
        tutors (*, profiles (*)),
        programs (*),
        bimbel_types (*)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching attendance:", error);
    return [];
  }
  return (data as unknown as AttendanceWithDetails[]) || [];
}

export async function getAttendanceById(id: string): Promise<AttendanceWithDetails | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("attendance")
    .select(`
      *,
      students (*),
      sessions (
        *,
        tutors (*, profiles (*)),
        programs (*),
        bimbel_types (*)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as unknown as AttendanceWithDetails;
}
