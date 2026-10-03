import { cache } from "react";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { StudentProgressService } from "@/features/shared/students/services/student-progress.service";
import { StudentWithPrograms } from "../types";

const TUTOR_STUDENT_SELECT = `
  id,
  student_code,
  name,
  gender,
  birth_date,
  school,
  grade,
  level,
  status,
  parent_name,
  parent_phone,
  address,
  created_at,
  updated_at,
  enrollments (
    id,
    student_id,
    program_id,
    bimbel_type_id,
    package_id,
    package_name,
    max_meetings,
    price,
    start_date,
    end_date,
    status,
    created_at,
    updated_at,
    programs (id, code, name, level, status),
    bimbel_types (id, name, duration_minutes, status)
  )
`;

function mapRow(item: unknown): StudentWithPrograms {
  const row = item as StudentWithPrograms & {
    enrollments?: Array<Record<string, unknown> & { max_meetings?: number }>;
  };
  return {
    ...row,
    enrollments: row.enrollments || [],
    student_programs: (row.enrollments || []).map((e) => ({
      ...e,
      total_sessions: e.max_meetings,
    })),
  } as unknown as StudentWithPrograms;
}

/**
 * Murid binaan tutor aktif (melalui schedule_students).
 * Fail closed: jika akun tidak terpetakan ke tutor, kembalikan kosong.
 */
export async function getStudents(): Promise<StudentWithPrograms[]> {
  if (!isSupabaseConfigured()) return [];

  const user = await getCurrentUser();
  if (!user?.tutorId) return [];

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("schedule_students")
    .select(`student_id, schedules!inner (tutor_id), students (${TUTOR_STUDENT_SELECT})`)
    .eq("schedules.tutor_id", user.tutorId);

  if (error) {
    console.error("tutor getStudents error:", error.message);
    return [];
  }

  const map = new Map<string, StudentWithPrograms>();
  for (const row of data || []) {
    const student = (row as unknown as { students?: StudentWithPrograms }).students;
    if (student?.id && !map.has(student.id)) {
      map.set(student.id, mapRow(student));
    }
  }
  return Array.from(map.values());
}

export const getStudentById = cache(async (id: string): Promise<StudentWithPrograms | null> => {
  if (!isSupabaseConfigured()) return null;

  const user = await getCurrentUser();
  if (!user?.tutorId) return null;

  const supabase = createServerClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  // Verifikasi kepemilikan: murid harus berada pada jadwal tutor ini.
  let membershipQuery = supabase
    .from("schedule_students")
    .select("student_id, schedules!inner (tutor_id)")
    .eq("schedules.tutor_id", user.tutorId);
  membershipQuery = isUuid
    ? membershipQuery.eq("student_id", id)
    : membershipQuery;

  const { data: membership, error: memErr } = await membershipQuery.limit(1).maybeSingle();
  if (memErr || !membership) return null;

  const studentQuery = supabase.from("students").select(TUTOR_STUDENT_SELECT);
  const { data, error } = await (isUuid
    ? studentQuery.eq("id", id).maybeSingle()
    : studentQuery.eq("student_code", id).maybeSingle());

  if (error || !data) return null;
  return mapRow(data);
});

export async function getStudentProgressData(studentId: string) {
  return StudentProgressService.getStudentProgressAndHistory(studentId);
}
