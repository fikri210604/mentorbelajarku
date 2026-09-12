import AttendanceListPage from "@/features/management/attendance/components/AttendanceListPage";
import { getAttendances } from "@/features/management/attendance/queries/attendance.queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Presensi Murid | Bimbel Belajarku",
};

export default async function Page() {
  const attendances = await getAttendances();
  return <AttendanceListPage initialAttendances={attendances} />;
}
