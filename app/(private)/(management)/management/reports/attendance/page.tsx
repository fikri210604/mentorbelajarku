import AttendanceReportPage from "@/features/management/reports/components/AttendanceReportPage";
import { ReportService } from "@/features/management/reports/services/report.service";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laporan Presensi | Bimbel Belajarku",
};

export default async function Page() {
  const data = await ReportService.getAttendanceSummary();
  return <AttendanceReportPage initialData={data} />;
}
