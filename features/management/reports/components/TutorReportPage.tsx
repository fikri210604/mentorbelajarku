"use client";

import { UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

export default function TutorReportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Kinerja & Jam Terbang Tutor"
        description="Rekapitulasi total jam mengajar dan evaluasi efektivitas sesi belajar tutor."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase">Tutor Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">14</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase">Total Sesi Bulan Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">186</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase">Rata-rata Murid / Sesi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">3.8</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
