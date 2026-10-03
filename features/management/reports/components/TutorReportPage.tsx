"use client";

import { UserCheck, CalendarCheck, Users, Phone, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { TutorReportData } from "../services/report.service";

interface TutorReportPageProps {
  initialData?: TutorReportData;
}

export default function TutorReportPage({ initialData }: TutorReportPageProps) {
  const data: TutorReportData = initialData || {
    activeTutors: 0,
    totalSessionsThisMonth: 0,
    avgStudentsPerSession: 0,
    tutorList: [],
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Kinerja & Jam Terbang Tutor"
        description="Rekapitulasi total sesi mengajar, efektivitas murid, dan status tutor dari database aktual."
      >
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <Link href="/management/tutors">
            Daftar Tutor
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Tutor Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{data.activeTutors}</p>
            <span className="text-xs text-muted-foreground">Tutor siap mengajar</span>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-blue-600" />
              Total Sesi Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{data.totalSessionsThisMonth}</p>
            <span className="text-xs text-muted-foreground">Pertemuan pembelajaran terjadwal</span>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-600" />
              Rata-rata Murid / Sesi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{data.avgStudentsPerSession}</p>
            <span className="text-xs text-muted-foreground">Rasio kapasitas mengajar</span>
          </CardContent>
        </Card>
      </div>

      {/* Tutor Performance List Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Rekap Kinerja Pengajar
          </CardTitle>
          <CardDescription>
            Jumlah akumulasi sesi mengajar dan murid yang telah diajar oleh masing-masing tutor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.tutorList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Belum ada data rekaman tutor di database.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs border-b">
                  <tr>
                    <th className="px-4 py-2.5">Nama Tutor</th>
                    <th className="px-4 py-2.5">Kontak</th>
                    <th className="px-4 py-2.5 text-center">Total Sesi</th>
                    <th className="px-4 py-2.5 text-center">Total Murid Diajar</th>
                    <th className="px-4 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.tutorList.map((tutor) => (
                    <tr key={tutor.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-medium">{tutor.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">
                        {tutor.phone || "-"}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono font-medium">
                        {tutor.sessionsCount}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono font-medium">
                        {tutor.studentsTaughtCount}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <StatusBadge status={tutor.status} />
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
