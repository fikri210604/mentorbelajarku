import { History, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { TutorSessionEarning } from "@/features/tutor/payroll/types";

interface TutorTeachingHistoryProps {
  history: TutorSessionEarning[];
  title?: string;
  description?: string;
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Riwayat absensi/mengajar + honor per sesi (angka dihitung server). */
export function TutorTeachingHistory({
  history,
  title = "Riwayat Absensi & Mengajar",
  description = "Sesi yang sudah diabsen otomatis tercatat sebagai dasar honor.",
}: TutorTeachingHistoryProps) {
  const total = history.reduce((sum, h) => sum + (h.amount ?? 0), 0);
  const hasUncalculated = history.some((h) => h.amount === null);

  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="w-4 h-4 text-primary" />
              {title}
            </CardTitle>
            <CardDescription className="text-xs mt-1">{description}</CardDescription>
          </div>
          {history.length > 0 && (
            <Badge variant="outline" className="text-xs font-semibold">
              {history.length} sesi · {hasUncalculated ? "Honor belum lengkap" : formatCurrency(total)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Belum ada sesi yang diabsen.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {history.map((h) => (
              <li key={h.sessionId} className="py-3 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {h.programName}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({h.bimbelTypeName})
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDate(h.sessionDate)}
                    {h.startTime && ` · ${h.startTime.slice(0, 5)}-${(h.endTime ?? "").slice(0, 5)} WIB`}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Hadir {h.payableStudents} dari {h.totalStudents} murid
                    {h.ratePerStudent !== null && ` · ${formatCurrency(h.ratePerStudent)}/murid`}
                  </p>
                </div>
                <div className="text-right space-y-1 shrink-0">
                  <p className="font-mono text-sm font-semibold text-primary">
                    {h.amount === null ? "Tarif belum diatur" : formatCurrency(h.amount)}
                  </p>
                  {h.inPayroll ? (
                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1" variant="outline">
                      <CheckCircle2 className="w-3 h-3" />
                      Masuk Payroll
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] gap-1" variant="outline">
                      <Clock className="w-3 h-3" />
                      Menunggu Payroll
                    </Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
