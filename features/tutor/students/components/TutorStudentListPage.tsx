"use client";

import Link from "next/link";
import { Search, User, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StudentWithPrograms } from "../types";
import { useStudentFilter } from "../hooks/use-student-filter";

interface TutorStudentListPageProps {
  initialStudents?: StudentWithPrograms[];
}

export default function TutorStudentListPage({ initialStudents = [] }: TutorStudentListPageProps) {
  const { search, setSearch, filteredStudents } = useStudentFilter(initialStudents);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Murid Binaan"
        description="Daftar murid yang berada dalam bimbingan Anda."
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari murid..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={User}
          title="Tidak ada murid"
          description="Belum ada murid binaan yang ditemukan."
        />
      ) : (
        <div className="rounded-md border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">NIS</th>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Program & Jenis Bimbel</th>
                  <th className="px-4 py-3">Sekolah / Kelas</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.map((student) => {
                  const enrollments = student.enrollments || student.student_programs || [];
                  return (
                    <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium">{student.student_code}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{student.name}</td>
                      <td className="px-4 py-3">
                        {enrollments.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {enrollments.map((enr: any, idx: number) => {
                              const typeName = enr.bimbel_types?.name || "Reguler";
                              const progName = enr.programs?.name || student.level || "Bimbel";
                              const duration = enr.bimbel_types?.duration_minutes || (typeName === "Private" ? 90 : 75);
                              const isPrivate = typeName.toLowerCase().includes("private");
                              const isIntensif = typeName.toLowerCase().includes("intensif");

                              return (
                                <span
                                  key={enr.id || idx}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                                    isPrivate
                                      ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                                      : isIntensif
                                      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                                      : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                                  }`}
                                >
                                  <span>{progName}</span>
                                  <span className="opacity-60">•</span>
                                  <span className="font-semibold">{typeName} ({duration}m)</span>
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">{student.level || "-"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {student.school ? `${student.school} (${student.grade || "-"})` : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={student.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Lihat Detail Murid"
                          aria-label="Lihat Detail Murid"
                        >
                          <Link href={`/tutor/students/${student.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
