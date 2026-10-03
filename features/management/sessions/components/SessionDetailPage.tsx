"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  User,
  CheckCircle2,
  CalendarClock,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Edit,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { SessionWithDetails } from "../types";
import { updateSessionAttendanceDeadline } from "@/features/management/settings/actions/settings.actions";
import { RescheduleSessionDialog } from "@/features/shared/sessions/components/RescheduleSessionDialog";

interface SessionDetailPageProps {
  session: (SessionWithDetails & {
    attendance_deadline?: string | null;
    allow_late_upload?: boolean;
    late_upload_reason?: string | null;
  }) | null;
  isTutor?: boolean;
}

export default function SessionDetailPage({ session, isTutor = false }: SessionDetailPageProps) {
  const backHref = isTutor ? "/tutor/dashboard" : "/management/sessions";

  const [currentSession, setCurrentSession] = useState(session);
  const [isDeadlineDialogOpen, setIsDeadlineDialogOpen] = useState(false);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State form dispensasi deadline
  const [deadlineInput, setDeadlineInput] = useState(() => {
    if (session?.attendance_deadline) {
      try {
        const d = new Date(session.attendance_deadline);
        // Format to YYYY-MM-DDTHH:mm for datetime-local input
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } catch {
        return "";
      }
    }
    // Default: besok jam 23:59
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`;
  });

  const [allowLate, setAllowLate] = useState(session?.allow_late_upload ?? true);
  const [reasonInput, setReasonInput] = useState(session?.late_upload_reason || "");

  if (!currentSession) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Sesi tidak ditemukan</h2>
        <Button asChild className="mt-4" variant="outline">
          <Link href={backHref}>Kembali</Link>
        </Button>
      </div>
    );
  }

  const handleSaveDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deadlineInput) {
      toast.error("Batas tanggal dan waktu dispensasi wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isoDeadline = new Date(deadlineInput).toISOString();
      const res = await updateSessionAttendanceDeadline({
        sessionId: currentSession.id,
        attendance_deadline: isoDeadline,
        allow_late_upload: allowLate,
        late_upload_reason: reasonInput.trim() || undefined,
      });

      if (res.success) {
        toast.success(res.message || "Batas waktu absensi sesi berhasil diperbarui.");
        setCurrentSession((prev: any) => ({
          ...prev,
          attendance_deadline: isoDeadline,
          allow_late_upload: allowLate,
          late_upload_reason: reasonInput.trim() || null,
        }));
        setIsDeadlineDialogOpen(false);
      } else {
        toast.error(res.error || "Gagal memperbarui batas waktu absensi.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasCustomDeadline = Boolean(currentSession.attendance_deadline);
  const formattedCustomDeadline = currentSession.attendance_deadline
    ? new Date(currentSession.attendance_deadline).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Sesi: ${currentSession.session_date}`}
        description={`${currentSession.programs?.name || "Program"} (${currentSession.bimbel_types?.name || "Bimbel"}) • ${currentSession.start_time?.slice(0, 5)} - ${currentSession.end_time?.slice(0, 5)}`}
      >
        <Button asChild variant="outline" size="sm">
          <Link href={backHref}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsRescheduleDialogOpen(true)}
          className="gap-1.5 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
        >
          <CalendarClock className="w-4 h-4 text-amber-600" />
          <span>Jadwalkan Ulang (Reschedule)</span>
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
        {/* Informasi Sesi */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Informasi Sesi Belajar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs">Tanggal & Jam Mengajar</span>
              <span className="font-semibold text-foreground font-mono">
                {currentSession.session_date}, {currentSession.start_time?.slice(0, 5)} - {currentSession.end_time?.slice(0, 5)} WIB
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Tutor Pengajar Aktual</span>
              <span className="font-medium text-foreground">
                {currentSession.tutors?.profiles?.full_name || "Tutor Pengajar"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Program & Kategori</span>
              <span className="font-medium text-foreground">
                {currentSession.programs?.name} ({currentSession.bimbel_types?.name})
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Status Sesi</span>
              <div className="mt-1">
                <StatusBadge status={currentSession.status} />
              </div>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Catatan Pembelajaran</span>
              <span className="font-medium text-muted-foreground text-xs">
                {currentSession.notes || "Tidak ada catatan khusus."}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Batas Waktu & Dispensasi Presensi (Khusus Manajemen / Info Tutor) */}
        <Card className="shadow-xs border-primary/20">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-primary" />
                Batas Waktu Presensi
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Status jendela waktu upload presensi dan bukti foto
              </CardDescription>
            </div>
            {!isTutor && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeadlineDialogOpen(true)}
                className="text-xs h-8 gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Atur Dispensasi</span>
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="p-3 rounded-lg border bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status Jendela Upload:</span>
                {hasCustomDeadline ? (
                  <Badge className="bg-purple-600 hover:bg-purple-600 text-white text-xs px-2 py-0.5">
                    Dispensasi Khusus Aktif
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Aturan Master Standar
                  </Badge>
                )}
              </div>

              {hasCustomDeadline ? (
                <div className="space-y-1 pt-1 border-t border-border/50 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Batas Maksimal Upload:</span>
                    <strong className="text-purple-700 dark:text-purple-300 font-mono">
                      {formattedCustomDeadline}
                    </strong>
                  </div>
                  {currentSession.late_upload_reason && (
                    <div className="flex justify-between text-[11px] pt-0.5 text-muted-foreground">
                      <span>Alasan Dispensasi:</span>
                      <span className="italic max-w-[200px] text-right truncate">
                        {currentSession.late_upload_reason}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                  Mengikuti toleransi master bimbel (dibuka 15 menit sebelum jam mengajar s/d toleransi jam dan batas hari H+1).
                </p>
              )}
            </div>

            {!isTutor && (
              <div className="text-xs text-muted-foreground leading-relaxed flex items-start gap-2 bg-primary/5 p-3 rounded-lg border border-primary/10">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Jika tutor mengalami kendala (misal mati lampu / tidak ada sinyal), Anda dapat memberi
                  perpanjangan batas tanggal dan jam spesifik tanpa perlu mengubah master sistem.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daftar Murid & Presensi */}
        <Card className="md:col-span-2 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Daftar Murid & Status Presensi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentSession.attendance && currentSession.attendance.length > 0 ? (
              <div className="divide-y text-sm">
                {currentSession.attendance.map((att) => (
                  <div key={att.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-foreground">{att.students?.name || "Murid"}</p>
                      <p className="text-xs text-muted-foreground">
                        NIS: {att.students?.student_code || "-"} · Level: {att.students?.level || "-"}
                      </p>
                      {(() => {
                        const lr = (
                          att as unknown as {
                            learning_records?:
                              | { material?: string | null }
                              | { material?: string | null }[]
                              | null;
                          }
                        ).learning_records;
                        const material = (Array.isArray(lr) ? lr[0] : lr)?.material;
                        return material ? (
                          <p className="text-xs text-muted-foreground mt-1 bg-muted/40 px-2 py-0.5 rounded inline-block">
                            Materi: {material}
                          </p>
                        ) : null;
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={att.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-xs">
                Belum ada data presensi murid yang disubmit pada sesi ini.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Dispensasi Batas Waktu Absensi */}
      <Dialog open={isDeadlineDialogOpen} onOpenChange={setIsDeadlineDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveDeadline}>
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-primary" />
                Atur Batas Waktu Presensi Sesi
              </DialogTitle>
              <DialogDescription className="text-xs">
                Beri perpanjangan tanggal dan jam kepada tutor untuk mengunggah presensi sesi ini.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="deadline" className="text-xs font-semibold">
                  Batas Tanggal & Jam Baru (Dispensasi)
                </Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={deadlineInput}
                  onChange={(e) => setDeadlineInput(e.target.value)}
                  className="text-sm h-9"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Tutor dapat melakukan absensi hingga batas waktu yang ditentukan di atas.
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="space-y-0.5">
                  <Label htmlFor="allowLate" className="text-xs font-semibold cursor-pointer">
                    Izinkan Upload Susulan
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Aktifkan gembok izin submit untuk sesi ini
                  </p>
                </div>
                <Switch
                  id="allowLate"
                  checked={allowLate}
                  onCheckedChange={setAllowLate}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reason" className="text-xs font-semibold">
                  Alasan Dispensasi (Opsional)
                </Label>
                <Textarea
                  id="reason"
                  rows={2}
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="Contoh: Permintaan tutor karena kendala jaringan..."
                  className="text-xs resize-none"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDeadlineDialogOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="text-xs gap-1.5 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Batas Waktu</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Jadwalkan Ulang (Reschedule) */}
      <RescheduleSessionDialog
        open={isRescheduleDialogOpen}
        onOpenChange={setIsRescheduleDialogOpen}
        session={{
          id: currentSession.id,
          session_date: currentSession.session_date,
          start_time: currentSession.start_time,
          end_time: currentSession.end_time,
          program_name: currentSession.programs?.name,
        }}
      />
    </div>
  );
}
