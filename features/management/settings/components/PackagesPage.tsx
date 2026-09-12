"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, Trash2, PackageCheck, Clock, Calendar, Coins, GraduationCap, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/utils";
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
import { bimbelPackageSchema, BimbelPackageInput } from "../schemas/settings.schema";
import { saveBimbelPackage, deleteBimbelPackage } from "../actions/settings.actions";

const DEFAULT_PACKAGES = [
  {
    id: "pkg-001",
    name: "Reguler SD (8 Sesi)",
    level: "SD",
    max_meetings: 8,
    duration_minutes: 60,
    monthly_price: 350000,
    description: "Paket belajar reguler 8 pertemuan sebulan dengan penguatan konsep terpadu.",
    status: "active",
    bimbel_types: { name: "Reguler" },
  },
  {
    id: "pkg-002",
    name: "Intensif SMP (12 Sesi)",
    level: "SMP",
    max_meetings: 12,
    duration_minutes: 75,
    monthly_price: 550000,
    description: "Pendalaman materi ujian dan persiapan PAS/PAT intensif.",
    status: "active",
    bimbel_types: { name: "Intensif" },
  },
  {
    id: "pkg-003",
    name: "Private 1-on-1 Eksklusif",
    level: "Semua Jenjang",
    max_meetings: 8,
    duration_minutes: 90,
    monthly_price: 850000,
    description: "Bimbingan tatap muka satu murid satu tutor fokus kebutuhan siswa.",
    status: "active",
    bimbel_types: { name: "Private" },
  },
];

interface PackagesPageProps {
  initialPackages?: any[];
  bimbelTypesList?: any[];
}

