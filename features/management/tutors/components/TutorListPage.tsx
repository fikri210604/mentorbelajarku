"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TutorWithProfile } from "../types";

interface TutorListPageProps {
  initialTutors?: TutorWithProfile[];
}

export default function TutorListPage({ initialTutors = [] }: TutorListPageProps) {
  const [search, setSearch] = useState("");

  const filteredTutors = useMemo(() => {
    return initialTutors.filter((tutor) => {
      const name = tutor.profiles?.full_name || "";
      const phone = tutor.profiles?.phone || "";
      return (
        name.toLowerCase().includes(search.toLowerCase()) ||
        phone.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [initialTutors, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Tutor"
        description="Kelola pengajar, profil, tarif honor, dan status keaktifan."
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari tutor berdasarkan nama atau telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredTutors.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="Tidak ada tutor"
          description="Belum ada tutor terdaftar atau tidak sesuai kriteria pencarian."
        />
      ) : (
        <div className="rounded-md border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Nama Tutor</th>
                  <th className="px-4 py-3">Kontak</th>
                  <th className="px-4 py-3">Bio / Spesialisasi</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTutors.map((tutor) => (
                  <tr key={tutor.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {tutor.profiles?.full_name || "Tutor"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {tutor.profiles?.phone || "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground line-clamp-1 max-w-xs">
                      {tutor.bio || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={tutor.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/management/tutors/${tutor.id}`}>Detail</Link>
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
