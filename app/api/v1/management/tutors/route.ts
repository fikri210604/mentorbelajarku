import { NextResponse } from "next/server";
import { getTutors } from "@/features/management/tutors/queries/tutor.queries";
import { requireManagementApi } from "@/lib/auth/guards";

export async function GET() {
  const guard = await requireManagementApi("tutor:read");
  if (!guard.ok) return guard.response;

  const tutors = await getTutors();
  return NextResponse.json({ success: true, data: tutors });
}
