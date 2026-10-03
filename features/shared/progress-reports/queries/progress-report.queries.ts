import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface ProgressReportWithDetails {
  id: string;
  student_id: string;
  enrollment_id: string | null;
  tutor_id: string | null;
  period_title: string;
  achievement: string;
  evaluation: string;
  notes: string | null;
  created_at: string;
  students?: {
    id: string;
    student_code: string;
    name: string;
    school: string | null;
    grade: string | null;
    parent_name: string | null;
    parent_phone: string | null;
  } | null;
  tutors?: {
    id: string;
    profiles?: {
      full_name: string;
    } | null;
  } | null;
  enrollments?: {
    package_name: string;
    programs?: {
      name: string;
    } | null;
    bimbel_types?: {
      name: string;
    } | null;
  } | null;
}

export async function getProgressReports(options: {
  studentId?: string;
  tutorId?: string;
  limit?: number;
} = {}): Promise<ProgressReportWithDetails[]> {
  const supabase = createServerSupabaseClient();
  const limit = options.limit || 100;

  try {
    let query = supabase
      .from("progress_reports")
      .select(`
        id,
        student_id,
        enrollment_id,
        tutor_id,
        period_title,
        achievement,
        evaluation,
        notes,
        created_at,
        students (
          id,
          student_code,
          name,
          school,
          grade,
          parent_name,
          parent_phone
        ),
        tutors (
          id,
          profiles (
            full_name
          )
        ),
        enrollments (
          package_name,
          programs (
            name
          ),
          bimbel_types (
            name
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
      console.warn("getProgressReports error:", error);
      return [];
    }

    return (data || []) as unknown as ProgressReportWithDetails[];
  } catch (err) {
    console.warn("getProgressReports exception:", err);
    return [];
  }
}
