import { cache } from "react";
import { createServerClient } from "@/lib/supabase/server";
import { SessionWithDetails } from "../types";

/**
 * Selective column projections untuk sesi pembelajaran, relasi absensi, dan jadwal induknya.
 */
const SESSION_SELECT_COLUMNS = `
  id,
  schedule_id,
  tutor_id,
  program_id,
  bimbel_type_id,
  session_date,
  start_time,
  end_time,
  status,
  rescheduled_from_session_id,
  notes,
  created_at,
  updated_at,
  tutors (
    id,
    profile_id,
    status,
    profiles (
      id,
      user_id,
      full_name,
      phone,
      avatar_url
    )
  ),
  programs (
    id,
    code,
    name,
    level,
    status
  ),
  bimbel_types (
    id,
    name,
    duration_minutes,
    status
  ),
  attendance (
    id,
    session_id,
    student_id,
    enrollment_id,
    status,
    verification_status,
    photo_path,
    notes,
    checked_in_at,
    learning_records (
      id,
      material,
      notes
    ),
    students (
      id,
      student_code,
      name,
      school,
      grade,
      status
    )
  ),
  schedules (
    id,
    schedule_students (
      id,
      student_id,
      enrollment_id,
      students (
        id,
        student_code,
        name,
        school,
        grade,
        status
      )
    )
  )
`;

function attachStudentsToSession(session: unknown): SessionWithDetails {
  const row = session as {
    attendance?: Array<{ students?: unknown }>;
    schedules?: { schedule_students?: Array<{ students?: unknown }> };
    students?: unknown[];
  };

  let studentsList: unknown[] = [];
  if (row.attendance && row.attendance.length > 0) {
    studentsList = row.attendance.map((att) => att.students).filter(Boolean);
  } else if (row.schedules?.schedule_students && row.schedules.schedule_students.length > 0) {
    studentsList = row.schedules.schedule_students.map((ss) => ss.students).filter(Boolean);
  }

  return {
    ...row,
    students: studentsList.length > 0 ? studentsList : row.students || [],
  } as unknown as SessionWithDetails;
}

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export const getSessions = cache(async (limit: number = 100): Promise<SessionWithDetails[]> => {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_SELECT_COLUMNS)
    .order("session_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getSessions error:", error.message);
    return [];
  }
  return (data || []).map(attachStudentsToSession);
});

export const getSessionById = cache(async (id: string): Promise<SessionWithDetails | null> => {
  if (!isUuid(id)) return null;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return attachStudentsToSession(data);
});
