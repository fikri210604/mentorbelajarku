import Link from "next/link";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ScheduleWithDetails } from "../types";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

interface ScheduleDetailPageProps {
  schedule: ScheduleWithDetails | null;
}

export default function ScheduleDetailPage({ schedule }: ScheduleDetailPageProps) {
  if (!schedule) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Jadwal tidak ditemukan</h2>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/management/schedules">Kembali ke Jadwal</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Jadwal: ${DAYS[schedule.day_of_week]}, ${schedule.start_time.slice(0, 5)} - ${schedule.end_time.slice(0, 5)}`}
        description={`${schedule.bimbel_types?.name} • ${schedule.programs?.name}`}
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/management/schedules">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Detail Jadwal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs">Hari & Jam</span>
              <span className="font-medium">{DAYS[schedule.day_of_week]}, {schedule.start_time} - {schedule.end_time}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Jenis Bimbel & Durasi</span>
              <span className="font-medium">{schedule.bimbel_types?.name} ({schedule.bimbel_types?.duration_minutes} menit)</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Program Studi</span>
              <span className="font-medium">{schedule.programs?.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Lokasi</span>
              <span className="font-medium">{schedule.location || "Ruang Kelas"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Status</span>
              <StatusBadge status={schedule.status} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Tutor & Target
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs">Tutor Pengajar</span>
              <span className="font-medium">{schedule.tutors?.profiles?.full_name || "Tutor"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Target Peserta</span>
              <span className="font-medium">
                {schedule.students?.name
                  ? `Murid: ${schedule.students.name} (${schedule.students.student_code})`
                  : schedule.class_groups?.name
                  ? `Kelas Kelompok: ${schedule.class_groups.name}`
                  : "-"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
