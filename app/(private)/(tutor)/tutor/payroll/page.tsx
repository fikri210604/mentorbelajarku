import TutorPayrollPage from "@/features/tutor/payroll/components/TutorPayrollPage";
import {
  getTutorPayrolls,
  getTutorSessionEarnings,
} from "@/features/tutor/payroll/queries/payroll.queries";
import {
  getTutorAttendanceMonths,
  getTutorHonorSummary,
  getTutorMonthlyInvoiceRows,
} from "@/features/shared/payroll/queries/payroll-sheet.queries";
import { toMonthKey } from "@/features/shared/payroll/utils";
import { requireAuthUser } from "@/lib/auth/session";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Penggajian | Bimbel Belajarku",
};

interface PageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const currentUser = await requireAuthUser();
  const resolved = (await searchParams) ?? {};
  const currentMonth = toMonthKey(new Date());
  const month = /^\d{4}-\d{2}$/.test(resolved.month ?? "")
    ? (resolved.month as string)
    : currentMonth;

  // Tutor hanya boleh melihat penggajian miliknya sendiri; akun tanpa tutorId fail closed.
  if (!currentUser.tutorId) {
    return (
      <TutorPayrollPage
        tutorName={currentUser.profile?.full_name || currentUser.user.name || ""}
      />
    );
  }

  const [payrolls, history, sheetRows, sheetMonths, honorSummary] = await Promise.all([
    getTutorPayrolls(currentUser.tutorId),
    getTutorSessionEarnings(currentUser.tutorId),
    getTutorMonthlyInvoiceRows(currentUser.tutorId, month),
    getTutorAttendanceMonths(currentUser.tutorId),
    getTutorHonorSummary(currentUser.tutorId, month),
  ]);

  return (
    <TutorPayrollPage
      initialPayrolls={payrolls}
      history={history}
      sheetRows={sheetRows}
      sheetMonth={month}
      sheetMonths={sheetMonths}
      honorSummary={honorSummary}
      tutorName={currentUser.profile?.full_name || currentUser.user.name || ""}
    />
  );
}
