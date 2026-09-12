"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, User, Eye, Pencil, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { StudentWithPrograms } from "../types";
import { useStudentFilter } from "../hooks/use-student-filter";
import { updateStudentStatus } from "../actions/student.actions";

interface StudentListPageProps {
  initialStudents?: StudentWithPrograms[];
}

export default function StudentListPage({ initialStudents = [] }: StudentListPageProps) {
  const [students, setStudents] = useState<StudentWithPrograms[]>(initialStudents);
  const { search, setSearch, statusFilter, setStatusFilter, filteredStudents } = useStudentFilter(students);
  const [loadingStudentId, setLoadingStudentId] = useState<string | null>(null);

  const handleToggleStatus = async (student: StudentWithPrograms) => {
    const nextStatus: "active" | "inactive" = student.status === "active" ? "inactive" : "active";
    setLoadingStudentId(student.id);

    // Optimistically update local state immediately
    setStudents((prev) =>
      prev.map((s) => (s.id === student.id ? { ...s, status: nextStatus } : s))
    );

    try {
      const res = await updateStudentStatus(student.id, nextStatus);
      if (res && res.success) {
        if (nextStatus === "inactive") {
          toast.info(`Murid "${student.name}" dinonaktifkan (Data tetap tersimpan aman).`, {
            description: "Tekan tombol aktif (ikon hijau) kapan saja untuk mengaktifkannya kembali.",
          });
        } else {
          toast.success(`Murid "${student.name}" berhasil diaktifkan kembali!`, {
            description: "Status langganan murid kini aktif.",
          });
        }
      } else {
        // Revert on failure
        setStudents((prev) =>
          prev.map((s) => (s.id === student.id ? { ...s, status: student.status } : s))
        );
        toast.error("Gagal memperbarui status murid.");
      }
    } catch {
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, status: student.status } : s))
      );
      toast.error("Terjadi kesalahan sistem saat memproses status murid.");
    } finally {
      setLoadingStudentId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/management/dashboard">Beranda</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Data Murid</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Data Murid"
        description="Kelola data murid, NIS, paket bimbingan belajar, dan status keaktifan."
      >
        <Button asChild>
          <Link href="/management/students/new">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Murid
          </Link>
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari murid berdasarkan nama, NIS, sekolah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="inline-flex items-center rounded-lg border bg-muted/40 p-1 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              statusFilter === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Semua ({students.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              statusFilter === "active"
                ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Aktif ({students.filter((s) => s.status === "active").length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("inactive")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              statusFilter === "inactive"
                ? "bg-background text-amber-600 dark:text-amber-400 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Nonaktif ({students.filter((s) => s.status === "inactive").length})
          </button>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={User}
          title="Tidak ada murid"
          description="Belum ada data murid yang sesuai dengan filter pencarian."
          action={
            <Button asChild variant="outline">
              <Link href="/management/students/new">Daftarkan Murid Baru</Link>
            </Button>
          }
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
                  <th className="px-4 py-3">Orang Tua / Kontak</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.map((student) => {
                  const enrollments = student.enrollments || student.student_programs || [];
                  const isActive = student.status === "active";
                  const isLoading = loadingStudentId === student.id;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        !isActive ? "opacity-75 bg-muted/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-medium">{student.student_code}</td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span>{student.name}</span>
                          {!isActive && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-normal">
                              Berhenti Langganan
                            </span>
                          )}
                        </div>
                      </td>
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
                      <td className="px-4 py-3 text-muted-foreground">
                        {student.parent_name || "-"} {student.parent_phone ? `(${student.parent_phone})` : ""}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={student.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Tombol Lihat Detail (Icon Only) */}
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Lihat Detail Murid"
                            aria-label="Lihat Detail Murid"
                          >
                            <Link href={`/management/students/${student.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>

                          {/* Tombol Edit (Icon Only) */}
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            title="Edit Data Murid"
                            aria-label="Edit Data Murid"
                          >
                            <Link href={`/management/students/${student.id}/edit`}>
                              <Pencil className="w-4 h-4" />
                            </Link>
                          </Button>

                          {/* Tombol Nonaktifkan / Aktifkan Langsung (Icon Only) */}
                          {isActive ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isLoading}
                              className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                              title="Nonaktifkan Murid (Data tetap ada, berhenti berlangganan)"
                              aria-label="Nonaktifkan Murid"
                              onClick={() => handleToggleStatus(student)}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isLoading}
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold"
                              title="Aktifkan Kembali Murid (Cukup tekan untuk mengaktifkan)"
                              aria-label="Aktifkan Murid"
                              onClick={() => handleToggleStatus(student)}
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
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
