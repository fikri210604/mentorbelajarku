import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface LearningRecordWithDetails {
  id: string;
  attendance_id: string;
  tutor_id: string;
  student_id: string;
  material: string;
  notes: string | null;
  homework: string | null;
  created_at: string;
  students?: {
    id: string;
    student_code: string;
    name: string;
    school: string | null;
    grade: string | null;
  } | null;
  tutors?: {
    id: string;
    profiles?: {
      full_name: string;
    } | null;
  } | null;
  attendance?: {
    id: string;
    status: string;
    photo_path: string | null;
    sessions?: {
      id: string;
      session_date: string;
      start_time: string;
      end_time: string;
      programs?: {
        name: string;
      } | null;
      bimbel_types?: {
        name: string;
      } | null;
    } | null;
  } | null;
}

export async function getLearningRecords(options: {
  studentId?: string;
  tutorId?: string;
  limit?: number;
} = {}): Promise<LearningRecordWithDetails[]> {
  const supabase = createServerSupabaseClient();
  const limit = options.limit || 100;

  try {
    let query = supabase
      .from("learning_records")
      .select(`
        id,
        attendance_id,
        tutor_id,
        student_id,
        material,
        notes,
        homework,
        created_at,
        students (
          id,
          student_code,
          name,
          school,
          grade
        ),
        tutors (
          id,
          profiles (
            full_name
          )
        ),
        attendance (
          id,
          status,
          photo_path,
          sessions (
            id,
            session_date,
            start_time,
            end_time,
            programs (
              name
            ),
            bimbel_types (
              name
            )
          )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (options.studentId) {
      query = query.eq("student_id", options.studentId);
    }

    if (options.tutorId) {
      query = query.eq("tutor_id", options.tutorId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("getLearningRecords error:", error);
      return [];
    }

    return (data || []) as unknown as LearningRecordWithDetails[];
  } catch (err) {
    console.warn("getLearningRecords exception:", err);
    return [];
  }
}