export default function PackagesPage({
  initialPackages = [],
  bimbelTypesList = [],
}: PackagesPageProps) {
  const defaultPkgs = initialPackages && initialPackages.length > 0 ? initialPackages : DEFAULT_PACKAGES;
  const [packages, setPackages] = useState(defaultPkgs);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any | null>(null);
  const [deletingPackage, setDeletingPackage] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BimbelPackageInput>({
    resolver: zodResolver(bimbelPackageSchema),
    defaultValues: {
      bimbel_type_id: "",
      name: "",
      level: "SD",
      max_meetings: 8,
      duration_minutes: 75,
      monthly_price: 400000,
      description: "",
      status: "active",
    },
  });

  const openAddDialog = () => {
    setEditingPackage(null);
    reset({
      bimbel_type_id: bimbelTypesList[0]?.id || "",
      name: "",
      level: "SD",
      max_meetings: 8,
      duration_minutes: 75,
      monthly_price: 400000,
      description: "",
      status: "active",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: any) => {
    setEditingPackage(item);
    reset({
      id: item.id,
      bimbel_type_id: item.bimbel_type_id || item.bimbel_types?.id || "",
      name: item.name,
      level: item.level,
      max_meetings: item.max_meetings,
      duration_minutes: item.duration_minutes,
      monthly_price: item.monthly_price,
      description: item.description || "",
      status: item.status,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: BimbelPackageInput) => {
    const res = await saveBimbelPackage(data);
    if (!res.success) {
      toast.error(res.error || "Gagal menyimpan paket bimbel.");
      return;
    }

    toast.success(res.message);
    setIsDialogOpen(false);

    const btObj = bimbelTypesList.find((bt) => bt.id === data.bimbel_type_id);
    const enriched = {
      ...data,
      id: editingPackage ? editingPackage.id : Date.now().toString(),
      bimbel_types: btObj || { name: "Reguler" },
    };

    if (editingPackage) {
      setPackages((prev) => prev.map((p) => (p.id === editingPackage.id ? enriched : p)));
    } else {
      setPackages((prev) => [enriched, ...prev]);
    }
  };

  const handleDelete = async () => {
    if (!deletingPackage) return;
    setIsDeleting(true);
    const res = await deleteBimbelPackage(deletingPackage.id);
    setIsDeleting(false);

    if (!res.success) {
      toast.error(res.error || "Gagal menghapus paket belajar.");
      return;
    }

    toast.success(res.message);
    setPackages((prev) => prev.filter((p) => p.id !== deletingPackage.id));
    setDeletingPackage(null);
  };

  const filtered = packages.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.level?.toLowerCase().includes(q) ||
      p.bimbel_types?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Paket Belajar Bimbel"
        description="Konfigurasi paket bimbingan belajar, jatah pertemuan bulanan, durasi, dan biaya per paket."
      >
        <Button onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Paket Belajar
        </Button>
      </PageHeader>

      <SettingsNavTabs />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari paket, jenjang, tipe..."
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
                <th className="px-4 py-3">Nama Paket</th>
                <th className="px-4 py-3">Jenis Bimbel</th>
                <th className="px-4 py-3">Jenjang</th>
                <th className="px-4 py-3">Sesi / Bulan</th>
                <th className="px-4 py-3">Durasi</th>
                <th className="px-4 py-3">Biaya Paket</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Belum ada paket belajar yang terdaftar.
                  </td>
                </tr>
              ) : (
                filtered.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                          <PackageCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span>{pkg.name}</span>
                          {pkg.description && (
                            <span className="block text-xs font-normal text-muted-foreground truncate max-w-xs">
                              {pkg.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {pkg.bimbel_types?.name || "Reguler"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full bg-muted text-xs">
                        <GraduationCap className="w-3 h-3 text-muted-foreground" />
                        {pkg.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">
                      {pkg.max_meetings} Sesi
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {pkg.duration_minutes}m
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(pkg.monthly_price)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={pkg.status || "active"} />
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(pkg)}
                        className="h-8 px-3 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-950/50"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingPackage(pkg)}
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

      {/* DIALOG TAMBAH / EDIT PAKET */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? "Edit Paket Belajar" : "Tambah Paket Belajar Baru"}
            </DialogTitle>
            <DialogDescription>
              Atur kuota pertemuan bulanan, durasi menit, dan biaya paket bimbingan belajar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nama Paket <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                placeholder="Contoh: Reguler SD, Intensif SMP, Calistung TK"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bimbel_type_id">Jenis Bimbel <span className="text-destructive">*</span></Label>
                <Select
                  defaultValue={editingPackage?.bimbel_type_id || editingPackage?.bimbel_types?.id || bimbelTypesList[0]?.id || ""}
                  onValueChange={(val) => {
                    setValue("bimbel_type_id", val);
                    const found = bimbelTypesList.find((bt) => bt.id === val);
                    if (found) {
                      setValue("duration_minutes", found.duration_minutes);
                    }
                  }}
                >
                  <SelectTrigger id="bimbel_type_id">
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    {bimbelTypesList.map((bt) => (
                      <SelectItem key={bt.id} value={bt.id}>
                        {bt.name} ({bt.duration_minutes}m)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.bimbel_type_id && (
                  <p className="text-xs text-destructive">{errors.bimbel_type_id.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="level">Jenjang / Level <span className="text-destructive">*</span></Label>
                <Select
                  defaultValue={editingPackage?.level || "SD"}
                  onValueChange={(val) => setValue("level", val)}
                >
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Pilih jenjang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semua Jenjang">Semua Jenjang</SelectItem>
                    <SelectItem value="TK">TK / PAUD</SelectItem>
                    <SelectItem value="SD">SD (Kelas 1-6)</SelectItem>
                    <SelectItem value="SMP">SMP (Kelas 7-9)</SelectItem>
                    <SelectItem value="SMA">SMA (Kelas 10-12)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.level && (
                  <p className="text-xs text-destructive">{errors.level.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="max_meetings">Pertemuan / Bln <span className="text-destructive">*</span></Label>
                <Input
                  id="max_meetings"
                  type="number"
                  placeholder="8 atau 12"
                  {...register("max_meetings", { valueAsNumber: true })}
                />
                {errors.max_meetings && (
                  <p className="text-xs text-destructive">{errors.max_meetings.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="duration_minutes">Durasi (Menit) <span className="text-destructive">*</span></Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  placeholder="75"
                  {...register("duration_minutes", { valueAsNumber: true })}
                />
                {errors.duration_minutes && (
                  <p className="text-xs text-destructive">{errors.duration_minutes.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="monthly_price">Biaya Paket (Rp) <span className="text-destructive">*</span></Label>
                <Input
                  id="monthly_price"
                  type="number"
                  step={10000}
                  placeholder="400000"
                  {...register("monthly_price", { valueAsNumber: true })}
                />
                {errors.monthly_price && (
                  <p className="text-xs text-destructive">{errors.monthly_price.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Deskripsi Paket</Label>
              <Textarea
                id="description"
                placeholder="Penjelasan fasilitas paket bimbingan..."
                rows={2}
                {...register("description")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Status Paket</Label>
              <Select
                defaultValue={editingPackage?.status || "active"}
                onValueChange={(val) => setValue("status", val as "active" | "inactive")}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif (Dapat dipilih murid)</SelectItem>
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
                {isSubmitting ? "Menyimpan..." : editingPackage ? "Simpan Perubahan" : "Tambahkan Paket"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG KONFIRMASI HAPUS */}
      <AlertDialog open={!!deletingPackage} onOpenChange={() => setDeletingPackage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Paket Belajar?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus paket belajar{" "}
              <strong>&quot;{deletingPackage?.name}&quot;</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Hapus Paket"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
