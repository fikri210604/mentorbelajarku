import TutorAttendancePage from "@/features/tutor/attendance/components/TutorAttendancePage";
import { getSessions } from "@/features/tutor/sessions/queries/session.queries";
import { requireAuthUser } from "@/lib/auth/session";
import { getTutorSessionEarnings } from "@/features/tutor/payroll/queries/payroll.queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Presensi Kelas | Bimbel Belajarku",
};

export default async function Page() {
  const currentUser = await requireAuthUser();
  const [sessions, history] = await Promise.all([
    getSessions(currentUser.tutorId),
    currentUser.tutorId ? getTutorSessionEarnings(currentUser.tutorId) : Promise.resolve([]),
  ]);
  return (
    <TutorAttendancePage
      todaySessions={sessions}
      history={history}
      tutorName={currentUser.profile?.full_name || currentUser.user.name || ""}
    />
  );
}
