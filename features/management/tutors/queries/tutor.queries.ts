import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { SYNTHETIC_TUTORS } from "@/data/tutors";
import { TutorWithProfile } from "../types";

export async function getTutors(): Promise<TutorWithProfile[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("tutors")
        .select(`
          *,
          profiles (*),
          tutor_rates (*, bimbel_types (*))
        `)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data as unknown as TutorWithProfile[];
      }
    } catch (err) {
      console.warn("getTutors Supabase fallback:", err);
    }
  }

  // Fallback to SYNTHETIC_TUTORS
  return SYNTHETIC_TUTORS.map((t) => ({
    id: t.id,
    user_id: t.userId,
    bio: t.bio,
    status: t.status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: {
      id: t.userId,
      full_name: t.name,
      phone: t.phone,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    rates: [],
  })) as unknown as TutorWithProfile[];
}

export async function getTutorById(id: string): Promise<TutorWithProfile | null> {
  if (isSupabaseConfigured()) {
    try {
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

      if (!error && data) {
        return data as unknown as TutorWithProfile;
      }
    } catch (err) {
      console.warn("getTutorById Supabase fallback:", err);
    }
  }

  // Fallback to SYNTHETIC_TUTORS
  const found = SYNTHETIC_TUTORS.find((t) => t.id === id || t.userId === id);
  if (!found) return null;

  return {
    id: found.id,
    user_id: found.userId,
    bio: found.bio,
    status: found.status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: {
      id: found.userId,
      full_name: found.name,
      phone: found.phone,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    rates: [],
  } as unknown as TutorWithProfile;
}
