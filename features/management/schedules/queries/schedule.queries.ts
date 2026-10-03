import { cache } from "react";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ScheduleWithDetails } from "../types";

/**
 * Selective column projections untuk data jadwal pembelajaran.
 */
const SCHEDULE_SELECT_COLUMNS = `
  id,
  tutor_id,
  program_id,
  bimbel_type_id,
  day_of_week,
  start_time,
  end_time,
  location,
  notes,
  status,
  created_at,
  updated_at,
  tutors (
    id,
    profile_id,
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
  schedule_students (
    id,
    schedule_id,
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
`;

function mapScheduleItem(item: unknown): ScheduleWithDetails {
  const row = item as {
    schedule_students?: Array<{ students?: { name?: string } | null }>;
  };
  const studentList = (row.schedule_students || [])
    .map((ss) => ss.students?.name)
    .filter((n): n is string => Boolean(n));

  return {
    ...row,
    student_names: studentList,
    total_students: studentList.length,
  } as unknown as ScheduleWithDetails;
}

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export const getSchedules = cache(async (): Promise<ScheduleWithDetails[]> => {
  if (!isSupabaseConfigured()) return [];

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("schedules")
    .select(SCHEDULE_SELECT_COLUMNS)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("getSchedules error:", error.message);
    return [];
  }
  return (data || []).map(mapScheduleItem);
});

export const getScheduleById = cache(async (id: string): Promise<ScheduleWithDetails | null> => {
  if (!isSupabaseConfigured() || !isUuid(id)) return null;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("schedules")
    .select(SCHEDULE_SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapScheduleItem(data);
});

export const getTutorSchedules = cache(async (tutorId: string): Promise<ScheduleWithDetails[]> => {
  if (!isSupabaseConfigured() || !isUuid(tutorId)) return [];

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("schedules")
    .select(SCHEDULE_SELECT_COLUMNS)
    .eq("tutor_id", tutorId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("getTutorSchedules error:", error.message);
    return [];
  }
  return (data || []).map(mapScheduleItem);
});
