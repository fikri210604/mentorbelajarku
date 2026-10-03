import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireManagementApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export async function GET() {
  const guard = await requireManagementApi();
  if (!guard.ok) return guard.response;

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("bimbel_types")
      .select("id, name, duration_minutes, description, status")
      .order("duration_minutes");

    if (error) {
      return NextResponse.json(
        { success: false, error: getSafeErrorMessage(error, "Gagal mengambil data jenis bimbel.") },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(err, "Gagal mengambil data jenis bimbel.") },
      { status: 500 }
    );
  }
}
