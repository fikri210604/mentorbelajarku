import AttendanceDetailPage from "@/features/tutor/attendance/components/AttendanceDetailPage";
import { getAttendanceById } from "@/features/tutor/attendance/queries/attendance.queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail Presensi | Bimbel Belajarku",
};

export default async function Page({
  params,
}: {
  params: Promise<{ attendanceId: string }>;
}) {
  const { attendanceId } = await params;
  const attendance = await getAttendanceById(attendanceId);

  return <AttendanceDetailPage attendance={attendance} isTutor />;
}
