import { cache } from "react";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { signAttendancePhotoPath } from "@/lib/storage";
import type { ScheduleWithDetails } from "../types";
import type { Tables } from "@/types/database";

export interface TutorAttendanceWithPhoto extends Tables<"attendance"> {
  students?: Pick<Tables<"students">, "id" | "student_code" | "name"> | null;
  learning_records?: Array<{ material: string | null; notes: string | null }> | null;
  photo_url?: string | null;
}

export interface TutorScheduleSessionItem extends Tables<"sessions"> {
  attendance?: TutorAttendanceWithPhoto[];
}

export interface TutorScheduleDetailResult {
  schedule: ScheduleWithDetails | null;
  sessions: TutorScheduleSessionItem[];
  forbidden?: boolean;
}

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

const SCHEDULE_SELECT = `
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

const SESSION_SELECT = `
  id,
  schedule_id,
  tutor_id,
  program_id,
  bimbel_type_id,
  session_date,
  start_time,
  end_time,
  status,
  notes,
  created_at,
  updated_at,
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
    verified_at,
    created_at,
    students (
      id,
      student_code,
      name
    )
  )
`;

/**
 * Mengambil detail satu jadwal milik tutor yang sedang login beserta
 * seluruh sesi (session) yang lahir dari jadwal tersebut dan
 * absensi + bukti foto tiap sesi.
 *
 * Authorization (fail closed):
 * - Wajib terautentikasi & memiliki mapping tutorId.
 * - Schedule hanya dikembalikan bila `schedules.tutor_id = tutorId`.
 * - Session hanya diambil bila `sessions.schedule_id = scheduleId`
 *   dan schedule tersebut milik tutor (seconds check via schedule.tutor_id).
 * - Photo URL dibuat via signed URL server-side (bucket privat),
 *   bukan URL publik.
 */
export const getTutorScheduleDetail = cache(
  async (scheduleId: string): Promise<TutorScheduleDetailResult> => {
    if (!isSupabaseConfigured() || !isUuid(scheduleId)) {
      return { schedule: null, sessions: [] };
    }

    const user = await getCurrentUser();
    if (!user || !user.tutorId) {
      return { schedule: null, sessions: [], forbidden: true };
    }

    const supabase = createServerClient();

    // 1. Schedule milik tutor ini saja (anti-IDOR).
    const { data: scheduleRow, error: scheduleErr } = await supabase
      .from("schedules")
      .select(SCHEDULE_SELECT)
      .eq("id", scheduleId)
      .eq("tutor_id", user.tutorId)
      .maybeSingle();

    if (scheduleErr || !scheduleRow) {
      return { schedule: null, sessions: [] };
    }

    const row = scheduleRow as unknown as ScheduleWithDetails & {
      schedule_students?: Array<{ students?: { name?: string } | null }>;
    };
    const studentNames = (row.schedule_students || [])
      .map((ss) => ss.students?.name)
      .filter((n): n is string => Boolean(n));

    const schedule: ScheduleWithDetails = {
      ...row,
      student_names: studentNames,
      total_students: studentNames.length,
    } as unknown as ScheduleWithDetails;

    // 2. Sessions dari schedule ini (terbaru dulu).
    const { data: sessionRows, error: sessionErr } = await supabase
      .from("sessions")
      .select(SESSION_SELECT)
      .eq("schedule_id", scheduleId)
      .order("session_date", { ascending: false })
      .order("start_time", { ascending: false });

    if (sessionErr || !sessionRows) {
      return { schedule, sessions: [] };
    }

    const sessions = sessionRows as unknown as TutorScheduleSessionItem[];

    // 2b. Materi dari learning_records (attendance -> learning_records via attendance_id).
    const allAttendance = sessions.flatMap((s) => s.attendance || []);
    if (allAttendance.length > 0) {
      const attendanceIds = allAttendance.map((a) => a.id);
      const { data: lrRows } = await supabase
        .from("learning_records")
        .select("attendance_id, material, notes")
        .in("attendance_id", attendanceIds);
      const lrByAttendance = new Map<string, { material: string | null; notes: string | null }[]>();
      for (const lr of (lrRows || []) as Array<{ attendance_id: string; material: string | null; notes: string | null }>) {
        const list = lrByAttendance.get(lr.attendance_id) || [];
        list.push({ material: lr.material, notes: lr.notes });
        lrByAttendance.set(lr.attendance_id, list);
      }
      for (const att of allAttendance) {
        att.learning_records = lrByAttendance.get(att.id) || null;
      }
    }

    // 3. Tandatangani setiap photo_path (bucket privat, expiry 1 jam).
    await Promise.all(
      sessions.flatMap((s) => s.attendance || []).map(async (att) => {
        if (att.photo_path) {
          try {
            att.photo_url = await signAttendancePhotoPath(att.photo_path);
          } catch {
            att.photo_url = null;
          }
        } else {
          att.photo_url = null;
        }
      })
    );

    return { schedule, sessions };
  }
);
