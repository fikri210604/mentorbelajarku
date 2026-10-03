import { NextRequest, NextResponse } from "next/server";
import { getTutorById } from "@/features/management/tutors/queries/tutor.queries";
import { updateTutorStatus } from "@/features/management/tutors/actions/tutor.actions";
import { requireManagementApi } from "@/lib/auth/guards";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tutorId: string }> }
) {
  const guard = await requireManagementApi("tutor:read");
  if (!guard.ok) return guard.response;

  const { tutorId } = await params;
  const tutor = await getTutorById(tutorId);
  if (!tutor) {
    return NextResponse.json({ success: false, error: "Tutor tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: tutor });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tutorId: string }> }
) {
  const guard = await requireManagementApi("tutor:update");
  if (!guard.ok) return guard.response;

  const { tutorId } = await params;
  try {
    const { status } = await req.json();
    const result = await updateTutorStatus(tutorId, status);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: getSafeErrorMessage(err, "Gagal memperbarui status tutor.") },
      { status: 500 }
    );
  }
}
