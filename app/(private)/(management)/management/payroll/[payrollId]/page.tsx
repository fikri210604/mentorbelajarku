import PayrollDetailPage from "@/features/management/payroll/components/PayrollDetailPage";
import { getPayrollById } from "@/features/management/payroll/queries/payroll.queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rincian Payroll | Bimbel Belajarku",
};

export default async function Page({
  params,
}: {
  params: Promise<{ payrollId: string }>;
}) {
  const { payrollId } = await params;
  const payroll = await getPayrollById(payrollId);

  return <PayrollDetailPage payroll={payroll} />;
}
