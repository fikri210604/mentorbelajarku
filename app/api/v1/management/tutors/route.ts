import { NextResponse } from "next/server";
import { getTutors } from "@/features/management/tutors/queries/tutor.queries";

export async function GET() {
  const tutors = await getTutors();
  return NextResponse.json({ success: true, data: tutors });
}
