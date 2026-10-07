import TutorScheduleListPage from "@/features/tutor/schedules/components/TutorScheduleListPage";
import { getSchedules } from "@/features/tutor/schedules/queries/schedule.queries";
import { requireAuthUser } from "@/lib/auth/session";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jadwal Mengajar | Bimbel Belajarku",
};

export default async function Page() {
  const currentUser = await requireAuthUser();
  const schedules = await getSchedules(currentUser.tutorId);
  return <TutorScheduleListPage initialSchedules={schedules} />;
}
