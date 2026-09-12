import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ rateId: string }> }
) {
  const { rateId } = await params;
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tutor_rates")
    .select("*, tutors (*, profiles (*)), bimbel_types (*)")
    .eq("id", rateId)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Tutor rate not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data });
}
