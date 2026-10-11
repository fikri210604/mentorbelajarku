"use client";

import { GraduationCap, Users, UserPlus, BookOpen, Layers } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StudentReportData } from "../services/report.service";

interface StudentReportPageProps {
  initialData?: StudentReportData;
}

export default function StudentReportPage({
  initialData,
}: StudentReportPageProps) {
  const data: StudentReportData = initialData || {
    activeStudents: 0,
    newStudentsThisMonth: 0,
    graduatedStudents: 0,
    inactiveStudents: 0,
    totalStudents: 0,
    programDistribution: [],
    levelDistribution: [],
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Pertumbuhan & Status Murid"
        description="Statistik murid aktif, program bimbel terfavorit, dan tingkat kelulusan dari database aktual."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              Murid Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {data.activeStudents}
            </p>
            <span className="text-xs text-muted-foreground">
              dari total {data.totalStudents} murid terdaftar
            </span>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-blue-600" />
              Murid Baru Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              +{data.newStudentsThisMonth}
            </p>
            <span className="text-xs text-muted-foreground">
              Pendaftaran bulan berjalan
            </span>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              Lulus / Alumni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {data.graduatedStudents}
            </p>
            <span className="text-xs text-muted-foreground">
              Menyelesaikan seluruh paket
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Program Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Distribusi Murid per Program
            </CardTitle>
            <CardDescription>
              Jumlah murid yang terdaftar pada tiap program bimbel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.programDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Belum ada data pendaftaran program murid.
              </p>
            ) : (
              <div className="space-y-4">
                {data.programDistribution.map((prog) => (
                  <div key={prog.name} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground">
                        {prog.name}
                      </span>
                      <span className="text-muted-foreground">
                        {prog.count} murid ({prog.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${prog.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Level Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Distribusi Tingkat Jenjang
            </CardTitle>
            <CardDescription>
              Komposisi jenjang pendidikan siswa (SD, SMP, SMA/SMK).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.levelDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Belum ada data jenjang murid.
              </p>
            ) : (
              <div className="space-y-3">
                {data.levelDistribution.map((lvl) => (
                  <div
                    key={lvl.level}
                    className="flex justify-between items-center py-2 border-b border-border/50 text-sm"
                  >
                    <span className="font-medium text-foreground">
                      {lvl.level}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {lvl.count} murid
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
