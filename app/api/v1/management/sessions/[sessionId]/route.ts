import { NextRequest, NextResponse } from "next/server";
import { getSessionById } from "@/features/management/sessions/queries/session.queries";
import { updateSessionStatus } from "@/features/management/sessions/actions/session.actions";
import { requireManagementApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const guard = await requireManagementApi("session:read");
  if (!guard.ok) return guard.response;

  const { sessionId } = await params;
  const session = await getSessionById(sessionId);
  if (!session) {
    return NextResponse.json({ success: false, error: "Sesi tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: session });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const guard = await requireManagementApi("session:update");
  if (!guard.ok) return guard.response;

  const { sessionId } = await params;
  try {
    const { status } = await req.json();
    const result = await updateSessionStatus(sessionId, status);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(err, "Gagal memperbarui status sesi.") },
      { status: 500 }
    );
  }
}
