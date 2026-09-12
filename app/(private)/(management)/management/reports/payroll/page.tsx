import PayrollReportPage from "@/features/management/reports/components/PayrollReportPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laporan Payroll | Bimbel Belajarku",
};

export default function Page() {
  return <PayrollReportPage />;
}
