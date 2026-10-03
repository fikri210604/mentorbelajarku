import TutorPayrollPage from "@/features/tutor/payroll/components/TutorPayrollPage";
import {
  getTutorPayrolls,
  getTutorSessionEarnings,
} from "@/features/tutor/payroll/queries/payroll.queries";
import { requireAuthUser } from "@/lib/auth/session";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Honor Saya | Bimbel Belajarku",
};

export default async function Page() {
  const currentUser = await requireAuthUser();
  // Tutor hanya boleh melihat honor miliknya sendiri; akun tanpa tutorId fail closed.
  const [payrolls, history] = currentUser.tutorId
    ? await Promise.all([
        getTutorPayrolls(currentUser.tutorId),
        getTutorSessionEarnings(currentUser.tutorId),
      ])
    : [[], []];
  return <TutorPayrollPage initialPayrolls={payrolls} history={history} />;
}
