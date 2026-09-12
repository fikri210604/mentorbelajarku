import TutorAttendancePage from "@/features/tutor/attendance/components/TutorAttendancePage";
import { getSessions } from "@/features/tutor/sessions/queries/session.queries";
import { requireAuthUser } from "@/lib/auth/session";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Presensi Kelas | Bimbel Belajarku",
};

export default async function Page() {
  const currentUser = await requireAuthUser();
  const sessions = await getSessions(currentUser.tutorId);
  return (
    <TutorAttendancePage
      todaySessions={sessions}
      currentUser={{
        id: currentUser.user.id,
        role: currentUser.role,
        tutorId: currentUser.tutorId,
      }}
    />
  );
}
