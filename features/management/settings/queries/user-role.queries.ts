import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  roleId: string | null;
  roleName: string | null;
  portalRole: string;
}

interface ManagedUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  role_id: string | null;
}

/**
 * Daftar user beserta role dinamis yang sedang melekat (dari database).
 */
export async function getManagedUsers(): Promise<ManagedUser[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createServerSupabaseClient();

  const [{ data: users, error: usersError }, { data: roles }] = await Promise.all([
    supabase
      .from("user")
      .select("id, name, email, role, role_id")
      .order("name", { ascending: true }),
    supabase.from("roles").select("id, name"),
  ]);

  if (usersError) {
    console.error("[getManagedUsers] Gagal memuat user:", usersError.message);
    return [];
  }

  const roleNameById = new Map<string, string>(
    ((roles ?? []) as { id: string; name: string }[]).map((r) => [r.id, r.name])
  );

  return ((users ?? []) as unknown as ManagedUserRow[]).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    roleId: u.role_id ?? null,
    roleName: u.role_id ? roleNameById.get(u.role_id) ?? u.role : u.role,
    portalRole: u.role,
  }));
}
