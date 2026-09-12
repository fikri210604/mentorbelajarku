"use client";

import { GraduationCap, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

export default function StudentReportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Pertumbuhan & Status Murid"
        description="Statistik murid aktif, program studi terfavorit, dan tingkat kelulusan."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase">Murid Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">120</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase">Murid Baru Bulan Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">+18</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase">Lulus / Alumni</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">45</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
