"use client";

import { CreditCard } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/utils";
import { PayrollSheetWorkspace } from "@/features/shared/payroll/components/PayrollSheetWorkspace";
import type {
  PayrollHonorSummary,
  PayrollSheetRow,
} from "@/features/shared/payroll/types";
import { PayrollWithDetails, TutorSessionEarning } from "../types";
import { TutorTeachingHistory } from "@/features/tutor/attendance/components/TutorTeachingHistory";

interface TutorPayrollPageProps {
  initialPayrolls?: PayrollWithDetails[];
  history?: TutorSessionEarning[];
  sheetRows?: PayrollSheetRow[];
  sheetMonth?: string;
  sheetMonths?: string[];
  honorSummary?: PayrollHonorSummary | null;
  tutorName?: string;
}

export default function TutorPayrollPage({
  initialPayrolls = [],
  history = [],
  sheetRows = [],
  sheetMonth = "",
  sheetMonths = [],
  honorSummary = null,
  tutorName = "",
}: TutorPayrollPageProps) {
  return (
    <div className="space-y-6">
      {sheetMonth && (
        <PayrollSheetWorkspace
          basePath="/tutor/payroll"
          month={sheetMonth}
          months={sheetMonths}
          rows={sheetRows}
          tutorName={tutorName}
          summary={honorSummary}
        />
      )}

      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="w-4 h-4 text-primary" />
            Ringkasan Honor per Periode
          </CardTitle>
          <CardDescription className="text-xs">
            Dokumen penggajian yang sudah dibuat manajemen beserta status
            pembayarannya.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {initialPayrolls.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="Belum ada dokumen penggajian"
              description="Ringkasan pembayaran honor Anda akan ditampilkan di sini setelah manajemen membuat payroll."
            />
          ) : (
            <div className="rounded-md border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold border-b">
                    <tr>
                      <th className="px-4 py-3">Periode</th>
                      <th className="px-4 py-3">Honor Kotor</th>
                      <th className="px-4 py-3">Bonus / Potongan</th>
                      <th className="px-4 py-3">Total Diterima</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {initialPayrolls.map((payroll) => (
                      <tr
                        key={payroll.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">
                          {payroll.period_start} s/d {payroll.period_end}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {formatCurrency(Number(payroll.gross_amount))}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          +{formatCurrency(Number(payroll.bonus))} / -
                          {formatCurrency(Number(payroll.deduction))}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-primary">
                          {formatCurrency(Number(payroll.net_amount))}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={payroll.status} />
                          {payroll.status === "paid" && (
                            <div className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                              {payroll.paid_at && (
                                <p>
                                  Tgl:{" "}
                                  {new Date(payroll.paid_at).toLocaleDateString(
                                    "id-ID",
                                  )}
                                </p>
                              )}
                              {payroll.payment_reference && (
                                <p className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                                  Ref: {payroll.payment_reference}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TutorTeachingHistory
        history={history}
        title="Rincian Honor per Sesi"
        description="Setiap sesi yang sudah diabsen otomatis masuk perhitungan honor (hanya murid hadir yang dihitung)."
      />
    </div>
  );
}
