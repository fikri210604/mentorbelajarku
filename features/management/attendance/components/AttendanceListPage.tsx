"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Eye,
  Search,
  Users,
  Clock,
  AlertCircle,
  Camera,
  Calendar,
  Filter,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AttendanceWithDetails } from "../types";

interface AttendanceListPageProps {
  initialAttendances?: AttendanceWithDetails[];
}

export default function AttendanceListPage({ initialAttendances = [] }: AttendanceListPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = initialAttendances.length;
    const present = initialAttendances.filter((a) => a.status === "present" || (a.status as string) === "late").length;
    const permission = initialAttendances.filter((a) => a.status === "permission" || a.status === "sick").length;
    const absent = initialAttendances.filter((a) => a.status === "absent").length;
    const pendingVerification = initialAttendances.filter(
      (a) => a.verification_status === "submitted" || (a.verification_status as string) === "pending"
    ).length;

    return { total, present, permission, absent, pendingVerification };
  }, [initialAttendances]);

  // Filtered attendances
  const filteredAttendances = useMemo(() => {
    return initialAttendances.filter((item) => {
      const studentName = item.students?.name?.toLowerCase() || "";
      const studentCode = item.students?.student_code?.toLowerCase() || "";
      const tutorName = item.sessions?.tutors?.profiles?.full_name?.toLowerCase() || "";
      const material = item.material?.toLowerCase() || "";
      const query = searchTerm.toLowerCase();

      const matchesSearch =
        studentName.includes(query) ||
        studentCode.includes(query) ||
        tutorName.includes(query) ||
        material.includes(query);

      if (!matchesSearch) return false;

      if (statusFilter === "all") return true;
      if (statusFilter === "present") return item.status === "present" || (item.status as string) === "late";
      if (statusFilter === "permission") return item.status === "permission" || item.status === "sick";
      if (statusFilter === "absent") return item.status === "absent";
      if (statusFilter === "pending") {
        return item.verification_status === "submitted" || (item.verification_status as string) === "pending";
      }

      return true;
    });
  }, [initialAttendances, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daftar Presensi Murid"
        description="Monitoring kehadiran murid, verifikasi sesi belajar, dan foto dokumentasi mengajar tutor."
      />

      {/* ========================================================================= */}
      {/* SUMMARY KPI CARDS                                                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground font-medium">Total Catatan</p>
              <p className="text-2xl font-bold text-foreground">{metrics.total}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground font-medium">Siswa Hadir</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.present}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground font-medium">Izin & Sakit</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{metrics.permission}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground font-medium">Tanpa Keterangan (Alpa)</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{metrics.absent}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* SEARCH & FILTER BAR                                                       */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari murid, tutor, atau materi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: "all", label: "Semua", count: metrics.total },
            { key: "present", label: "Hadir", count: metrics.present },
            { key: "permission", label: "Izin / Sakit", count: metrics.permission },
            { key: "absent", label: "Alpa", count: metrics.absent },
            ...(metrics.pendingVerification > 0
              ? [{ key: "pending", label: "Perlu Verifikasi", count: metrics.pendingVerification }]
              : []),
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === tab.key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DATA TABLE                                                                */}
      {/* ========================================================================= */}
      {filteredAttendances.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Tidak Ada Catatan Presensi"
          description={
            searchTerm || statusFilter !== "all"
              ? "Tidak ada data yang cocok dengan kriteria pencarian atau filter yang dipilih."
              : "Belum ada catatan presensi murid yang dikirimkan oleh tutor."
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Tanggal & Waktu</th>
                  <th className="px-4 py-3">Murid</th>
                  <th className="px-4 py-3">Tutor / Program</th>
                  <th className="px-4 py-3">Materi Belajar</th>
                  <th className="px-4 py-3 text-center">Foto</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Verifikasi</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAttendances.map((att) => (
                  <tr key={att.id} className="hover:bg-muted/30 transition-colors">
                    {/* Tanggal & Waktu */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>{att.sessions?.session_date || "-"}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono block pl-5">
                        {att.sessions?.start_time?.slice(0, 5) || "16:00"} - {att.sessions?.end_time?.slice(0, 5) || "17:15"}
                      </span>
                    </td>

                    {/* Murid */}
                    <td className="px-4 py-3">
                      <span className="font-semibold text-foreground text-xs block">{att.students?.name}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">{att.students?.student_code}</span>
                    </td>

                    {/* Tutor & Program */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground block">
                        {att.sessions?.tutors?.profiles?.full_name || "Tutor"}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                          {att.sessions?.bimbel_types?.name || "Reguler"}
                        </Badge>
                        <span className="truncate max-w-[120px]">{att.sessions?.programs?.name}</span>
                      </div>
                    </td>

                    {/* Materi Belajar */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-foreground line-clamp-1">
                        {att.material || "-"}
                      </p>
                      {att.notes && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 italic mt-0.5">
                          &ldquo;{att.notes}&rdquo;
                        </p>
                      )}
                    </td>

                    {/* Indikator Foto */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {att.photo_path ? (
                        <span
                          title="Foto dokumentasi terlampir"
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Status Kehadiran */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={att.status} />
                    </td>

                    {/* Status Verifikasi */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={att.verification_status} />
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
                      >
                        <Link href={`/management/attendance/${att.id}`}>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Rincian</span>
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
    </div>
  );
}
