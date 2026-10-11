import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  BookOpen,
  Download,
  Sparkles,
  MapPin,
  Users,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ScheduleWithDetails } from "../types";
import ScheduleExceptionsManager from "./ScheduleExceptionsManager";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

interface ScheduleDetailPageProps {
  schedule: ScheduleWithDetails | null;
}

export default function ScheduleDetailPage({
  schedule,
}: ScheduleDetailPageProps) {
  if (!schedule) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Jadwal Tidak Ditemukan
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Data jadwal pembelajaran yang Anda tuju mungkin telah dihapus atau
            tidak tersedia.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/management/schedules">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Kembali ke Daftar Jadwal
          </Link>
        </Button>
      </div>
    );
  }

  const startTimeStr = schedule.start_time?.slice(0, 5) || "16:00";
  const endTimeStr = schedule.end_time?.slice(0, 5) || "17:15";
  const daysOfWeek =
    schedule.days_of_week && schedule.days_of_week.length > 0
      ? [...schedule.days_of_week].sort((a, b) => a - b)
      : [schedule.day_of_week];
  const recurrenceLabel = (() => {
    const parts = [`Mulai ${schedule.recurrence_start_date || "-"}`];
    if ((schedule.recurrence_interval ?? 1) > 1) {
      parts.push(`tiap ${schedule.recurrence_interval} minggu`);
    }
    if (schedule.recurrence_count) {
      parts.push(`${schedule.recurrence_count} kali`);
    } else if (schedule.recurrence_until) {
      parts.push(`sampai ${schedule.recurrence_until}`);
    } else {
      parts.push("tanpa batas (jadwal lama)");
    }
    return parts.join(" · ");
  })();

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <PageHeader
        title={`Jadwal: ${daysOfWeek.map((d) => DAYS[d]).join(", ")}, ${startTimeStr} - ${endTimeStr} WIB`}
        description={`${schedule.bimbel_types?.name || "Reguler"} (${schedule.bimbel_types?.duration_minutes || 60}m) • ${schedule.programs?.name || "Program Bimbel"}`}
      >
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-8 text-xs">
            <Link href="/management/schedules">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Kembali
            </Link>
          </Button>
          <Button asChild size="sm" className="h-8 text-xs gap-1.5 shadow-xs">
            <Link href={`/management/schedules/${schedule.id}/edit`}>
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Jadwal</span>
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* ========================================================================= */}
      {/* MATERI KURIKULUM & LEMBAR KERJA SISWA (JIKA ADA)                          */}
      {/* ========================================================================= */}
      {(schedule.target_material ||
        schedule.subject_name ||
        schedule.topic_title) && (
        <Card className="border border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-blue-50/50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-blue-950/10 shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-[11px] px-2.5 py-0.5">
                    {schedule.subject_name || "Mata Pelajaran"}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Materi Terjadwal
                  </span>
                </div>

                <h3 className="text-base font-bold text-foreground flex items-center gap-2 pt-0.5">
                  <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    {schedule.target_material ||
                      schedule.topic_title ||
                      "Materi Pembelajaran"}
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Materi ini otomatis terhubung ke formulir presensi dan lembar
                  kerja tutor saat sesi pembelajaran berlangsung.
                </p>
              </div>

              {schedule.worksheet_url && (
                <div className="shrink-0">
                  <Button
                    asChild
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs gap-1.5 h-8.5 px-3"
                  >
                    <a
                      href={schedule.worksheet_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh Worksheet (PDF)
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* RINCIAN JADWAL & TARGET PESERTA                                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rincian Sesi */}
        <Card className="shadow-xs border">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground font-bold">
              <Calendar className="w-4 h-4 text-primary" />
              Informasi Waktu & Program
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground font-medium">
                Hari Pembelajaran:
              </span>
              <span className="font-semibold text-foreground text-right">
                {daysOfWeek.map((d) => DAYS[d]).join(", ")}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground font-medium">
                Pengulangan:
              </span>
              <span className="font-semibold text-foreground text-right">
                {recurrenceLabel}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground font-medium">
                Jam Pelaksanaan:
              </span>
              <span className="font-mono font-bold text-foreground">
                {startTimeStr} - {endTimeStr} WIB
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground font-medium">
                Jenis Bimbel:
              </span>
              <Badge variant="outline" className="text-[11px] font-semibold">
                {schedule.bimbel_types?.name} (
                {schedule.bimbel_types?.duration_minutes}m)
              </Badge>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground font-medium">
                Program Bimbel:
              </span>
              <span className="font-medium text-foreground">
                {schedule.programs?.name || "-"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground font-medium">
                Lokasi Belajar:
              </span>
              <span className="font-medium text-foreground flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                {schedule.location || "Ruang Kelas Bimbel"}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-muted-foreground font-medium">
                Status Jadwal:
              </span>
              <StatusBadge status={schedule.status} />
            </div>
          </CardContent>
        </Card>

        {/* Tutor & Peserta Murid */}
        <Card className="shadow-xs border">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground font-bold">
              <Users className="w-4 h-4 text-primary" />
              Tutor Pengajar & Target Peserta
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground font-medium">
                Tutor Pengajar:
              </span>
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                {schedule.tutors?.profiles?.full_name ||
                  "Tutor Belum Ditugaskan"}
              </span>
            </div>
            <div className="py-1 border-b border-border/50 space-y-1.5">
              <span className="text-muted-foreground font-medium block">
                Target Peserta Murid:
              </span>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                {schedule.students?.name ? (
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">
                      {schedule.students.name}
                    </span>
                    <span className="font-mono text-muted-foreground text-[11px]">
                      {schedule.students.student_code}
                    </span>
                  </div>
                ) : schedule.student_names &&
                  schedule.student_names.length > 0 ? (
                  <div className="space-y-1">
                    <span className="font-bold text-foreground block">
                      {schedule.total_students || schedule.student_names.length}{" "}
                      Siswa Terdaftar:
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      {schedule.student_names.join(", ")}
                    </p>
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    Belum ada murid yang ditugaskan
                  </span>
                )}
              </div>
            </div>

            {schedule.notes && (
              <div className="pt-1">
                <span className="text-muted-foreground font-medium block mb-1">
                  Catatan Tambahan:
                </span>
                <p className="p-2 rounded bg-muted/30 text-muted-foreground italic text-[11px]">
                  &ldquo;{schedule.notes}&rdquo;
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ScheduleExceptionsManager
        scheduleId={schedule.id}
        initialExceptions={schedule.exceptions ?? []}
      />
    </div>
  );
}
