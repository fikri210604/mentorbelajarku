"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  ImageOff,
  ExternalLink,
  MessageSquare,
  Trash2,
  X,
  CreditCard,
  FileText,
  Calendar,
  AlertTriangle,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { PayrollWithDetails, PayrollItemWithDetails } from "../types";
import {
  finalizePayrollAction,
  markPayrollAsPaidAction,
  auditAttendanceAction,
  removePayrollItemAction,
} from "../actions/payroll.actions";

interface PayrollDetailPageProps {
  payroll: PayrollWithDetails | null;
}

export default function PayrollDetailPage({ payroll }: PayrollDetailPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // State untuk Modal Lightbox Foto
  const [previewPhoto, setPreviewPhoto] = useState<{
    url: string;
    studentName: string;
    sessionDate: string;
  } | null>(null);

  // State untuk Modal Minta Koreksi Foto
  const [correctionTarget, setCorrectionTarget] = useState<{
    attendanceId: string;
    studentName: string;
    currentNotes: string;
  } | null>(null);
  const [correctionNotes, setCorrectionNotes] = useState("");

  // State untuk Modal Tandai Telah Dibayar
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  if (!payroll) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <h2 className="text-xl font-bold">Data Penggajian Tidak Ditemukan</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Dokumen penggajian ini mungkin telah dihapus atau ID tidak valid.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/management/payroll">Kembali ke Daftar</Link>
        </Button>
      </div>
    );
  }

  const items = payroll.items || [];
  const correctionCount = items.filter(
    (i) => i.attendance?.verification_status === "correction_requested",
  ).length;
  const verifiedCount = items.filter(
    (i) => i.attendance?.verification_status === "verified",
  ).length;
  const submittedCount = items.filter(
    (i) =>
      !i.attendance?.verification_status ||
      i.attendance?.verification_status === "submitted",
  ).length;

  // Aksi Finalisasi Payroll
  const handleFinalize = async () => {
    if (correctionCount > 0) {
      const confirmProceed = window.confirm(
        `Perhatian: Masih ada ${correctionCount} sesi dengan status 'Perlu Koreksi Foto'. Apakah Anda yakin tetap ingin memfinalisasi sekarang?`,
      );
      if (!confirmProceed) return;
    }

    setLoading(true);
    try {
      const res = await finalizePayrollAction(payroll.id);
      if (!res.success) {
        toast.error(res.error || "Gagal memfinalisasi penggajian.");
      } else {
        toast.success("Penggajian berhasil difinalisasi dan siap dibayarkan!");
        router.refresh();
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat memfinalisasi.");
    } finally {
      setLoading(false);
    }
  };

  // Buka Modal Pembayaran
  const handleOpenPayModal = () => {
    setPaymentReference(payroll.payment_reference || "");
    setPaymentNotes(payroll.notes || "");
    setPayModalOpen(true);
  };

  // Eksekusi Tandai Telah Dibayar
  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      const res = await markPayrollAsPaidAction(payroll.id, {
        paymentReference,
        notes: paymentNotes,
      });
      if (!res.success) {
        toast.error(res.error || "Gagal memproses pembayaran.");
      } else {
        toast.success("Penggajian berhasil ditandai telah dibayarkan!");
        setPayModalOpen(false);
        router.refresh();
      }
    } catch {
      toast.error("Terjadi kesalahan saat memproses pembayaran.");
    } finally {
      setLoading(false);
    }
  };

  // Aksi Verifikasi Langsung Foto Presensi
  const handleVerifyAttendance = async (attendanceId: string) => {
    setActionLoadingId(attendanceId);
    try {
      const res = await auditAttendanceAction({
        attendanceId,
        verificationStatus: "verified",
        payrollId: payroll.id,
      });
      if (!res.success) {
        toast.error(res.error || "Gagal memverifikasi presensi.");
      } else {
        toast.success("Foto presensi berhasil diverifikasi!");
        router.refresh();
      }
    } catch {
      toast.error("Terjadi kesalahan saat memverifikasi.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Buka Modal Minta Koreksi Foto
  const handleOpenCorrection = (item: PayrollItemWithDetails) => {
    if (!item.attendance?.id) {
      toast.error("Catatan absensi tidak ditemukan untuk item ini.");
      return;
    }
    setCorrectionTarget({
      attendanceId: item.attendance.id,
      studentName: item.students?.name || "Murid",
      currentNotes: item.attendance.notes || "",
    });
    setCorrectionNotes(
      item.attendance.notes ||
        "Foto bukti presensi buram / tidak sesuai. Mohon unggah ulang foto belajar murid.",
    );
  };

  // Eksekusi Minta Koreksi Foto
  const handleSubmitCorrection = async () => {
    if (!correctionTarget) return;
    setLoading(true);
    try {
      const res = await auditAttendanceAction({
        attendanceId: correctionTarget.attendanceId,
        verificationStatus: "correction_requested",
        notes: correctionNotes,
        payrollId: payroll.id,
      });
      if (!res.success) {
        toast.error(res.error || "Gagal mengirim permintaan koreksi.");
      } else {
        toast.success("Permintaan koreksi foto berhasil dicatat untuk tutor.");
        setCorrectionTarget(null);
        router.refresh();
      }
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan koreksi.");
    } finally {
      setLoading(false);
    }
  };

  // Aksi Hapus Item dari Draft Payroll
  const handleRemoveItem = async (itemId: string, studentName: string) => {
    const confirmDelete = window.confirm(
      `Keluarkan sesi untuk murid "${studentName}" dari draft penggajian bulan ini? Nominal akan dihitung ulang secara otomatis.`,
    );
    if (!confirmDelete) return;

    setActionLoadingId(itemId);
    try {
      const res = await removePayrollItemAction(itemId, payroll.id);
      if (!res.success) {
        toast.error(res.error || "Gagal mengeluarkan sesi dari penggajian.");
      } else {
        toast.success("Sesi berhasil dikeluarkan dari penggajian periode ini.");
        router.refresh();
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat mengeluarkan sesi.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        title={`Audit Penggajian: ${payroll.tutors?.profiles?.full_name || "Tutor"}`}
        description={`Periode: ${payroll.period_start} s/d ${payroll.period_end}`}
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/management/payroll">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Link>
        </Button>
        {payroll.status === "draft" && (
          <Button size="sm" onClick={handleFinalize} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Finalisasi Penggajian
          </Button>
        )}
        {payroll.status === "processed" && (
          <Button
            size="sm"
            onClick={handleOpenPayModal}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Tandai Telah Dibayar
          </Button>
        )}
      </PageHeader>

      {/* BANNER STATUS JIKA SUDAH DIBAYARKAN */}
      {payroll.status === "paid" && (
        <Alert className="border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle className="font-semibold text-emerald-900 dark:text-emerald-300">
            Honor Telah Selesai Dibayarkan
          </AlertTitle>
          <AlertDescription className="text-xs space-y-1 mt-1 text-emerald-800 dark:text-emerald-200">
            <p>
              Dibayarkan pada:{" "}
              <span className="font-medium font-mono">
                {payroll.paid_at
                  ? new Date(payroll.paid_at).toLocaleString("id-ID")
                  : "-"}
              </span>
            </p>
            {payroll.payment_reference && (
              <p>
                No. Bukti / Referensi Bank:{" "}
                <span className="font-semibold font-mono bg-emerald-500/20 px-1.5 py-0.5 rounded">
                  {payroll.payment_reference}
                </span>
              </p>
            )}
            {payroll.notes && <p>Catatan Pembayaran: {payroll.notes}</p>}
          </AlertDescription>
        </Alert>
      )}

      {/* PERINGATAN BILA MASIH ADA SESI PERLU KOREKSI */}
      {correctionCount > 0 && payroll.status !== "paid" && (
        <Alert
          variant="destructive"
          className="border-amber-500/50 bg-amber-500/10 text-amber-950 dark:text-amber-100"
        >
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="font-semibold text-amber-900 dark:text-amber-200">
            Perhatian: {correctionCount} Sesi Memerlukan Koreksi Foto
          </AlertTitle>
          <AlertDescription className="text-xs text-amber-800 dark:text-amber-200 mt-1">
            Terdapat sesi absensi yang foto buktinya telah diminta koreksi
            kepada tutor. Anda dapat menunggu tutor mengunggah perbaikan foto
            atau mengeluarkan sesi tersebut dari draft penggajian periode ini.
          </AlertDescription>
        </Alert>
      )}

      {/* RINGKASAN KEUANGAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase font-semibold">
              Honor Kotor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">
              {formatCurrency(Number(payroll.gross_amount))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {payroll.total_students_attended} kehadiran murid
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase font-semibold">
              Bonus / Potongan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              +{formatCurrency(Number(payroll.bonus))}
            </p>
            <p className="text-sm font-medium text-destructive">
              -{formatCurrency(Number(payroll.deduction))}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase font-semibold">
              Total Bersih
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono text-primary">
              {formatCurrency(Number(payroll.net_amount))}
            </p>
            <div className="mt-1">
              <StatusBadge status={payroll.status} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase font-semibold">
              Audit Bukti Foto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-emerald-600 font-medium">
                Terverifikasi:
              </span>
              <span className="font-semibold">{verifiedCount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-amber-600 font-medium">Perlu Koreksi:</span>
              <span className="font-semibold">{correctionCount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Belum Diperiksa:</span>
              <span className="font-semibold">{submittedCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABEL AUDIT SESI & FOTO PRESENSI */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                Audit Foto & Sesi Mengajar
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Periksa bukti foto pembelajaran sebelum menyetujui atau
                mencairkan honor tutor.
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="text-xs self-start sm:self-auto"
            >
              Total {items.length} Sesi Terhitung
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Tidak ada rincian item sesi pada penggajian ini.
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold border-b">
                    <tr>
                      <th className="px-3 py-3 w-10 text-center">No</th>
                      <th className="px-4 py-3">Sesi Belajar</th>
                      <th className="px-4 py-3">Murid & Tipe</th>
                      <th className="px-4 py-3">Bukti Foto Presensi</th>
                      <th className="px-4 py-3 text-right">Honor</th>
                      <th className="px-4 py-3 text-center w-36">Aksi Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item, idx) => {
                      const att = item.attendance;
                      const sessionDate = item.session_date || "-";
                      const studentName = item.students?.name || "Murid";
                      const studentCode = item.students?.student_code || "";
                      const programName =
                        item.sessions?.programs?.name || "Bimbel";
                      const bimbelType = item.bimbel_types?.name || "Reguler";
                      const isItemLoading =
                        actionLoadingId === (att?.id || item.id);

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-3 py-3 text-center text-xs text-muted-foreground font-mono">
                            {idx + 1}
                          </td>

                          {/* Info Sesi */}
                          <td className="px-4 py-3">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-foreground flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                {sessionDate}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {programName}
                                {item.sessions?.start_time && (
                                  <span>
                                    {" "}
                                    · {item.sessions.start_time.slice(0, 5)} WIB
                                  </span>
                                )}
                              </p>
                            </div>
                          </td>

                          {/* Info Murid */}
                          <td className="px-4 py-3">
                            <div className="space-y-0.5">
                              <p className="font-medium text-foreground">
                                {studentName}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {studentCode ? `${studentCode} · ` : ""}
                                {bimbelType}
                              </p>
                            </div>
                          </td>

                          {/* Bukti Foto Presensi & Status */}
                          <td className="px-4 py-3">
                            <div className="flex items-start gap-3">
                              {/* Thumbnail Foto */}
                              {att?.photo_url ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewPhoto({
                                      url: att.photo_url!,
                                      studentName,
                                      sessionDate,
                                    })
                                  }
                                  className="relative group shrink-0 w-16 h-12 rounded border border-border overflow-hidden bg-muted/40 cursor-zoom-in hover:border-primary transition-colors"
                                  title="Klik untuk memperbesar foto"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={att.photo_url}
                                    alt={`Foto presensi ${studentName}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <ZoomIn className="w-4 h-4 text-white" />
                                  </div>
                                </button>
                              ) : (
                                <div className="shrink-0 w-16 h-12 rounded border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center text-muted-foreground text-[10px]">
                                  <ImageOff className="w-4 h-4 mb-0.5 opacity-50" />
                                  <span>No Foto</span>
                                </div>
                              )}

                              {/* Status Badge & Catatan */}
                              <div className="space-y-1">
                                {att?.verification_status === "verified" ? (
                                  <Badge
                                    className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px] gap-1"
                                    variant="outline"
                                  >
                                    <Check className="w-3 h-3" />
                                    Terverifikasi
                                  </Badge>
                                ) : att?.verification_status ===
                                  "correction_requested" ? (
                                  <Badge
                                    className="bg-destructive/15 text-destructive border-destructive/30 text-[11px] gap-1"
                                    variant="outline"
                                  >
                                    <AlertCircle className="w-3 h-3" />
                                    Perlu Koreksi Foto
                                  </Badge>
                                ) : (
                                  <Badge
                                    className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[11px]"
                                    variant="outline"
                                  >
                                    Diserahkan (Belum Dicek)
                                  </Badge>
                                )}

                                {att?.notes && (
                                  <p className="text-[11px] text-muted-foreground italic line-clamp-2 max-w-xs">
                                    &ldquo;{att.notes}&rdquo;
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Nominal Honor */}
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono font-semibold text-foreground">
                              {formatCurrency(Number(item.amount))}
                            </span>
                          </td>

                          {/* Aksi Audit */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {att ? (
                                <>
                                  {/* Tombol Verifikasi (Hanya jika belum verified) */}
                                  {att.verification_status !== "verified" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                      disabled={
                                        isItemLoading ||
                                        payroll.status === "paid"
                                      }
                                      onClick={() =>
                                        handleVerifyAttendance(att.id)
                                      }
                                      title="Setujui dan verifikasi foto ini"
                                    >
                                      {isItemLoading ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5" />
                                      )}
                                    </Button>
                                  )}

                                  {/* Tombol Minta Koreksi Foto */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                                    disabled={
                                      isItemLoading || payroll.status === "paid"
                                    }
                                    onClick={() => handleOpenCorrection(item)}
                                    title="Minta tutor unggah ulang foto"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">
                                  -
                                </span>
                              )}

                              {/* Tombol Keluarkan Sesi dari Payroll (jika status masih draft) */}
                              {payroll.status === "draft" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                                  disabled={isItemLoading}
                                  onClick={() =>
                                    handleRemoveItem(item.id, studentName)
                                  }
                                  title="Keluarkan dari penggajian ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIALOG PREVIEW FOTO RESOLUSI PENUH */}
      <Dialog
        open={!!previewPhoto}
        onOpenChange={(open) => !open && setPreviewPhoto(null)}
      >
        <DialogContent className="max-w-3xl p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base flex items-center justify-between">
              <span>Bukti Foto Belajar: {previewPhoto?.studentName}</span>
              <span className="text-xs font-normal text-muted-foreground mr-6">
                Tanggal: {previewPhoto?.sessionDate}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="relative rounded-lg overflow-hidden border border-border bg-black/90 flex items-center justify-center max-h-[70vh]">
            {previewPhoto?.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewPhoto.url}
                alt="Bukti foto belajar"
                className="max-h-[68vh] w-auto object-contain"
              />
            )}
          </div>
          <DialogFooter className="flex justify-between items-center sm:justify-between pt-2">
            <Button asChild variant="outline" size="sm">
              <a
                href={previewPhoto?.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Buka di Tab Baru
              </a>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPreviewPhoto(null)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG MINTA KOREKSI FOTO */}
      <Dialog
        open={!!correctionTarget}
        onOpenChange={(open) => !open && setCorrectionTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              Minta Koreksi Foto Presensi
            </DialogTitle>
            <DialogDescription className="text-xs">
              Kirim instruksi kepada tutor untuk mengunggah ulang bukti foto
              presensi murid{" "}
              <span className="font-semibold text-foreground">
                {correctionTarget?.studentName}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-foreground">
              Alasan Penolakan / Catatan Perbaikan:
            </label>
            <Textarea
              value={correctionNotes}
              onChange={(e) => setCorrectionNotes(e.target.value)}
              placeholder="Contoh: Foto buram atau tidak tampak materi belajar. Silakan unggah foto murid saat belajar."
              rows={4}
              className="text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Status presensi akan berubah menjadi &ldquo;Perlu Koreksi
              Foto&rdquo; dan tutor dapat memperbaikinya dari portal tutor.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCorrectionTarget(null)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitCorrection}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4 mr-2" />
              )}
              Kirim Permintaan Koreksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG KONFIRMASI TANDAI TELAH DIBAYAR */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-emerald-600">
              <DollarSign className="w-5 h-5" />
              Konfirmasi Pembayaran Gaji Tutor
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tandai bahwa honor tutor untuk periode ini telah berhasil
              ditransfer dan dibayarkan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/50 p-3 border space-y-1">
              <span className="text-xs text-muted-foreground block">
                Total Honor Bersih yang Ditransfer:
              </span>
              <span className="text-xl font-bold font-mono text-primary">
                {formatCurrency(Number(payroll.net_amount))}
              </span>
              <span className="text-[11px] text-muted-foreground block">
                Tutor: {payroll.tutors?.profiles?.full_name || "-"}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Nomor Referensi Transfer / Bukti Bank (Disarankan):
              </label>
              <Input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Contoh: TRF-BCA-89230192 atau NO-KWT-01"
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Nomor referensi ini akan terlihat oleh tutor sebagai bukti
                validasi transfer.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Catatan Tambahan (Opsional):
              </label>
              <Textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Contoh: Ditransfer via BCA rekening a.n. Tutor pada pk 10:30 WIB"
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPayModalOpen(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmPayment}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Konfirmasi & Tandai Dibayar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
