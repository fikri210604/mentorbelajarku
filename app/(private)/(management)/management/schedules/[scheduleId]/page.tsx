import { Metadata } from "next";
import ScheduleDetailPage from "@/features/management/schedules/components/ScheduleDetailPage";
import { getScheduleById } from "@/features/management/schedules/queries/schedule.queries";

interface PageProps {
  params: Promise<{ scheduleId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { scheduleId } = await params;
  const schedule = await getScheduleById(scheduleId);

  if (!schedule) {
    return {
      title: "Detail Jadwal | Bimbel Belajarku",
    };
  }

  return {
    title: `Jadwal ${schedule.bimbel_types?.name || "Bimbel"} • ${schedule.tutors?.profiles?.full_name || "Tutor"} | Bimbel Belajarku`,
  };
}

export default async function Page({ params }: PageProps) {
  const { scheduleId } = await params;
  const schedule = await getScheduleById(scheduleId);

  return <ScheduleDetailPage schedule={schedule} />;
}
