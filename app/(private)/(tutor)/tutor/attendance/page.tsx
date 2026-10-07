import TutorAttendancePage from "@/features/tutor/attendance/components/TutorAttendancePage";
import { getSessions } from "@/features/tutor/sessions/queries/session.queries";
import { requireAuthUser } from "@/lib/auth/session";
import { getTutorSessionEarnings } from "@/features/tutor/payroll/queries/payroll.queries";
import { SessionGeneratorService } from "@/features/shared/sessions/services/session-generator.service";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Presensi Kelas | Bimbel Belajarku",
};

export default async function Page() {
  const currentUser = await requireAuthUser();

  // Otomatis pastikan sesi hari ini dibuat dari jadwal aktif tutor jika belum ada
  if (currentUser.tutorId) {
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    try {
      await SessionGeneratorService.generateSessions({
        targetDate: todayStr,
        tutorId: currentUser.tutorId,
        userId: currentUser.user.id,
      });
    } catch (err) {
      console.error("Gagal auto-generate sesi tutor hari ini:", err);
    }
  }

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
