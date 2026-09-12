import { createServerClient } from "@/lib/supabase/server";
import { ScheduleWithDetails } from "../types";

export async function getSchedules(): Promise<ScheduleWithDetails[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("schedules")
    .select(`
      *,
      tutors (*, profiles (*)),
      programs (*),
      bimbel_types (*),
      schedule_students (
        *,
        students (*)
      )
    `)
    .order("day_of_week", { ascending: true });

  if (error) {
    console.error("Error fetching schedules:", error);
    return [];
  }

  return ((data as any[]) || []).map((item) => {
    const studentList = (item.schedule_students || [])
      .map((ss: any) => ss.students?.name)
      .filter(Boolean);
    return {
      ...item,
      student_names: studentList,
      students: item.schedule_students?.[0]?.students || null,
    };
  }) as unknown as ScheduleWithDetails[];
}

export async function getScheduleById(id: string): Promise<ScheduleWithDetails | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("schedules")
    .select(`
      *,
      tutors (*, profiles (*)),
      programs (*),
      bimbel_types (*),
      schedule_students (
        *,
        students (*)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const item: any = data;
  const studentList = (item.schedule_students || [])
    .map((ss: any) => ss.students?.name)
    .filter(Boolean);

  return {
    ...item,
    student_names: studentList,
    students: item.schedule_students?.[0]?.students || null,
  } as unknown as ScheduleWithDetails;
}

export async function getTutorSchedules(tutorId: string): Promise<ScheduleWithDetails[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("schedules")
    .select(`
      *,
      programs (*),
      bimbel_types (*),
      schedule_students (
        *,
        students (*)
      )
    `)
    .eq("tutor_id", tutorId)
    .order("day_of_week", { ascending: true });

  if (error) {
    console.error("Error fetching tutor schedules:", error);
    return [];
  }

  return ((data as any[]) || []).map((item) => {
    const studentList = (item.schedule_students || [])
      .map((ss: any) => ss.students?.name)
      .filter(Boolean);
    return {
      ...item,
      student_names: studentList,
      students: item.schedule_students?.[0]?.students || null,
    };
  }) as unknown as ScheduleWithDetails[];
}
