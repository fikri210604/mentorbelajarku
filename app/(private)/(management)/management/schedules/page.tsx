import ScheduleListPage from "@/features/management/schedules/components/ScheduleListPage";
import { getSchedules } from "@/features/management/schedules/queries/schedule.queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jadwal Belajar | Bimbel Belajarku",
};

export default async function Page() {
  const schedules = await getSchedules();
  return <ScheduleListPage initialSchedules={schedules} />;
}
