import TutorReportPage from "@/features/management/reports/components/TutorReportPage";
import { ReportService } from "@/features/management/reports/services/report.service";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laporan Tutor | Bimbel Belajarku",
};

export default async function Page() {
  const data = await ReportService.getTutorReport();
  return <TutorReportPage initialData={data} />;
}
