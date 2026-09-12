import AttendanceReportPage from "@/features/management/reports/components/AttendanceReportPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laporan Presensi | Bimbel Belajarku",
};

export default function Page() {
  return <AttendanceReportPage />;
}
