"use client";

import Link from "next/link";
import { CreditCard, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/utils";
import { PayrollSheetWorkspace } from "@/features/shared/payroll/components/PayrollSheetWorkspace";
import type {
  PayrollHonorSummary,
  PayrollSheetRow,
  PayrollTutorOption,
} from "@/features/shared/payroll/types";
import { PayrollWithDetails } from "../types";

interface PayrollListPageProps {
  initialPayrolls?: PayrollWithDetails[];
  sheetRows?: PayrollSheetRow[];
  sheetMonth?: string;
  sheetMonths?: string[];
  honorSummary?: PayrollHonorSummary | null;
  tutorName?: string;
  tutors?: PayrollTutorOption[];
  selectedTutorId?: string;
}

export default function PayrollListPage({
  initialPayrolls = [],
  sheetRows = [],
  sheetMonth = "",
  sheetMonths = [],
  honorSummary = null,
  tutorName = "",
  tutors = [],
  selectedTutorId,
}: PayrollListPageProps) {
  return (
    <div className="space-y-6">
      {sheetMonth && (
        <PayrollSheetWorkspace
          basePath="/management/payroll"
          month={sheetMonth}
          months={sheetMonths}
          rows={sheetRows}
          tutorName={tutorName}
          summary={honorSummary}
          tutors={tutors}
          selectedTutorId={selectedTutorId}
        />
      )}

      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="w-4 h-4 text-primary" />
            Dokumen Penggajian Tutor
          </CardTitle>
          <CardDescription className="text-xs">
            Dokumen penggajian yang sudah dihitung/diproses beserta status pembayarannya.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {initialPayrolls.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="Belum ada dokumen penggajian"
              description="Belum ada honor tutor yang dihitung atau diproses."
            />
          ) : (
            <div className="rounded-md border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold border-b">
                    <tr>
                      <th className="px-4 py-3">Nama Tutor</th>
                      <th className="px-4 py-3">Periode</th>
                      <th className="px-4 py-3">Honor Kotor</th>
                      <th className="px-4 py-3">Bonus / Potongan</th>
                      <th className="px-4 py-3">Total Bersih</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {initialPayrolls.map((payroll) => (
                      <tr key={payroll.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">
                          {payroll.tutors?.profiles?.full_name || "Tutor"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {payroll.period_start} s/d {payroll.period_end}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {formatCurrency(Number(payroll.gross_amount))}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          +{formatCurrency(Number(payroll.bonus))} / -{formatCurrency(Number(payroll.deduction))}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-primary">
                          {formatCurrency(Number(payroll.net_amount))}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={payroll.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Lihat Rincian Penggajian"
                            aria-label="Lihat Rincian Penggajian"
                          >
                            <Link href={`/management/payroll/${payroll.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
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
    </div>
  );
}
