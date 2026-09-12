import ScheduleDetailPage from "@/features/management/schedules/components/ScheduleDetailPage";
import { getScheduleById } from "@/features/management/schedules/queries/schedule.queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail Jadwal | Bimbel Belajarku",
};

export default async function Page({
  params,
}: {
  params: Promise<{ scheduleId: string }>;
}) {
  const { scheduleId } = await params;
  const schedule = await getScheduleById(scheduleId);

  return <ScheduleDetailPage schedule={schedule} />;
}
