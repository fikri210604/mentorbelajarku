import StudentReportPage from "@/features/management/reports/components/StudentReportPage";
import { ReportService } from "@/features/management/reports/services/report.service";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laporan Murid | Bimbel Belajarku",
};

export default async function Page() {
  const data = await ReportService.getStudentReport();
  return <StudentReportPage initialData={data} />;
}
