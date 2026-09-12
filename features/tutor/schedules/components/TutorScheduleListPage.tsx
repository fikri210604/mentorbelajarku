"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ScheduleWithDetails } from "@/features/management/schedules/types";
import { ScheduleCalendarView } from "@/features/management/schedules/components/ScheduleCalendarView";

interface TutorScheduleListPageProps {
  initialSchedules?: ScheduleWithDetails[];
}

export default function TutorScheduleListPage({ initialSchedules = [] }: TutorScheduleListPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Mengajar Saya"
        description="Daftar jadwal rutin mengajar mingguan Anda dalam tampilan kalender atau tabel."
      />

      <ScheduleCalendarView
        schedules={initialSchedules}
        userRole="tutor"
        detailBaseUrl="/tutor/schedules"
      />
    </div>
  );
}
