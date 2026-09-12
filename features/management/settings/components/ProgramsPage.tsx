"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, Trash2, BookOpen, Search, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SettingsNavTabs } from "./SettingsNavTabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { programSchema, ProgramInput } from "../schemas/settings.schema";
import { saveProgram, deleteProgram } from "../actions/settings.actions";
import { SYNTHETIC_PROGRAMS } from "@/data/programs";

interface ProgramsPageProps {
  initialPrograms?: any[];
}

export default function ProgramsPage({ initialPrograms = [] }: ProgramsPageProps) {
  const defaultPrograms = initialPrograms && initialPrograms.length > 0 ? initialPrograms : SYNTHETIC_PROGRAMS;
  const [programs, setPrograms] = useState(defaultPrograms);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<any | null>(null);
  const [deletingProgram, setDeletingProgram] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProgramInput>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      code: "",
      name: "",
      level: "Semua Jenjang",
      description: "",
      status: "active",
    },
  });

  const openAddDialog = () => {
    setEditingProgram(null);
    reset({
      code: "",
      name: "",
      level: "Semua Jenjang",
      description: "",
      status: "active",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: any) => {
    setEditingProgram(item);
    reset({
      id: item.id,
      code: item.code,
      name: item.name,
      level: item.level,
      description: item.description || "",
      status: item.status,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: ProgramInput) => {
    const res = await saveProgram(data);
    if (!res.success) {
      toast.error(res.error || "Gagal menyimpan mata pelajaran.");
      return;
    }

    toast.success(res.message);
    setIsDialogOpen(false);

    if (editingProgram) {
      setPrograms((prev) =>
        prev.map((p) => (p.id === editingProgram.id ? { ...p, ...data } : p))
      );
    } else {
      setPrograms((prev) => [...prev, { ...data, id: Date.now().toString() }]);
    }
  };

  const handleDelete = async () => {
    if (!deletingProgram) return;
    setIsDeleting(true);
    const res = await deleteProgram(deletingProgram.id);
    setIsDeleting(false);

    if (!res.success) {
      toast.error(res.error || "Gagal menghapus mata pelajaran.");
      return;
    }

    toast.success(res.message);
    setPrograms((prev) => prev.filter((p) => p.id !== deletingProgram.id));
    setDeletingProgram(null);
  };

  const filtered = programs.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.code?.toLowerCase().includes(q) ||
      p.level?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Mata Pelajaran & Program"
        description="Kelola daftar mata pelajaran, kode bidang studi, dan jenjang pendidikan bimbingan belajar."
      >
        <Button onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Mata Pelajaran
        </Button>
      </PageHeader>

      <SettingsNavTabs />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari mata pelajaran, kode (MTK), jenjang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold border-b">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Nama Mata Pelajaran</th>
                <th className="px-4 py-3">Jenjang / Level</th>
                <th className="px-4 py-3">Deskripsi</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Belum ada mata pelajaran yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((prog) => (
                  <tr key={prog.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-primary">
                      {prog.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-muted text-muted-foreground">
                          <BookOpen className="w-3.5 h-3.5" />
                        </div>
                        <span>{prog.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full bg-muted text-xs">
                        <GraduationCap className="w-3 h-3 text-muted-foreground" />
                        {prog.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                      {prog.description || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={prog.status} />
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(prog)}
                        className="h-8 px-3 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-950/50"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingProgram(prog)}
                        className="h-8 px-3 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Hapus
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIALOG TAMBAH / EDIT */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProgram ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran Baru"}
            </DialogTitle>
            <DialogDescription>
              Tentukan kode singkatan dan nama mata pelajaran atau bidang studi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 space-y-1.5">
                <Label htmlFor="code">Kode <span className="text-destructive">*</span></Label>
                <Input
                  id="code"
                  placeholder="MTK"
                  className="font-mono uppercase"
                  {...register("code")}
                />
                {errors.code && (
                  <p className="text-xs text-destructive">{errors.code.message}</p>
                )}
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="name">Nama Mata Pelajaran <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  placeholder="Contoh: Matematika"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="level">Jenjang Pendidikan <span className="text-destructive">*</span></Label>
              <Select
                defaultValue={editingProgram?.level || "Semua Jenjang"}
                onValueChange={(val) => setValue("level", val)}
              >
                <SelectTrigger id="level">
                  <SelectValue placeholder="Pilih jenjang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua Jenjang">Semua Jenjang</SelectItem>
                  <SelectItem value="TK">TK / PAUD</SelectItem>
                  <SelectItem value="TK/SD">TK & SD</SelectItem>
                  <SelectItem value="SD">SD (Sekolah Dasar)</SelectItem>
                  <SelectItem value="SD/SMP">SD & SMP</SelectItem>
                  <SelectItem value="SMP">SMP (Sekolah Menengah Pertama)</SelectItem>
                  <SelectItem value="SMA">SMA / SMK (Sekolah Menengah Atas)</SelectItem>
                </SelectContent>
              </Select>
              {errors.level && (
                <p className="text-xs text-destructive">{errors.level.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Deskripsi / Ruang Lingkup Materi</Label>
              <Textarea
                id="description"
                placeholder="Contoh: Aljabar, geometri, aritmatika, kalkulus..."
                rows={2}
                {...register("description")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                defaultValue={editingProgram?.status || "active"}
                onValueChange={(val) => setValue("status", val as "active" | "inactive")}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif (Dapat dipilih di jadwal)</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : editingProgram ? "Simpan Perubahan" : "Tambahkan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG KONFIRMASI HAPUS */}
      <AlertDialog open={!!deletingProgram} onOpenChange={() => setDeletingProgram(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Mata Pelajaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus mata pelajaran{" "}
              <strong>&quot;{deletingProgram?.name}&quot; ({deletingProgram?.code})</strong>?
              Mata pelajaran yang sudah terikat pada jadwal murid aktif tidak dapat dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Hapus Mata Pelajaran"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
