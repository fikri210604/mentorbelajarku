'use client';

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Printer,
  Edit3,
  Check,
  Save,
  GraduationCap,
  Info,
  Loader2,
  Calendar,
  UserCheck,
  BookOpen,
  ArrowLeft,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { PrintableEvaluationSheet, EvaluationRowItem } from './PrintableEvaluationSheet';
import { StudentEvaluationReportData } from '../queries/evaluation.queries';
import { saveEvaluationUpdatesAction } from '../actions/evaluation.actions';

export interface StudentOption {
  id: string;
  name: string;
  student_code: string;
  school?: string;
  grade?: string;
}

interface ProgressReportsPageProps {
  students?: StudentOption[];
  initialSelectedStudentId: string;
  initialReport: StudentEvaluationReportData;
  backUrl?: string;
  backLabel?: string;
}

export default function ProgressReportsPage({
  students = [],
  initialSelectedStudentId,
  initialReport,
  backUrl,
  backLabel,
}: ProgressReportsPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialSelectedStudentId || initialReport.studentId
  );
  const [reportData, setReportData] = useState<StudentEvaluationReportData>(initialReport);
  const [rows, setRows] = useState<EvaluationRowItem[]>(initialReport.rows || []);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // State untuk Popup Dialog Edit Keterangan & Materi Pertemuan
  const [activeEditRow, setActiveEditRow] = useState<{
    row: EvaluationRowItem;
    index: number;
  } | null>(null);
  const [formDateStr, setFormDateStr] = useState<string>('');
  const [formMaterial, setFormMaterial] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formMeetingNumber, setFormMeetingNumber] = useState<number | string>('');
  const [formTutorName, setFormTutorName] = useState<string>('');
  const [isSavingModal, setIsSavingModal] = useState<boolean>(false);

  const [prevReport, setPrevReport] = useState<StudentEvaluationReportData>(initialReport);
  if (prevReport !== initialReport) {
    setPrevReport(initialReport);
    setReportData(initialReport);
    setRows(initialReport.rows || []);
    setSelectedStudentId(initialReport.studentId);
  }

  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  const selectedStudent = useMemo(() => {
    return students.find((st) => st.id === selectedStudentId);
  }, [students, selectedStudentId]);

  const selectedStudentLabel = useMemo(() => {
    if (selectedStudent) {
      return `${selectedStudent.name} (${selectedStudent.student_code})`;
    }
    if (reportData?.studentName) {
      return `${reportData.studentName}${reportData.studentCode ? ` (${reportData.studentCode})` : ''}`;
    }
    return 'Pilih murid...';
  }, [selectedStudent, reportData]);

  const studentItems = useMemo(() => {
    return students.map((st) => ({
      value: st.id,
      label: `${st.name} (${st.student_code})`,
    }));
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return students;
    const q = studentSearchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.student_code.toLowerCase().includes(q) ||
        (s.grade && s.grade.toLowerCase().includes(q))
    );
  }, [students, studentSearchQuery]);

  // Handler saat memilih murid lain dari dropdown
  const handleSelectStudent = (newStudentId: string | null) => {
    if (!newStudentId || newStudentId === selectedStudentId) return;
    setSelectedStudentId(newStudentId);
    startTransition(() => {
      router.push(`/management/progress-reports?studentId=${encodeURIComponent(newStudentId)}`);
    });
  };

  // Buka Popup Modal Edit Keterangan & Materi
  const handleOpenEditModal = (row: EvaluationRowItem, index: number) => {
    setActiveEditRow({ row, index });
    setFormDateStr(row.dateStr || '');
    setFormMaterial(row.material || '');
    setFormNotes(row.notes || '');
    setFormMeetingNumber(row.meetingNumber);
    setFormTutorName(row.tutorName || '');
  };

  // Simpan perubahan dari Popup Modal ke database dan state
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditRow) return;

    setIsSavingModal(true);
    try {
      const updatedRow: EvaluationRowItem = {
        ...activeEditRow.row,
        dateStr: formDateStr,
        material: formMaterial,
        notes: formNotes || undefined,
        meetingNumber: formMeetingNumber,
        tutorName: formTutorName,
      };

      // Simpan ke database via Server Action
      const res = await saveEvaluationUpdatesAction([
        {
          attendanceId: updatedRow.id,
          material: formMaterial,
          notes: formNotes || undefined,
        },
      ]);

      if (res.success) {
        // Update state lokal
        setRows((prev) => {
          const copy = [...prev];
          copy[activeEditRow.index] = updatedRow;
          return copy;
        });
        toast.success('Keterangan evaluasi pertemuan berhasil diperbarui!');
        setActiveEditRow(null);
      } else {
        toast.error(res.message);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan keterangan evaluasi.');
    } finally {
      setIsSavingModal(false);
    }
  };

  // Update satu baris tabel (inline)
  const handleUpdateRow = (index: number, updated: Partial<EvaluationRowItem>) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updated };
      return copy;
    });
  };

  // Simpan perubahan massal (jika inline mode) ke database
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const updates = rows.map((r) => ({
        attendanceId: r.id,
        material: r.material,
        notes: r.notes,
      }));

      const res = await saveEvaluationUpdatesAction(updates);
      if (res.success) {
        toast.success(res.message);
        setIsEditing(false);
      } else {
        toast.error(res.message);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handler cetak langsung ke browser vector print engine (0 ms)
  const handlePrint = () => {
    if (isEditing) {
      setIsEditing(false);
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* ===================================================================
          1. HEADER & ACTION CONTROLS (Hidden during window.print())
          =================================================================== */}
      <div className="no-print space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {backUrl && (
              <Button
                asChild
                variant="ghost"
                size="xs"
                className="mb-1.5 -ml-2 text-muted-foreground hover:text-foreground gap-1.5 text-xs font-normal"
              >
                <Link href={backUrl}>
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {backLabel || 'Kembali ke Detail Murid'}
                </Link>
              </Button>
            )}
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-emerald-600" />
                Laporan Perkembangan Murid
              </h1>
              <Badge variant="success" className="text-xs">
                Format Resmi A4
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Rekapitulasi riwayat sesi belajar dan keterangan evaluasi murid untuk cetak laporan PDF resmi.
            </p>
          </div>

          {/* Action Buttons: HANYA EDIT DAN CETAK */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tombol Toggle Mode Edit Cepat */}
            <Button
              type="button"
              variant={isEditing ? 'warning' : 'outline'}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="gap-1.5 text-xs h-9 shadow-xs"
            >
              {isEditing ? (
                <>
                  <Check className="w-4 h-4" />
                  Selesai Edit
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  Mode Edit Langsung
                </>
              )}
            </Button>

            {/* Tombol Simpan Perubahan (Saat Mode Edit Langsung Aktif) */}
            {isEditing && (
              <Button
                type="button"
                variant="success"
                size="sm"
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="gap-1.5 text-xs h-9"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            )}

            {/* Tombol Cetak / Export PDF */}
            <Button
              type="button"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs h-9 px-4 shadow-sm"
              title="Cetak langsung atau simpan sebagai PDF A4"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Export PDF</span>
              <span className="bg-emerald-800/60 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                0 ms
              </span>
            </Button>
          </div>
        </div>

        {/* TOOLBAR FILTER & INFORMASI MURID */}
        <div className="bg-card border border-border/80 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Pilih Murid:
            </label>
            <div className="w-full sm:w-80">
              <Select
                items={studentItems}
                value={selectedStudentId}
                onValueChange={handleSelectStudent}
              >
                <SelectTrigger className="h-9 text-xs bg-background font-medium">
                  <SelectValue placeholder="Pilih murid...">
                    {selectedStudentLabel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-80 w-80">
                  {students.length > 5 && (
                    <div className="p-1.5 border-b sticky top-0 bg-popover z-10">
                      <Input
                        type="text"
                        placeholder="Cari nama atau NIS murid..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        className="h-7 text-xs px-2"
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  {filteredStudents.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground italic">
                      Tidak ada murid yang cocok
                    </div>
                  ) : (
                    filteredStudents.map((st) => (
                      <SelectItem
                        key={st.id}
                        value={st.id}
                        label={`${st.name} (${st.student_code})`}
                        className="text-xs py-2 cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{st.name}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            NIS: {st.student_code} {st.grade ? `• Kelas ${st.grade}` : ''}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {isPending && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Memuat data murid...</span>
              </div>
            )}
          </div>

          {/* Metadata Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/60 border border-border/60">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              Program: <strong className="text-foreground ml-1">{reportData.programName}</strong>
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/60 border border-border/60">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              Tipe: <strong className="text-foreground ml-1">{reportData.bimbelType}</strong>
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/60 border border-border/60">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              Total Sesi: <strong className="text-foreground ml-1">{rows.length} Pertemuan</strong>
            </span>
          </div>
        </div>

        {/* PANDUAN CEPAT CETAK KE PDF */}
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-lg p-3 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Tips Ekspor PDF Cepat (0 ms):</span> Klik tombol{' '}
            <strong>&quot;Cetak / Export PDF&quot;</strong> di atas. Pada kotak dialog printer browser, pilih
            tujuan <em>&quot;Save as PDF&quot; (Simpan sebagai PDF)</em>, pastikan ukuran kertas{' '}
            <em>A4</em>, dan centang opsi <em>&quot;Background graphics&quot; (Grafik latar belakang)</em> agar
            warna gradien banner hijau dan header biru tampil sempurna.
          </div>
        </div>
      </div>

      {/* ===================================================================
          2. CANVAS PREVIEW & CETAK DOKUMEN (A4 FORMAT)
          =================================================================== */}
      <div className="bg-slate-100 dark:bg-slate-900/50 p-2 sm:p-6 md:p-8 rounded-xl border border-border/60 flex justify-center overflow-x-auto print:bg-white print:p-0 print:border-none print:m-0">
        <div className="w-full max-w-[210mm] transition-all">
          <PrintableEvaluationSheet
            studentName={reportData.studentName}
            rows={rows}
            isEditing={isEditing}
            onUpdateRow={handleUpdateRow}
            onEditRow={handleOpenEditModal}
          />
        </div>
      </div>

      {/* ===================================================================
          3. POPUP MODAL: EDIT KETERANGAN & MATERI PERTEMUAN
          =================================================================== */}
      <Dialog
        open={!!activeEditRow}
        onOpenChange={(open) => !open && setActiveEditRow(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSaveModal}>
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Pencil className="w-4 h-4 text-emerald-600" />
                Edit Keterangan & Materi Pertemuan
              </DialogTitle>
              <DialogDescription className="text-xs">
                Pertemuan ke-<strong>{activeEditRow?.row.meetingNumber}</strong> • Murid:{' '}
                <strong>{reportData.studentName}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="modal-date" className="text-xs font-semibold">
                    Hari, Tanggal
                  </Label>
                  <Input
                    id="modal-date"
                    value={formDateStr}
                    onChange={(e) => setFormDateStr(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="Contoh: Kamis, 2/10/25"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="modal-meeting" className="text-xs font-semibold">
                    Pertemuan ke-
                  </Label>
                  <Input
                    id="modal-meeting"
                    type="number"
                    value={formMeetingNumber}
                    onChange={(e) => setFormMeetingNumber(e.target.value)}
                    className="h-8 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="modal-tutor" className="text-xs font-semibold">
                  Mentor yang Mengajar
                </Label>
                <Input
                  id="modal-tutor"
                  value={formTutorName}
                  onChange={(e) => setFormTutorName(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="Nama tutor pengajar"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="modal-material" className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Materi yang Diajarkan
                </Label>
                <Textarea
                  id="modal-material"
                  rows={2}
                  value={formMaterial}
                  onChange={(e) => setFormMaterial(e.target.value)}
                  className="text-xs resize-none"
                  placeholder="Contoh: MTK dan Kemuhammadiyahan (persiapan ujian)..."
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="modal-notes" className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Keterangan / Catatan Tambahan (Opsional)
                </Label>
                <Textarea
                  id="modal-notes"
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="text-xs resize-none"
                  placeholder="Tambahkan keterangan evaluasi, pemahaman murid, atau catatan materi..."
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveEditRow(null)}
                disabled={isSavingModal}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSavingModal}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                {isSavingModal ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Keterangan</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
