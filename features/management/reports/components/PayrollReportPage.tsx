"use client";

import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@/lib/utils";

export default function PayrollReportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Pengeluaran Honor Tutor"
        description="Analisis pengeluaran honor, tren bulanan, dan histori transfer."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase">Total Honor Bulan Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{formatCurrency(14500000)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase">Telah Dibayarkan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono text-primary">{formatCurrency(12000000)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase">Menunggu Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono text-destructive">{formatCurrency(2500000)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
