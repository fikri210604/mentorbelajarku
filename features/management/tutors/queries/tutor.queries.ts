import { cache } from "react";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createPaginatedResult, PaginatedResult, PaginationParams } from "@/lib/traits/response.trait";
import { TutorWithProfile } from "../types";

/**
 * Selective columns projection untuk data tutor dan profilnya.
 */
const TUTOR_SELECT_COLUMNS = `
  id,
  profile_id,
  bio,
  status,
  created_at,
  updated_at,
  profiles (
    id,
    user_id,
    full_name,
    phone,
    avatar_url
  ),
  tutor_rates (
    id,
    tutor_id,
    bimbel_type_id,
    rate_per_student,
    level,
    effective_from,
    effective_until,
    bimbel_types (
      id,
      name,
      duration_minutes
    )
  )
`;

export const getTutors = cache(async (): Promise<TutorWithProfile[]> => {
  if (!isSupabaseConfigured()) return [];

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tutors")
    .select(TUTOR_SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getTutors error:", error.message);
    return [];
  }
  return (data as unknown as TutorWithProfile[]) || [];
});

/**
 * Mengambil data tutor dengan paginasi server.
 */
export async function getTutorsPaginated(
  params: PaginationParams = {}
): Promise<PaginatedResult<TutorWithProfile>> {
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (!isSupabaseConfigured()) {
    return createPaginatedResult([], 0, page, pageSize);
  }

  const supabase = createServerClient();
  let query = supabase
    .from("tutors")
    .select(TUTOR_SELECT_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: params.sortOrder !== "asc" })
    .range(from, to);

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status as "active" | "inactive");
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("getTutorsPaginated error:", error.message);
    return createPaginatedResult([], 0, page, pageSize);
  }

  const items = (data as unknown as TutorWithProfile[]) || [];
  return createPaginatedResult(items, count ?? items.length, page, pageSize);
}

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export const getTutorById = cache(async (id: string): Promise<TutorWithProfile | null> => {
  if (!isSupabaseConfigured() || !isUuid(id)) return null;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tutors")
    .select(TUTOR_SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as TutorWithProfile;
});
