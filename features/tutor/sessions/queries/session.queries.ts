import { createServerClient } from "@/lib/supabase/server";
import { SessionWithDetails } from "../types";

const TUTOR_SESSION_SELECT = `
  *,
  tutors (*, profiles (*)),
  programs (*),
  bimbel_types (*),
  attendance (*, students (*)),
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

export async function getSessions(tutorId?: string | null): Promise<SessionWithDetails[]> {
  const supabase = createServerClient();
  let query = supabase
    .from("sessions")
    .select(TUTOR_SESSION_SELECT)
    .order("session_date", { ascending: false });

  if (tutorId) {
    query = query.eq("tutor_id", tutorId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getSessions error:", error.message);
    return [];
  }

  return (data || []).map(attachStudentsToSession);
}

export async function getSessionById(id: string): Promise<SessionWithDetails | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(TUTOR_SESSION_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return attachStudentsToSession(data);
}
