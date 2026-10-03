import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface AuditLogItem {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, any>;
  created_at: string;
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

export async function getAuditLogs(options: {
  action?: string;
  entityType?: string;
  limit?: number;
} = {}): Promise<AuditLogItem[]> {
  const supabase = createServerSupabaseClient();
  const limit = options.limit || 100;

  try {
    let query = supabase
      .from("audit_logs")
      .select(`
        id,
        user_id,
        action,
        entity_type,
        entity_id,
        metadata,
        created_at,
        user:user_id (
          name,
          email,
          role
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (options.action) {
      query = query.eq("action", options.action);
    }

    if (options.entityType) {
      query = query.eq("entity_type", options.entityType);
    }

    const { data, error } = await query;

    if (error) {
      // Fallback tanpa relasi jika postgREST schema cache belum refresh relasi user
      const { data: rawLogs, error: rawErr } = await supabase
        .from("audit_logs")
        .select("id, user_id, action, entity_type, entity_id, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (rawErr || !rawLogs) return [];
      return rawLogs.map((l: any) => ({
        ...l,
        user: { name: l.user_id || "Sistem", email: null, role: null },
      }));
    }

    return (data || []) as unknown as AuditLogItem[];
  } catch (err) {
    console.warn("Error in getAuditLogs:", err);
    return [];
  }
}
