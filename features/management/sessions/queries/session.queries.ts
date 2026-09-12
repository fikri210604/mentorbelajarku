import { createServerClient } from "@/lib/supabase/server";
import { SYNTHETIC_SESSIONS } from "@/data/sessions";
import { SessionWithDetails } from "../types";

function mapSyntheticToSession(s: (typeof SYNTHETIC_SESSIONS)[0]): SessionWithDetails {
  return {
    id: s.id,
    schedule_id: s.schedule_id || null,
    session_date: s.session_date,
    start_time: s.start_time,
    end_time: s.end_time,
    status: s.status,
    tutor_id: s.tutor_id,
    program_id: s.program_id,
    bimbel_type_id: s.bimbel_type_id,
    rescheduled_from_session_id: s.rescheduled_from_session_id || null,
    actual_minutes: s.duration_minutes,
    notes: s.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
    updated_by: null,
    tutors: {
      id: s.tutor_id,
      profile_id: `prof-${s.tutor_id}`,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: {
        id: `prof-${s.tutor_id}`,
        user_id: s.tutor_id,
        full_name: s.tutor_name,
        phone: null,
        avatar_url: null,
        role: "tutor",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
    programs: {
      id: s.program_id,
      name: s.program_name,
      description: null,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    bimbel_types: {
      id: s.bimbel_type_id,
      name: s.bimbel_type_name,
      code: s.bimbel_type_name.toLowerCase(),
      duration_minutes: s.duration_minutes,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    attendance: s.student_id
      ? [
          {
            id: `att-${s.id}`,
            session_id: s.id,
            student_id: s.student_id,
            student_program_id: null,
            status: "present",
            photo_path: null,
            material: s.notes || null,
            notes: s.notes || null,
            checked_in_at: new Date().toISOString(),
            checked_in_by: s.tutor_id,
            verification_status: "verified",
            verified_at: new Date().toISOString(),
            verified_by: "usr-mgmt-001",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            updated_by: null,
            students: {
              id: s.student_id,
              student_code: s.student_code || "STD-001",
              name: s.student_name || "Siswa",
              gender: null,
              birth_date: null,
              school: null,
              grade: null,
              parent_name: null,
              parent_phone: null,
              address: null,
              status: "active",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
        ]
      : [],
  } as unknown as SessionWithDetails;
}

export async function getSessions(): Promise<SessionWithDetails[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("sessions")
      .select(`
        *,
        tutors (*, profiles (*)),
        programs (*),
        bimbel_types (*),
        attendance (*, students (*))
      `)
      .order("session_date", { ascending: false });

    if (error) {
      return SYNTHETIC_SESSIONS.map(mapSyntheticToSession);
    }

    if (data && data.length > 0) {
      return data as unknown as SessionWithDetails[];
    }

    return SYNTHETIC_SESSIONS.map(mapSyntheticToSession);
  } catch {
    return SYNTHETIC_SESSIONS.map(mapSyntheticToSession);
  }
}

export async function getSessionById(id: string): Promise<SessionWithDetails | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("sessions")
      .select(`
        *,
        tutors (*, profiles (*)),
        programs (*),
        bimbel_types (*),
        attendance (*, students (*))
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      const found = SYNTHETIC_SESSIONS.find((s) => s.id === id);
      return found ? mapSyntheticToSession(found) : null;
    }
    return data as unknown as SessionWithDetails;
  } catch {
    const found = SYNTHETIC_SESSIONS.find((s) => s.id === id);
    return found ? mapSyntheticToSession(found) : null;
  }
}
