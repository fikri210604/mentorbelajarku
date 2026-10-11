'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Printer,
  CalendarRange,
  UserCheck,
  Loader2,
  Info,
  ArrowLeft,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PrintablePayrollSheet } from './PrintablePayrollSheet';
import { formatMonthLabel } from '../utils';
import type { PayrollHonorSummary, PayrollSheetRow, PayrollTutorOption } from '../types';

interface PayrollSheetWorkspaceProps {
  basePath: string;
  month: string;
  months: string[];
  rows: PayrollSheetRow[];
  tutorName: string;
  summary?: PayrollHonorSummary | null;
  tutors?: PayrollTutorOption[];
  selectedTutorId?: string;
  backUrl?: string;
  backLabel?: string;
}

/**
 * Workspace sheet penggajian: pemilih tutor + bulan, tombol cetak, dan canvas A4.
 * Dipakai bersama oleh portal tutor dan portal manajemen (admin).
 */
export function PayrollSheetWorkspace({
  basePath,
  month,
  months,
  rows,
  tutorName,
  summary,
  tutors,
  selectedTutorId,
  backUrl,
  backLabel,
}: PayrollSheetWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const monthOptions = months.includes(month) ? months : [month, ...months];

  const navigate = (next: { month?: string; tutorId?: string }) => {
    const params = new URLSearchParams();
    const nextMonth = next.month ?? month;
    const nextTutor = next.tutorId ?? selectedTutorId;
    if (nextMonth) params.set('month', nextMonth);
    if (nextTutor) params.set('tutorId', nextTutor);
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`, { scroll: false });
    });
  };

  const handlePrint = () => {
    setTimeout(() => window.print(), 150);
  };

  return (
    <div className="space-y-6">
      {/* HEADER & ACTIONS (hidden saat print) */}
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
                  {backLabel || 'Kembali'}
                </Link>
              </Button>
            )}
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-emerald-600" />
                Penggajian
              </h1>
              <Badge variant="success" className="text-xs">
                Format Resmi A4
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Sheet penggajian tutor per bulan, terisi otomatis dari presensi sesi yang sudah
              disubmit.
            </p>
          </div>

          <Button
            type="button"
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs h-9 px-4 shadow-sm self-start md:self-auto"
            title="Cetak langsung atau simpan sebagai PDF A4"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Export PDF</span>
          </Button>
        </div>

        {/* TOOLBAR FILTER */}
        <div className="bg-card border border-border/80 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center gap-4">
          {tutors && tutors.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                Pilih Tutor:
              </label>
              <div className="w-full sm:w-72">
                <Select value={selectedTutorId} onValueChange={(v) => navigate({ tutorId: v ?? undefined })}>
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue placeholder="Pilih tutor...">
                      {tutors.find((t) => t.id === selectedTutorId)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {tutors.map((t) => (
                      <SelectItem key={t.id} value={t.id} label={t.name} className="text-xs">
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:ml-auto">
            <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap flex items-center gap-1.5">
              <CalendarRange className="w-3.5 h-3.5" />
              Pilih Bulan:
            </label>
            <div className="w-full sm:w-56">
              <Select value={month} onValueChange={(v) => navigate({ month: v ?? undefined })}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Pilih bulan..." />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">
                      {formatMonthLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isPending && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>Memuat data...</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:w-full">
            <Badge variant="outline" className="text-xs font-semibold">
              {rows.length} pertemuan efektif
            </Badge>
            {summary?.configured && (
              <Badge variant="outline" className="text-xs font-semibold">
                {summary.totalPayableStudents} murid terhitung
              </Badge>
            )}
          </div>
        </div>

        {/* TIPS CETAK */}
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-lg p-3 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Tips Ekspor PDF:</span> klik{' '}
            <strong>&quot;Cetak / Export PDF&quot;</strong>, pilih tujuan{' '}
            <em>&quot;Save as PDF&quot; (Simpan sebagai PDF)</em>, pastikan ukuran kertas{' '}
            <em>A4</em>, dan centang <em>&quot;Background graphics&quot;</em>.
          </div>
        </div>
      </div>

      {/* CANVAS PREVIEW & CETAK (A4) */}
      <div className="bg-slate-100 dark:bg-slate-900/50 p-2 sm:p-6 md:p-8 rounded-xl border border-border/60 flex justify-center overflow-x-auto print:bg-white print:p-0 print:border-none print:m-0">
        <div className="w-full max-w-[210mm] transition-all">
          <PrintablePayrollSheet
            tutorName={tutorName}
            monthLabel={formatMonthLabel(month)}
            rows={rows}
            summary={summary}
          />
        </div>
      </div>
    </div>
  );
}
