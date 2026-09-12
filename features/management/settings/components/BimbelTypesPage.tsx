"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, Trash2, Layers, Clock, FileText, CheckCircle2, AlertCircle } from "lucide-react";
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
import { bimbelTypeSchema, BimbelTypeInput } from "../schemas/settings.schema";
import { saveBimbelType, deleteBimbelType } from "../actions/settings.actions";
import { SYNTHETIC_BIMBEL_TYPES } from "@/data/bimbel-types";

interface BimbelTypesPageProps {
  initialBimbelTypes?: any[];
}

export default function BimbelTypesPage({ initialBimbelTypes = [] }: BimbelTypesPageProps) {
  const defaultTypes = initialBimbelTypes && initialBimbelTypes.length > 0 ? initialBimbelTypes : SYNTHETIC_BIMBEL_TYPES;
  const [types, setTypes] = useState(defaultTypes);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<any | null>(null);
  const [deletingType, setDeletingType] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BimbelTypeInput>({
    resolver: zodResolver(bimbelTypeSchema),
    defaultValues: {
      name: "",
      duration_minutes: 75,
      description: "",
      status: "active",
    },
  });

  const openAddDialog = () => {
    setEditingType(null);
    reset({
      name: "",
      duration_minutes: 75,
      description: "",
      status: "active",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: any) => {
    setEditingType(item);
    reset({
      id: item.id,
      name: item.name,
      duration_minutes: item.duration_minutes,
      description: item.description || "",
      status: item.status,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: BimbelTypeInput) => {
    const res = await saveBimbelType(data);
    if (!res.success) {
      toast.error(res.error || "Gagal menyimpan jenis bimbel.");
      return;
    }

    toast.success(res.message);
    setIsDialogOpen(false);

    if (editingType) {
      setTypes((prev) =>
        prev.map((t) => (t.id === editingType.id ? { ...t, ...data } : t))
      );
    } else {
      setTypes((prev) => [...prev, { ...data, id: Date.now().toString() }]);
    }
  };

  const handleDelete = async () => {
    if (!deletingType) return;
    setIsDeleting(true);
    const res = await deleteBimbelType(deletingType.id);
    setIsDeleting(false);

    if (!res.success) {
      toast.error(res.error || "Gagal menghapus jenis bimbel.");
      return;
    }

    toast.success(res.message);
    setTypes((prev) => prev.filter((t) => t.id !== deletingType.id));
    setDeletingType(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Jenis Bimbel"
        description="Kelola jenis bimbingan belajar (Reguler, Intensif, Private) dan durasi standar pembelajarannya."
      >
        <Button onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Jenis Bimbel
        </Button>
      </PageHeader>

      <SettingsNavTabs />

      <div className="rounded-md border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold border-b">
              <tr>
                <th className="px-4 py-3">Nama Jenis Bimbel</th>
                <th className="px-4 py-3">Durasi Standar</th>
                <th className="px-4 py-3">Deskripsi</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {types.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Belum ada jenis bimbel yang ditambahkan.
                  </td>
                </tr>
              ) : (
                types.map((bt) => (
                  <tr key={bt.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                          <Layers className="w-4 h-4" />
                        </div>
                        <span>{bt.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-mono font-medium px-2 py-0.5 rounded bg-muted text-xs">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {bt.duration_minutes} Menit
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-md truncate">
                      {bt.description || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={bt.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(bt)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                          title="Edit Jenis Bimbel"
                          aria-label="Edit Jenis Bimbel"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingType(bt)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          title="Hapus Jenis Bimbel"
                          aria-label="Hapus Jenis Bimbel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
              {editingType ? "Edit Jenis Bimbel" : "Tambah Jenis Bimbel Baru"}
            </DialogTitle>
            <DialogDescription>
              Tentukan nama dan durasi belajar dalam menit untuk jadwal dan honor sesi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nama Jenis Bimbel <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                placeholder="Contoh: Reguler, Intensif, Private"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="duration_minutes">Durasi Belajar (Menit) <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="duration_minutes"
                  type="number"
                  placeholder="60, 75, 90"
                  {...register("duration_minutes", { valueAsNumber: true })}
                />
                <Clock className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Reguler: 75m, Intensif: 75m, Private: 90m
              </p>
              {errors.duration_minutes && (
                <p className="text-xs text-destructive">{errors.duration_minutes.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Deskripsi / Keterangan</Label>
              <Textarea
                id="description"
                placeholder="Deskripsi singkat jenis bimbingan..."
                rows={2}
                {...register("description")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Status Aktif</Label>
              <Select
                defaultValue={editingType?.status || "active"}
                onValueChange={(val) => setValue("status", val as "active" | "inactive")}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif (Dapat dipilih)</SelectItem>
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
                {isSubmitting ? "Menyimpan..." : editingType ? "Simpan Perubahan" : "Tambahkan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG KONFIRMASI HAPUS */}
      <AlertDialog open={!!deletingType} onOpenChange={() => setDeletingType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jenis Bimbel?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus jenis bimbel{" "}
              <strong>&quot;{deletingType?.name}&quot;</strong>? Tindakan ini tidak dapat
              dibatalkan jika tidak ada data aktif yang terikat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Hapus Jenis Bimbel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
