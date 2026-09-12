import { NextRequest, NextResponse } from "next/server";
import { getTutorById } from "@/features/management/tutors/queries/tutor.queries";
import { updateTutorStatus } from "@/features/management/tutors/actions/tutor.actions";
import { getAuthUser } from "@/lib/auth/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tutorId: string }> }
) {
  const { tutorId } = await params;
  const tutor = await getTutorById(tutorId);
  if (!tutor) {
    return NextResponse.json({ success: false, error: "Tutor not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: tutor });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tutorId: string }> }
) {
  const user = await getAuthUser();
  if (!user || (user.role !== "management" && user.role !== "admin")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { tutorId } = await params;
  try {
    const { status } = await req.json();
    const result = await updateTutorStatus(tutorId, status);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
