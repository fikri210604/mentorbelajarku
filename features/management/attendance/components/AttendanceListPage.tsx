"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AttendanceWithDetails } from "../types";

interface AttendanceListPageProps {
  initialAttendances?: AttendanceWithDetails[];
}

export default function AttendanceListPage({ initialAttendances = [] }: AttendanceListPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Daftar Presensi"
        description="Seluruh rekaman kehadiran murid per sesi bimbingan belajar."
      />

      {initialAttendances.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Belum ada presensi"
          description="Belum ada catatan presensi murid yang dikirimkan."
        />
      ) : (
        <div className="rounded-md border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Tanggal Sesi</th>
                  <th className="px-4 py-3">Murid (NIS)</th>
                  <th className="px-4 py-3">Tutor / Program</th>
                  <th className="px-4 py-3">Materi</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Verifikasi</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {initialAttendances.map((att) => (
                  <tr key={att.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {att.sessions?.session_date || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">{att.students?.name}</span>
                      <span className="text-xs text-muted-foreground block">{att.students?.student_code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span>{att.sessions?.tutors?.profiles?.full_name || "Tutor"}</span>
                      <span className="text-xs text-muted-foreground block">{att.sessions?.programs?.name}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground line-clamp-1 max-w-xs">
                      {att.material || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={att.status} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={att.verification_status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/management/attendance/${att.id}`}>Detail</Link>
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
