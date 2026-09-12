"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ScheduleWithDetails } from "../types";
import { ScheduleCalendarView } from "./ScheduleCalendarView";

interface ScheduleListPageProps {
  initialSchedules?: ScheduleWithDetails[];
}

export default function ScheduleListPage({ initialSchedules = [] }: ScheduleListPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Rutin Belajar"
        description="Rencana jadwal belajar mingguan per tutor, murid, dan kelas kelompok."
      >
        <Button asChild>
          <Link href="/management/schedules/new">
            <Plus className="w-4 h-4 mr-2" />
            Buat Jadwal Baru
          </Link>
        </Button>
      </PageHeader>

      <ScheduleCalendarView
        schedules={initialSchedules}
        userRole="management"
        createUrl="/management/schedules/new"
        detailBaseUrl="/management/schedules"
      />
    </div>
  );
}
