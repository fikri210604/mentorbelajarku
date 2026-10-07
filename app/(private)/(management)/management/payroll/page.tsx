import PayrollListPage from "@/features/management/payroll/components/PayrollListPage";
import { getPayrolls } from "@/features/management/payroll/queries/payroll.queries";
import { getTutors } from "@/features/management/tutors/queries/tutor.queries";
import {
  getPayrollSheetMonths,
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
  searchParams: Promise<{ tutorId?: string; month?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  await requireAuthUser();

  const resolved = (await searchParams) ?? {};
  const currentMonth = toMonthKey(new Date());
  const month = /^\d{4}-\d{2}$/.test(resolved.month ?? "")
    ? (resolved.month as string)
    : currentMonth;

  const [payrolls, tutors] = await Promise.all([getPayrolls(), getTutors()]);

  const tutorOptions = tutors.map((t) => ({
    id: t.id,
    name: t.profiles?.full_name || "Tutor",
  }));

  const selectedTutorId =
    resolved.tutorId && tutorOptions.some((t) => t.id === resolved.tutorId)
      ? resolved.tutorId
      : tutorOptions[0]?.id;

  const selectedTutor = tutorOptions.find((t) => t.id === selectedTutorId);

  const [sheetRows, sheetMonths, honorSummary] = selectedTutorId
    ? await Promise.all([
        getTutorMonthlyInvoiceRows(selectedTutorId, month),
        getPayrollSheetMonths(tutorOptions.map((t) => t.id)),
        getTutorHonorSummary(selectedTutorId, month),
      ])
    : [[], [currentMonth], null];

  return (
    <PayrollListPage
      initialPayrolls={payrolls}
      sheetRows={sheetRows}
      sheetMonth={month}
      sheetMonths={sheetMonths}
      honorSummary={honorSummary}
      tutorName={selectedTutor?.name || ""}
      tutors={tutorOptions}
      selectedTutorId={selectedTutorId}
    />
  );
}
