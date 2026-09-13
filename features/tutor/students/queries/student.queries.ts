import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { SYNTHETIC_STUDENTS } from "@/data/students";
import { StudentProgressService } from "@/features/shared/students/services/student-progress.service";
import { StudentWithPrograms } from "../types";

export async function getStudents(): Promise<StudentWithPrograms[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("students")
        .select(`
          *,
          enrollments (
            *,
            programs (*),
            bimbel_types (*)
          )
        `)
        .order("student_code", { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          ...item,
          enrollments: item.enrollments || [],
          student_programs: (item.enrollments || []).map((e: any) => ({
            ...e,
            total_sessions: e.max_meetings,
          })),
        })) as unknown as StudentWithPrograms[];
      }
    } catch (err) {
      console.warn("tutor getStudents Supabase fallback:", err);
    }
  }

  // Fallback to synthetic students for tutor view
  return SYNTHETIC_STUDENTS.map((s) => ({
    id: s.id,
    student_code: s.student_code,
    name: s.name,
    gender: s.gender,
    birth_date: null,
    school: s.school,
    grade: s.grade,
    parent_name: s.parent_name,
    parent_phone: s.parent_phone,
    address: s.address,
    status: s.status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_programs: [
      {
        id: `enr-${s.id}`,
        student_id: s.id,
        program_id: "prg-001",
        bimbel_type_id: "bt-001",
        total_sessions: s.bimbel_type.toLowerCase().includes("intensif") ? 12 : 8,
        start_date: "2026-09-01",
        end_date: null,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        programs: {
          id: "prg-001",
          name: s.enrolled_program,
          description: null,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        bimbel_types: {
          id: "bt-001",
          name: s.bimbel_type,
          code: s.bimbel_type.toLowerCase(),
          duration_minutes: 75,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
    ],
  })) as unknown as StudentWithPrograms[];
}

export async function getStudentById(id: string): Promise<StudentWithPrograms | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("students")
        .select(`
          *,
          enrollments (
            *,
            programs (*),
            bimbel_types (*)
          )
        `)
        .eq("id", id)
        .single();

      if (!error && data) {
        const item: any = data;
        return {
          ...item,
          enrollments: item.enrollments || [],
          student_programs: (item.enrollments || []).map((e: any) => ({
            ...e,
            total_sessions: e.max_meetings,
          })),
        } as unknown as StudentWithPrograms;
      }
    } catch (err) {
      console.warn("tutor getStudentById Supabase fallback:", err);
    }
  }

  const found = SYNTHETIC_STUDENTS.find((s) => s.id === id || s.student_code === id);
  if (!found) return null;

  return {
    id: found.id,
    student_code: found.student_code,
    name: found.name,
    gender: found.gender,
    birth_date: null,
    school: found.school,
    grade: found.grade,
    parent_name: found.parent_name,
    parent_phone: found.parent_phone,
    address: found.address,
    status: found.status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_programs: [
      {
        id: `enr-${found.id}`,
        student_id: found.id,
        program_id: "prg-001",
        bimbel_type_id: "bt-001",
        total_sessions: found.bimbel_type.toLowerCase().includes("intensif") ? 12 : 8,
        start_date: "2026-09-01",
        end_date: null,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        programs: {
          id: "prg-001",
          name: found.enrolled_program,
          description: null,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        bimbel_types: {
          id: "bt-001",
          name: found.bimbel_type,
          code: found.bimbel_type.toLowerCase(),
          duration_minutes: 75,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
    ],
  } as unknown as StudentWithPrograms;
}

export async function getStudentProgressData(studentId: string) {
  return StudentProgressService.getStudentProgressAndHistory(studentId);
}
