import { createServerClient } from "@/lib/supabase/server";
import { TutorWithProfile } from "../types";

export async function getTutors(): Promise<TutorWithProfile[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tutors")
    .select(`
      *,
      profiles (*),
      tutor_rates (*, bimbel_types (*))
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tutors:", error);
    return [];
  }
  return (data as unknown as TutorWithProfile[]) || [];
}

export async function getTutorById(id: string): Promise<TutorWithProfile | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tutors")
    .select(`
      *,
      profiles (*),
      tutor_rates (*, bimbel_types (*))
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }
  return data as unknown as TutorWithProfile;
}
