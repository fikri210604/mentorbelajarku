"use client";

import { CheckCircle2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

export default function AttendanceReportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Presensi"
        description="Analisis dan rekapitulasi kehadiran murid bimbel secara agregat."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase">Hadir</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">92%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase">Izin / Sakit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">5%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase">Terlambat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">2%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase">Absen (Alpa)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">1%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Ringkasan Kehadiran per Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Laporan lengkap dapat diekspor atau difilter berdasarkan rentang tanggal tertentu.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
