import { BookOpen, CheckCircle2, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { StudentActivePackageProgress } from '../types';

interface StudentProgressCardProps {
  progress: StudentActivePackageProgress | null;
}

export function StudentProgressCard({ progress }: StudentProgressCardProps) {
  if (!progress) {
    return (
      <Card className="border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            Paket Belajar Aktif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Belum ada paket belajar aktif untuk murid ini.</p>
        </CardContent>
      </Card>
    );
  }

  const isCompleted = progress.remainingMeetings === 0;
  const isNearCompletion = progress.remainingMeetings <= 2 && !isCompleted;

  return (
    <Card className="border shadow-xs overflow-hidden">
      <CardHeader className="pb-3 bg-muted/20 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-foreground">
                {progress.programName}
              </CardTitle>
              <Badge variant="outline" className="text-xs font-semibold">
                {progress.bimbelTypeName}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{progress.packageName}</p>
          </div>

          <div>
            {isCompleted ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Paket Selesai
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 text-xs font-medium">
                <Sparkles className="w-3 h-3 text-primary" />
                Paket Aktif
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Ringkasan Progres Pertemuan */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-background border">
          <div>
            <span className="text-xs text-muted-foreground block font-medium">Status Pertemuan Saat Ini</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-primary">
                P{progress.completedMeetings}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">
                (Pertemuan {progress.completedMeetings} dari {progress.maxMeetings})
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-muted-foreground block font-medium">Sisa Kuota Belajar</span>
            <span
              className={`text-lg font-bold ${
                isCompleted
                  ? 'text-muted-foreground'
                  : isNearCompletion
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {progress.remainingMeetings} Pertemuan Tersisa
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-muted-foreground">Capaian Kuota Paket</span>
            <span className="font-semibold text-foreground">{progress.percentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                isCompleted
                  ? 'bg-emerald-500'
                  : isNearCompletion
                  ? 'bg-amber-500'
                  : 'bg-primary'
              }`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Keterangan & Notifikasi Sesuai Aturan Bisnis */}
        {isCompleted ? (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200 py-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-xs">
              <strong>Seluruh {progress.maxMeetings} pertemuan (P1 - P{progress.maxMeetings}) paket ini telah selesai.</strong> Murid siap untuk penerbitan paket baru untuk periode berikutnya. Hitungan pertemuan akan otomatis kembali ke P1.
            </AlertDescription>
          </Alert>
        ) : isNearCompletion ? (
          <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200 py-2.5">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-xs">
              <strong>Mendekati akhir paket:</strong> Tinggal {progress.remainingMeetings} pertemuan lagi sebelum paket belajar ini selesai. Pertemuan berikutnya adalah <strong>P{progress.completedMeetings + 1}</strong>.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/30 p-2 rounded border">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-primary" />
            <span>
              <strong>Aturan Bimbel:</strong> Kode pertemuan (P1, P2, dst.) hanya bertambah saat murid <em>Hadir</em> atau <em>Terlambat</em>. Izin dan Sakit tidak memotong kuota.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
