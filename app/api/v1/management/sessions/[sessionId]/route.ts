import { NextRequest, NextResponse } from "next/server";
import { getSessionById } from "@/features/management/sessions/queries/session.queries";
import { updateSessionStatus } from "@/features/management/sessions/actions/session.actions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const session = await getSessionById(sessionId);
  if (!session) {
    return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: session });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  try {
    const { status } = await req.json();
    const result = await updateSessionStatus(sessionId, status);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
