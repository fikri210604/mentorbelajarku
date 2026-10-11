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
  gender,
  created_at,
  updated_at,
  profiles (
    id,
    user_id,
    full_name,
    phone,
    gender,
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

/**
 * Memperkaya objek tutor dengan email login dari tabel "user".
 */
async function attachUserEmails(
  supabase: ReturnType<typeof createServerClient>,
  tutors: TutorWithProfile[]
): Promise<TutorWithProfile[]> {
  const userIds = Array.from(
    new Set(
      tutors
        .map((t) => t.profiles?.user_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  if (userIds.length === 0) return tutors;

  const { data: users, error } = await supabase
    .from("user")
    .select("id, email")
    .in("id", userIds);

  if (error || !users) return tutors;

  const emailByUserId = new Map(users.map((u) => [u.id, u.email]));

  return tutors.map((t) => {
    if (t.profiles && t.profiles.user_id) {
      const email = emailByUserId.get(t.profiles.user_id) || null;
      return {
        ...t,
        profiles: {
          ...t.profiles,
          email,
        },
      };
    }
    return t;
  });
}

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
  const items = (data as unknown as TutorWithProfile[]) || [];
  return attachUserEmails(supabase, items);
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
  const enrichedItems = await attachUserEmails(supabase, items);
  return createPaginatedResult(enrichedItems, count ?? items.length, page, pageSize);
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
  const items = await attachUserEmails(supabase, [data as unknown as TutorWithProfile]);
  return items[0] || null;
});
