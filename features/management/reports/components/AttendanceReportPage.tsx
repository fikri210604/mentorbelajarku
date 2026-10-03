"use client";

import { CheckCircle2, FileText, UserCheck, AlertTriangle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { AttendanceReportData } from "../services/report.service";

interface AttendanceReportPageProps {
  initialData?: AttendanceReportData;
}

export default function AttendanceReportPage({ initialData }: AttendanceReportPageProps) {
  const data: AttendanceReportData = initialData || {
    total: 0,
    present: 0,
    permission: 0,
    sick: 0,
    late: 0,
    absent: 0,
    presentPct: 0,
    permissionSickPct: 0,
    latePct: 0,
    absentPct: 0,
    programBreakdown: [],
    recentRecords: [],
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Presensi"
        description="Analisis dan rekapitulasi kehadiran murid bimbel secara agregat dari database aktual."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Hadir ({data.present})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{data.presentPct}%</p>
            <span className="text-xs text-muted-foreground">dari total {data.total} presensi</span>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              Izin / Sakit ({data.permission + data.sick})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{data.permissionSickPct}%</p>
            <span className="text-xs text-muted-foreground">Izin: {data.permission}, Sakit: {data.sick}</span>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Terlambat ({data.late})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{data.latePct}%</p>
            <span className="text-xs text-muted-foreground">Hadir dengan toleransi</span>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-600" />
              Alpa / Tidak Hadir ({data.absent})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{data.absentPct}%</p>
            <span className="text-xs text-muted-foreground">Tanpa keterangan izin</span>
          </CardContent>
        </Card>
      </div>

      {/* Program Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Ringkasan Tingkat Kehadiran per Program
          </CardTitle>
          <CardDescription>
            Persentase kehadiran murid dihitung dari seluruh sesi yang telah terlaksana untuk masing-masing program.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.programBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Belum ada data rekaman presensi pada program manapun.
            </p>
          ) : (
            <div className="space-y-4">
              {data.programBreakdown.map((prog) => (
                <div key={prog.programName} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{prog.programName}</span>
                    <span className="text-muted-foreground">
                      {prog.present}/{prog.total} pertemuan ({prog.rate}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${prog.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Attendance Records */}
      {data.recentRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              10 Log Presensi Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs border-b">
                  <tr>
                    <th className="px-4 py-2.5">Tanggal</th>
                    <th className="px-4 py-2.5">Murid</th>
                    <th className="px-4 py-2.5">Program</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.recentRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-medium">{r.sessionDate}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-medium">{r.studentName}</span>
                        <span className="text-xs text-muted-foreground block">{r.studentCode}</span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{r.programName}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
