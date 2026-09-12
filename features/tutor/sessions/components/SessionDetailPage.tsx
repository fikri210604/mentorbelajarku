import Link from "next/link";
import { ArrowLeft, Clock, User, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { SessionWithDetails } from "../types";

interface SessionDetailPageProps {
  session: SessionWithDetails | null;
  isTutor?: boolean;
}

export default function SessionDetailPage({ session, isTutor = false }: SessionDetailPageProps) {
  const backHref = isTutor ? "/tutor/dashboard" : "/management/sessions";

  if (!session) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Sesi tidak ditemukan</h2>
        <Button asChild className="mt-4" variant="outline">
          <Link href={backHref}>Kembali</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Sesi: ${session.session_date}`}
        description={`${session.programs?.name} (${session.bimbel_types?.name}) • ${session.start_time.slice(0, 5)} - ${session.end_time.slice(0, 5)}`}
      >
        <Button asChild variant="outline" size="sm">
          <Link href={backHref}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Link>
        </Button>
        {isTutor && (
          <Button asChild size="sm">
            <Link href={`/tutor/attendance`}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Lakukan Absensi
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Informasi Sesi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs">Tanggal & Jam</span>
              <span className="font-medium">{session.session_date}, {session.start_time} - {session.end_time}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Tutor Pengajar Aktual</span>
              <span className="font-medium">{session.tutors?.profiles?.full_name || "Tutor"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Status Sesi</span>
              <StatusBadge status={session.status} />
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Catatan</span>
              <span className="font-medium">{session.notes || "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Daftar Kehadiran Murid
            </CardTitle>
          </CardHeader>
          <CardContent>
            {session.attendance && session.attendance.length > 0 ? (
              <div className="divide-y text-sm">
                {session.attendance.map((att) => (
                  <div key={att.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{att.students?.name || "Murid"}</p>
                      <p className="text-xs text-muted-foreground">NIS: {att.students?.student_code || "-"}</p>
                    </div>
                    <StatusBadge status={att.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada data presensi murid pada sesi ini.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
