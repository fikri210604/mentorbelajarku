"use client";

import { CreditCard, CheckCircle2, Clock, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { PayrollReportData } from "../services/report.service";

interface PayrollReportPageProps {
  initialData?: PayrollReportData;
}

export default function PayrollReportPage({
  initialData,
}: PayrollReportPageProps) {
  const data: PayrollReportData = initialData || {
    totalPayroll: 0,
    totalPaid: 0,
    totalPending: 0,
    totalSessions: 0,
    totalTutors: 0,
    paymentRecords: [],
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Pengeluaran Honor Tutor"
        description="Analisis pengeluaran honor, rekapitulasi pencairan, dan status transfer tutor dari database aktual."
      >
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <Link href="/management/payroll">
            Kelola Penggajian
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-primary" />
              Total Seluruh Honor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono text-foreground">
              {formatCurrency(data.totalPayroll)}
            </p>
            <span className="text-xs text-muted-foreground">
              {data.totalSessions} sesi • {data.totalTutors} tutor
            </span>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Telah Dibayarkan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono text-emerald-600">
              {formatCurrency(data.totalPaid)}
            </p>
            <span className="text-xs text-muted-foreground">
              Status &apos;paid&apos; di sistem
            </span>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Menunggu Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono text-amber-600">
              {formatCurrency(data.totalPending)}
            </p>
            <span className="text-xs text-muted-foreground">
              Status &apos;draft&apos; atau &apos;processed&apos;
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Payment Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Daftar Rekap Pembayaran Tutor
          </CardTitle>
          <CardDescription>
            Riwayat batch payroll yang tercatat pada sistem Supabase PostgreSQL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.paymentRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Belum ada record pembayaran honor tutor di database.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs border-b">
                  <tr>
                    <th className="px-4 py-2.5">Tutor</th>
                    <th className="px-4 py-2.5">Periode</th>
                    <th className="px-4 py-2.5 text-center">Sesi</th>
                    <th className="px-4 py-2.5 text-center">Murid</th>
                    <th className="px-4 py-2.5 text-right">Total Honor</th>
                    <th className="px-4 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.paymentRecords.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-medium">{p.tutorName}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">
                        {p.period}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {p.totalSessions}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {p.totalStudents}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-medium">
                        {formatCurrency(p.totalAmount)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
