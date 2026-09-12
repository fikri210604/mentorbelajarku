import { createServerClient } from "@/lib/supabase/server";
import { SYNTHETIC_SCHEDULES } from "@/data/schedules";
import { ScheduleWithDetails } from "../types";

function mapSyntheticToScheduleWithDetails(s: (typeof SYNTHETIC_SCHEDULES)[0]): ScheduleWithDetails {
  const studentName = s.student_name || null;
  const isGroup = !!s.class_group_name;

  return {
    id: s.id,
    tutor_id: s.tutor_id,
    program_id: s.program_id,
    bimbel_type_id: s.bimbel_type_id,
    student_id: s.student_id || null,
    class_group_id: null,
    day_of_week: s.day_of_week,
    start_time: s.start_time,
    end_time: s.end_time,
    location: null,
    notes: s.class_group_name || null,
    status: s.status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tutors: {
      id: s.tutor_id,
      profile_id: `prof-${s.tutor_id}`,
      bio: null,
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
        must_change_password: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
    programs: {
      id: s.program_id,
      code: s.program_name.toLowerCase().replace(/\s+/g, "-"),
      name: s.program_name,
      level: "Umum",
      description: null,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    bimbel_types: {
      id: s.bimbel_type_id,
      name: s.bimbel_type_name,
      duration_minutes: s.duration_minutes,
      description: null,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    students: studentName
      ? ({
          id: s.student_id || "std-001",
          name: studentName,
          student_code: s.student_code || "STD-001",
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
        } as any)
      : null,
    schedule_students: studentName
      ? [
          {
            id: `sch-st-${s.id}`,
            schedule_id: s.id,
            student_id: s.student_id || "std-001",
            enrollment_id: null,
            created_at: new Date().toISOString(),
            students: {
              id: s.student_id || "std-001",
              name: studentName,
              student_code: s.student_code || "STD-001",
            } as any,
          },
        ]
      : [],
    student_names: studentName ? [studentName] : isGroup ? [s.class_group_name!] : [],
    total_students: studentName ? 1 : isGroup ? 4 : 0,
  } as unknown as ScheduleWithDetails;
}

export async function getSchedules(): Promise<ScheduleWithDetails[]> {
  try {
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
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((item: any) => {
        const studentList = (item.schedule_students || [])
          .map((ss: any) => ss.students?.name)
          .filter(Boolean);

        return {
          ...item,
          student_names: studentList,
          total_students: studentList.length,
        };
      }) as unknown as ScheduleWithDetails[];
    }
  } catch (err) {
    console.warn("getSchedules Supabase query fallback to synthetic:", err);
  }

  return SYNTHETIC_SCHEDULES.map(mapSyntheticToScheduleWithDetails);
}

export async function getScheduleById(id: string): Promise<ScheduleWithDetails | null> {
  try {
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

    if (!error && data) {
      const studentList = ((data as any).schedule_students || [])
        .map((ss: any) => ss.students?.name)
        .filter(Boolean);

      return {
        ...(data as any),
        student_names: studentList,
        total_students: studentList.length,
      } as unknown as ScheduleWithDetails;
    }
  } catch (err) {
    console.warn("getScheduleById Supabase query fallback to synthetic:", err);
  }

  const found = SYNTHETIC_SCHEDULES.find((s) => s.id === id);
  return found ? mapSyntheticToScheduleWithDetails(found) : null;
}

export async function getTutorSchedules(tutorId: string): Promise<ScheduleWithDetails[]> {
  try {
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
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((item: any) => {
        const studentList = (item.schedule_students || [])
          .map((ss: any) => ss.students?.name)
          .filter(Boolean);

        return {
          ...item,
          student_names: studentList,
          total_students: studentList.length,
        };
      }) as unknown as ScheduleWithDetails[];
    }
  } catch (err) {
    console.warn("getTutorSchedules fallback to synthetic:", err);
  }

  const filtered = SYNTHETIC_SCHEDULES.filter((s) => s.tutor_id === tutorId);
  return filtered.map(mapSyntheticToScheduleWithDetails);
}
