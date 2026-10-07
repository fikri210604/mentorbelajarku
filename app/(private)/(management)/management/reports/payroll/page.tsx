import PayrollReportPage from "@/features/management/reports/components/PayrollReportPage";
import { ReportService } from "@/features/management/reports/services/report.service";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laporan Penggajian | Bimbel Belajarku",
};

export default async function Page() {
  const data = await ReportService.getPayrollSummary();
  return <PayrollReportPage initialData={data} />;
}
