import Link from "next/link";
import { ArrowLeft, CheckCircle2, Image as ImageIcon, ExternalLink, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { AttendanceWithDetails } from "../types";

interface AttendanceDetailPageProps {
  attendance: AttendanceWithDetails | null;
  isTutor?: boolean;
}

export default function AttendanceDetailPage({ attendance, isTutor = false }: AttendanceDetailPageProps) {
  const backHref = isTutor ? "/tutor/attendance" : "/management/attendance";

  if (!attendance) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Presensi tidak ditemukan</h2>
        <Button asChild className="mt-4" variant="outline">
          <Link href={backHref}>Kembali</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={`Presensi: ${attendance.students?.name || "Murid"}`}
        description={`Sesi Tanggal: ${attendance.sessions?.session_date || "-"}`}
      >
        <Button asChild variant="outline" size="sm">
          <Link href={backHref}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Status & Waktu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs">Status Kehadiran</span>
              <StatusBadge status={attendance.status} />
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Status Verifikasi</span>
              <StatusBadge status={attendance.verification_status} />
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Waktu Absen</span>
              <span className="font-medium">{attendance.checked_in_at || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Materi yang Diajarkan</span>
              <p className="font-medium text-foreground mt-0.5">{attendance.material || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Catatan Evaluasi</span>
              <p className="font-medium text-foreground mt-0.5">{attendance.notes || "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Bukti Foto Presensi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendance.photo_url ? (
              <div className="space-y-2">
                <a
                  href={attendance.photo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden rounded-lg border border-border"
                  title="Klik untuk membuka ukuran penuh"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={attendance.photo_url}
                    alt={`Bukti foto presensi ${attendance.students?.name || "murid"}`}
                    loading="lazy"
                    className="aspect-video w-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                </a>
                <p className="text-[11px] text-muted-foreground font-mono break-all">
                  {attendance.photo_path}
                </p>
                <Button asChild variant="outline" size="sm" className="w-full text-xs">
                  <a href={attendance.photo_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Buka Ukuran Penuh
                  </a>
                </Button>
              </div>
            ) : attendance.photo_path ? (
              <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-8 text-center">
                <ImageOff className="w-6 h-6 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground">
                  Foto tersimpan tetapi tidak dapat dimuat. Coba muat ulang halaman.
                </p>
                <p className="text-[11px] text-muted-foreground font-mono break-all">
                  {attendance.photo_path}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Tidak ada foto presensi yang dilampirkan.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
