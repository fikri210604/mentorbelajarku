import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { SYSTEM_PERMISSIONS } from "@/config/permissions";
import type { PermissionDefinition } from "@/types/auth";

/**
 * Katalog permission (master) untuk matriks hak akses.
 * Bersumber dari tabel `permissions`; fallback ke SYSTEM_PERMISSIONS saat DB belum aktif.
 */
export async function getPermissionsCatalog(): Promise<PermissionDefinition[]> {
  if (!isSupabaseConfigured()) {
    return SYSTEM_PERMISSIONS;
  }

  const supabase = createServerSupabaseClient();
  const db = supabase as any;

  const { data, error } = await db
    .from("permissions")
    .select("id, category, name, description")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) {
      console.warn("[getPermissionsCatalog] fallback ke SYSTEM_PERMISSIONS:", error.message);
    }
    return SYSTEM_PERMISSIONS;
  }

  return (data as PermissionDefinition[]).map((p) => ({
    id: p.id,
    category: p.category,
    name: p.name,
    description: p.description ?? null,
  }));
}
