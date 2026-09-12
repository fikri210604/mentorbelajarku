"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { SessionWithDetails } from "../types";

interface SessionListPageProps {
  initialSessions?: SessionWithDetails[];
}

export default function SessionListPage({ initialSessions = [] }: SessionListPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sesi Pembelajaran Aktual"
        description="Pencatatan sesi pertemuan riil antara tutor dan murid sebagai dasar absensi dan honor."
      />

      {initialSessions.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Tidak ada sesi"
          description="Belum ada sesi pembelajaran aktual yang tercatat."
        />
      ) : (
        <div className="rounded-md border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Tanggal & Jam</th>
                  <th className="px-4 py-3">Program / Tipe</th>
                  <th className="px-4 py-3">Tutor Aktual</th>
                  <th className="px-4 py-3">Kehadiran Murid</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {initialSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {session.session_date}
                      <span className="text-xs text-muted-foreground block">
                        {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{session.programs?.name}</span>
                      <span className="text-muted-foreground text-xs block">{session.bimbel_types?.name}</span>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {session.tutors?.profiles?.full_name || "Tutor"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {session.attendance?.length ?? 0} murid
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={session.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/management/sessions/${session.id}`}>Detail</Link>
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
