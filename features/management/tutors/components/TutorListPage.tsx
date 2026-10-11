"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  UserCheck,
  Eye,
  UserX,
  UserPlus,
  Edit2,
  KeyRound,
  Trash2,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TutorWithProfile } from "../types";
import { updateTutorStatus } from "../actions/tutor.actions";
import { CreateTutorDialog } from "./CreateTutorDialog";
import { EditTutorDialog } from "./EditTutorDialog";
import { ResendCredentialsDialog } from "./ResendCredentialsDialog";
import { DeleteTutorDialog } from "./DeleteTutorDialog";
import { formatTutorDisplayName } from "../utils/tutor-greeting";

interface TutorListPageProps {
  initialTutors?: TutorWithProfile[];
}

export default function TutorListPage({
  initialTutors = [],
}: TutorListPageProps) {
  const [tutors, setTutors] = useState<TutorWithProfile[]>(initialTutors);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loadingTutorId, setLoadingTutorId] = useState<string | null>(null);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTutor, setEditingTutor] = useState<TutorWithProfile | null>(null);
  const [resendingTutor, setResendingTutor] = useState<TutorWithProfile | null>(null);
  const [deletingTutor, setDeletingTutor] = useState<TutorWithProfile | null>(null);

  const filteredTutors = useMemo(() => {
    return tutors.filter((tutor) => {
      const name = tutor.profiles?.full_name || "";
      const phone = tutor.profiles?.phone || "";
      const email = tutor.profiles?.email || "";
      const query = search.toLowerCase();

      const matchSearch =
        name.toLowerCase().includes(query) ||
        phone.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query);

      const matchStatus =
        statusFilter === "all" || tutor.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [tutors, search, statusFilter]);

  const handleToggleStatus = async (tutor: TutorWithProfile) => {
    const nextStatus: "active" | "inactive" =
      tutor.status === "active" ? "inactive" : "active";
    const tutorName = tutor.profiles?.full_name || "Tutor";
    setLoadingTutorId(tutor.id);

    // Optimistically update local state immediately
    setTutors((prev) =>
      prev.map((t) => (t.id === tutor.id ? { ...t, status: nextStatus } : t)),
    );

    try {
      const res = await updateTutorStatus(tutor.id, nextStatus);
      if (res && res.success) {
        if (nextStatus === "inactive") {
          toast.info(
            `Tutor "${tutorName}" dinonaktifkan (Data tetap tersimpan aman).`,
            {
              description:
                "Tekan tombol aktif kapan saja untuk mengaktifkannya kembali.",
            },
          );
        } else {
          toast.success(`Tutor "${tutorName}" berhasil diaktifkan kembali!`, {
            description: "Tutor kini aktif dan dapat dijadwalkan mengajar.",
          });
        }
      } else {
        // Revert on failure
        setTutors((prev) =>
          prev.map((t) =>
            t.id === tutor.id ? { ...t, status: tutor.status } : t,
          ),
        );
        toast.error("Gagal mengubah status tutor.");
      }
    } catch {
      setTutors((prev) =>
        prev.map((t) =>
          t.id === tutor.id ? { ...t, status: tutor.status } : t,
        ),
      );
      toast.error("Terjadi kesalahan saat memproses status tutor.");
    } finally {
      setLoadingTutorId(null);
    }
  };

  // Callback handlers for dialogs
  const handleTutorCreated = (newTutor: TutorWithProfile) => {
    setTutors((prev) => [newTutor, ...prev]);
  };

  const handleTutorUpdated = (updatedTutor: TutorWithProfile) => {
    setTutors((prev) =>
      prev.map((t) => (t.id === updatedTutor.id ? updatedTutor : t)),
    );
  };

  const handleTutorDeleted = (deletedId: string) => {
    setTutors((prev) => prev.filter((t) => t.id !== deletedId));
  };

  const handleTutorDeactivated = (tutorId: string) => {
    setTutors((prev) =>
      prev.map((t) => (t.id === tutorId ? { ...t, status: "inactive" } : t)),
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Tutor"
        description="Kelola akun pengajar, profil, tarif honor, dan status keaktifan."
      >
        <Button
          onClick={() => setCreateOpen(true)}
          size="sm"
          className="gap-1.5 font-medium shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          Tambah Tutor
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, email, atau telepon tutor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
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
            Semua ({tutors.length})
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
            Aktif ({tutors.filter((t) => t.status === "active").length})
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
            Nonaktif ({tutors.filter((t) => t.status === "inactive").length})
          </button>
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
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Nama Tutor</th>
                  <th className="px-4 py-3">Kontak & Email</th>
                  <th className="px-4 py-3">Bio / Spesialisasi</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTutors.map((tutor) => {
                  const isActive = tutor.status === "active";
                  const isLoading = loadingTutorId === tutor.id;
                  const rawName = tutor.profiles?.full_name || "Tutor";
                  const tutorGender = tutor.gender || tutor.profiles?.gender;
                  const isFemale = tutorGender === "female";
                  const title = isFemale ? "Umi" : "Abi";
                  const tutorName = formatTutorDisplayName(rawName, tutorGender);
                  const tutorEmail = tutor.profiles?.email;
                  const tutorPhone = tutor.profiles?.phone;

                  return (
                    <tr
                      key={tutor.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        !isActive ? "opacity-75 bg-muted/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                              isFemale
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            }`}
                          >
                            {title}
                          </span>
                          <Link
                            href={`/management/tutors/${tutor.id}`}
                            className="hover:underline font-semibold text-foreground text-sm"
                          >
                            {tutorName}
                          </Link>
                          {!isActive && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-normal">
                              Nonaktif
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <div className="text-foreground text-xs font-mono">
                            {tutorPhone || "-"}
                          </div>
                          {tutorEmail && (
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                              <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span>{tutorEmail}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-muted-foreground text-xs line-clamp-1 max-w-xs">
                        {tutor.bio || "-"}
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={tutor.status} />
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Lihat Detail */}
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Lihat Detail Tutor"
                            aria-label="Lihat Detail Tutor"
                          >
                            <Link href={`/management/tutors/${tutor.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>

                          {/* Edit Data */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Ubah Data Tutor"
                            aria-label="Ubah Data Tutor"
                            onClick={() => setEditingTutor(tutor)}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          {/* Reset / Kirim Ulang Kredensial */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            title="Reset Password & Kirim Ulang Kredensial"
                            aria-label="Reset Password"
                            onClick={() => setResendingTutor(tutor)}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </Button>

                          {/* Nonaktifkan / Aktifkan Langsung */}
                          {isActive ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isLoading}
                              className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                              title="Nonaktifkan Tutor (Sudah tidak mengajar)"
                              aria-label="Nonaktifkan Tutor"
                              onClick={() => handleToggleStatus(tutor)}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isLoading}
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              title="Aktifkan Kembali Tutor"
                              aria-label="Aktifkan Tutor"
                              onClick={() => handleToggleStatus(tutor)}
                            >
                              <UserCheck className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Hapus Tutor */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                            title="Hapus Tutor"
                            aria-label="Hapus Tutor"
                            onClick={() => setDeletingTutor(tutor)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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

      {/* Dialog Modals */}
      <CreateTutorDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleTutorCreated}
      />

      <EditTutorDialog
        tutor={editingTutor}
        open={Boolean(editingTutor)}
        onOpenChange={(open) => !open && setEditingTutor(null)}
        onSuccess={handleTutorUpdated}
      />

      <ResendCredentialsDialog
        tutor={resendingTutor}
        open={Boolean(resendingTutor)}
        onOpenChange={(open) => !open && setResendingTutor(null)}
      />

      <DeleteTutorDialog
        tutor={deletingTutor}
        open={Boolean(deletingTutor)}
        onOpenChange={(open) => !open && setDeletingTutor(null)}
        onSuccess={handleTutorDeleted}
        onDeactivated={handleTutorDeactivated}
      />
    </div>
  );
}
