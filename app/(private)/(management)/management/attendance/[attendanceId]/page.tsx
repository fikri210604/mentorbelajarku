import AttendanceDetailPage from "@/features/management/attendance/components/AttendanceDetailPage";
import { getAttendanceById } from "@/features/management/attendance/queries/attendance.queries";
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

  return <AttendanceDetailPage attendance={attendance} />;
}
