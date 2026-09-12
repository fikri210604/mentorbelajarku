import StudentReportPage from "@/features/management/reports/components/StudentReportPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laporan Murid | Bimbel Belajarku",
};

export default function Page() {
  return <StudentReportPage />;
}
