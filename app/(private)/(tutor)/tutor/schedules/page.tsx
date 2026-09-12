import TutorScheduleListPage from "@/features/tutor/schedules/components/TutorScheduleListPage";
import { getSchedules } from "@/features/tutor/schedules/queries/schedule.queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jadwal Mengajar | Bimbel Belajarku",
};

export default async function Page() {
  const schedules = await getSchedules();
  return <TutorScheduleListPage initialSchedules={schedules} />;
}
