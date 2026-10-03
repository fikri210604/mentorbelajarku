import { Metadata } from "next";
import TutorScheduleDetailPage from "@/features/tutor/schedules/components/TutorScheduleDetailPage";
import { getTutorScheduleDetail } from "@/features/tutor/schedules/queries/schedule-detail.queries";

interface PageProps {
  params: Promise<{ scheduleId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { scheduleId } = await params;
  const { schedule } = await getTutorScheduleDetail(scheduleId);

  if (!schedule) {
    return { title: "Detail Jadwal Mengajar | Bimbel Belajarku" };
  }

  return {
    title: `Jadwal ${schedule.programs?.name || "Bimbel"} • Detail Absensi | Bimbel Belajarku`,
  };
}

export default async function Page({ params }: PageProps) {
  const { scheduleId } = await params;
  const { schedule, sessions, forbidden } = await getTutorScheduleDetail(scheduleId);

  return <TutorScheduleDetailPage schedule={schedule} sessions={sessions} forbidden={forbidden} />;
}
