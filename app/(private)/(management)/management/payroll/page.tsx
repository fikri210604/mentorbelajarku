import PayrollListPage from "@/features/management/payroll/components/PayrollListPage";
import { getPayrolls } from "@/features/management/payroll/queries/payroll.queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Honor & Payroll | Bimbel Belajarku",
};

export default async function Page() {
  const payrolls = await getPayrolls();
  return <PayrollListPage initialPayrolls={payrolls} />;
}
