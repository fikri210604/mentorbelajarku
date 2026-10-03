import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { StudentProgressService } from "@/features/shared/students/services/student-progress.service";
import { createPaginatedResult, PaginatedResult, PaginationParams } from "@/lib/traits/response.trait";
import { STUDENTS_CACHE_TAG } from "@/lib/cache/tags";
import { StudentWithPrograms } from "../types";

/**
 * Selective column projections untuk data murid.
 * Menghindari SELECT * dan subquery berat untuk memastikan query cepat dan hemat bandwidth.
 */
const STUDENT_SELECT_COLUMNS = `
  id,
  student_code,
  name,
  gender,
  birth_date,
  avatar_url,
  school,
  grade,
  level,
  status,
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
    )
  )
`;

function mapStudentData(item: unknown): StudentWithPrograms {
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
 * Daftar seluruh murid beserta paket belajarnya.
 * Di-cache lintas request dengan tag `students` (default 5 menit) agar
 * perpindahan halaman berulang tidak menabrak database setiap kali.
 * Cache di-invalidasi lewat `revalidateTag(STUDENTS_CACHE_TAG)` pada setiap
 * mutation murid.
 */
export const getStudents = unstable_cache(
  async (): Promise<StudentWithPrograms[]> => {
    if (!isSupabaseConfigured()) return [];

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("students")
      .select(STUDENT_SELECT_COLUMNS)
      .order("student_code", { ascending: true });

    if (error) {
      console.error("getStudents error:", error.message);
      return [];
    }
    return (data || []).map(mapStudentData);
  },
  ["students:list"],
  { tags: [STUDENTS_CACHE_TAG], revalidate: 300 }
);

/**
 * Mengambil data murid dengan paginasi server.
 */
export async function getStudentsPaginated(
  params: PaginationParams = {}
): Promise<PaginatedResult<StudentWithPrograms>> {
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (!isSupabaseConfigured()) {
    return createPaginatedResult([], 0, page, pageSize);
  }

  const supabase = createServerClient();
  let query = supabase
    .from("students")
    .select(STUDENT_SELECT_COLUMNS, { count: "exact" })
    .order("student_code", { ascending: params.sortOrder !== "desc" })
    .range(from, to);

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status as "active" | "inactive" | "graduated");
  }

  if (params.search && params.search.trim()) {
    const term = params.search.trim().replace(/[%_]/g, (m) => `\\${m}`);
    query = query.or(
      `name.ilike.%${term}%,student_code.ilike.%${term}%,school.ilike.%${term}%`
    );
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("getStudentsPaginated error:", error.message);
    return createPaginatedResult([], 0, page, pageSize);
  }

  const mappedItems = (data || []).map(mapStudentData);
  return createPaginatedResult(mappedItems, count ?? mappedItems.length, page, pageSize);
}

export const getStudentById = cache(async (id: string): Promise<StudentWithPrograms | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = createServerClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const query = supabase.from("students").select(STUDENT_SELECT_COLUMNS);
  const { data, error } = await (isUuid
    ? query.eq("id", id).maybeSingle()
    : query.eq("student_code", id).maybeSingle());

  if (error || !data) return null;
  return mapStudentData(data);
});

export const getStudentHistory = cache(async (studentId: string) => {
  const result = await StudentProgressService.getStudentProgressAndHistory(studentId);
  return result.history;
});

export const getStudentProgressData = cache(async (studentId: string) => {
  return StudentProgressService.getStudentProgressAndHistory(studentId);
});
