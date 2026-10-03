import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requirePermissionApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export async function GET() {
  const guard = await requirePermissionApi("audit:read");
  if (!guard.ok) return guard.response;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, user_id, action, entity_type, entity_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(error, "Gagal mengambil audit log.") },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true, data });
}
