import TutorReportPage from "@/features/management/reports/components/TutorReportPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laporan Tutor | Bimbel Belajarku",
};

export default function Page() {
  return <TutorReportPage />;
}
