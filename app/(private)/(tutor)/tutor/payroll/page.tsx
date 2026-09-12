import TutorPayrollPage from "@/features/tutor/payroll/components/TutorPayrollPage";
import { getPayrolls } from "@/features/tutor/payroll/queries/payroll.queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Honor Saya | Bimbel Belajarku",
};

export default async function Page() {
  const payrolls = await getPayrolls();
  return <TutorPayrollPage initialPayrolls={payrolls} />;
}
