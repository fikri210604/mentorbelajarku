import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const supabase = createServerClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("class_group_id")
    .eq("id", sessionId)
    .single();

  if (session?.class_group_id) {
    const { data: members, error } = await supabase
      .from("class_group_members")
      .select("*, students (*)")
      .eq("class_group_id", session.class_group_id);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data: members?.map((m) => m.students) });
  }

  return NextResponse.json({ success: true, data: [] });
}
