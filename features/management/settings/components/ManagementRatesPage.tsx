"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Edit2,
  Trash2,
  Coins,
  Calendar,
  Building2,
  ShieldCheck,
  Search,
  Lock,
  UserCheck,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { managementRateSchema, ManagementRateInput } from "../schemas/settings.schema";
import { saveManagementRate, deleteManagementRate } from "../actions/settings.actions";
import { SYNTHETIC_MANAGEMENT_RATES } from "@/data/payroll";
import { SettingsNavTabs } from "./SettingsNavTabs";

interface ManagementRatesPageProps {
  initialRates?: any[];
  currentSubrole?: string | null;
}

export default function ManagementRatesPage({
  initialRates = [],
  currentSubrole = "owner",
}: ManagementRatesPageProps) {
  const isOwner = currentSubrole === "owner" || currentSubrole === "superadmin" || !currentSubrole;

  const defaultRates =
    initialRates && initialRates.length > 0 ? initialRates : SYNTHETIC_MANAGEMENT_RATES;
  const [rates, setRates] = useState(defaultRates);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<any | null>(null);
  const [deletingRate, setDeletingRate] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ManagementRateInput>({
    resolver: zodResolver(managementRateSchema),
    defaultValues: {
      title: "",
      role_level: "hrd",
      rate_type: "monthly",
      amount: 2500000,
      effective_from: new Date().toISOString().split("T")[0],
      effective_until: null,
      description: "",
      status: "active",
    },
  });

  const openAddDialog = () => {
    setEditingRate(null);
    reset({
      title: "",
      role_level: "hrd",
      rate_type: "monthly",
      amount: 2500000,
      effective_from: new Date().toISOString().split("T")[0],
      effective_until: null,
      description: "",
      status: "active",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: any) => {
    setEditingRate(item);
    reset({
      id: item.id,
      title: item.title,
      role_level: item.role_level,
      rate_type: item.rate_type,
      amount: item.amount,
      effective_from: item.effective_from || new Date().toISOString().split("T")[0],
      effective_until: item.effective_until || null,
      description: item.description || "",
      status: item.status || "active",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: ManagementRateInput) => {
    const res = await saveManagementRate(data);
    if (!res.success) {
      toast.error(res.error || "Gagal menyimpan tarif gaji manajemen.");
      return;
    }

    toast.success(res.message);
    setIsDialogOpen(false);

    const enriched = {
      ...data,
      id: editingRate ? editingRate.id : Date.now().toString(),
    };

    if (editingRate) {
      setRates((prev) => prev.map((r) => (r.id === editingRate.id ? enriched : r)));
    } else {
      setRates((prev) => [enriched, ...prev]);
    }
  };

  const handleDelete = async () => {
    if (!deletingRate) return;
    setIsDeleting(true);
    const res = await deleteManagementRate(deletingRate.id);
    setIsDeleting(false);

    if (!res.success) {
      toast.error(res.error || "Gagal menghapus tarif gaji manajemen.");
      return;
    }

    toast.success(res.message);
    setRates((prev) => prev.filter((r) => r.id !== deletingRate.id));
    setDeletingRate(null);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "hrd":
        return { label: "HRD & Operasional", color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" };
      case "finance":
        return { label: "Keuangan & Finance", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" };
      case "owner":
        return { label: "Owner / Pimpinan", color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" };
      case "admin":
      default:
        return { label: "Admin & CS", color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "allowance":
        return "Tunjangan Operasional";
      case "hourly":
        return "Honor per Aktivitas/Jam";
      case "monthly":
      default:
        return "Gaji Pokok Bulanan";
    }
  };

  const filtered = rates.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.title?.toLowerCase().includes(q) ||
      r.role_level?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Gaji & Tarif Manajemen"
        description="Konfigurasi gaji pokok, tunjangan operasional, dan kompensasi staf manajemen bimbel (HRD, Finance, Admin, Owner)."
      >
        {isOwner && (
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Gaji Manajemen
          </Button>
        )}
      </PageHeader>

      <SettingsNavTabs />

      {/* CALLOUT KHUSUS OWNER */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-50/70 border border-purple-200 dark:bg-purple-950/30 dark:border-purple-900/50 text-purple-900 dark:text-purple-200 text-xs">
        <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm flex items-center gap-1.5">
            Otoritas Khusus Owner Bimbel
            <span className="text-[10px] bg-purple-200 dark:bg-purple-800 px-1.5 py-0.5 rounded font-mono">
              CONFIDENTIAL
            </span>
          </p>
          <p className="mt-1 text-purple-800/90 dark:text-purple-300/90 leading-relaxed">
            Sesuai aturan bisnis, data gaji dan tunjangan pengurus manajemen bersifat rahasia dan hanya dapat
            dikelola oleh <strong>Owner</strong>. HRD dan Finance tidak berhak mengubah struktur gaji pimpinan maupun staf manajemen lainnya.
          </p>
        </div>
      </div>

      {!isOwner && (
        <div className="p-8 text-center bg-card rounded-xl border border-destructive/30 space-y-3">
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-foreground">Akses Pengaturan Gaji Dibatasi</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Anda login dengan peran selain Owner. Anda tidak memiliki izin untuk melihat atau mengubah besaran gaji staf manajemen bimbel.
          </p>
        </div>
      )}

      {isOwner && (
        <>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari judul gaji atau jabatan..."
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
                    <th className="px-4 py-3">Jabatan & Posisi</th>
                    <th className="px-4 py-3">Nama Kompensasi</th>
                    <th className="px-4 py-3">Tipe</th>
                    <th className="px-4 py-3">Besaran Gaji (Rp)</th>
                    <th className="px-4 py-3">Mulai Berlaku</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        Belum ada tarif gaji manajemen yang terdaftar.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((rate) => {
                      const roleBadge = getRoleLabel(rate.role_level);
                      const amountVal = Number(rate.amount) || 0;

                      return (
                        <tr key={rate.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-semibold text-foreground">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${roleBadge.color}`}>
                              <Briefcase className="w-3.5 h-3.5" />
                              {roleBadge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <span className="font-semibold text-foreground">{rate.title}</span>
                              {rate.description && (
                                <span className="block text-xs text-muted-foreground truncate max-w-xs">
                                  {rate.description}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {getTypeLabel(rate.rate_type)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-purple-700 dark:text-purple-300">
                              <Coins className="w-3.5 h-3.5 text-purple-600" />
                              {formatCurrency(amountVal)}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                              {formatDate(rate.effective_from)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={rate.status || "active"} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(rate)}
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                title="Edit Tarif Gaji"
                                aria-label="Edit Tarif Gaji"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingRate(rate)}
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                title="Hapus Tarif Gaji"
                                aria-label="Hapus Tarif Gaji"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* DIALOG TAMBAH / EDIT GAJI MANAJEMEN */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRate ? "Edit Gaji Manajemen" : "Tambah Tarif Gaji Manajemen"}
            </DialogTitle>
            <DialogDescription>
              Atur besaran kompensasi bulanan atau tunjangan posisi manajemen bimbel.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Nama Kompensasi / Jabatan <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                placeholder="Contoh: Gaji Pokok HRD, Tunjangan Finance"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="role_level">Tingkat Jabatan <span className="text-destructive">*</span></Label>
                <Select
                  defaultValue={editingRate?.role_level || "hrd"}
                  onValueChange={(val) => setValue("role_level", val as any)}
                >
                  <SelectTrigger id="role_level">
                    <SelectValue placeholder="Pilih jabatan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner / Pimpinan</SelectItem>
                    <SelectItem value="hrd">HRD & Operasional</SelectItem>
                    <SelectItem value="finance">Keuangan & Finance</SelectItem>
                    <SelectItem value="admin">Admin & Layanan Pelanggan</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role_level && (
                  <p className="text-xs text-destructive">{errors.role_level.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rate_type">Tipe Kompensasi <span className="text-destructive">*</span></Label>
                <Select
                  defaultValue={editingRate?.rate_type || "monthly"}
                  onValueChange={(val) => setValue("rate_type", val as any)}
                >
                  <SelectTrigger id="rate_type">
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Gaji Pokok Bulanan</SelectItem>
                    <SelectItem value="allowance">Tunjangan Operasional</SelectItem>
                    <SelectItem value="hourly">Honor per Aktivitas</SelectItem>
                  </SelectContent>
                </Select>
                {errors.rate_type && (
                  <p className="text-xs text-destructive">{errors.rate_type.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Besaran Nominal (Rp) <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step={50000}
                  placeholder="2500000"
                  {...register("amount", { valueAsNumber: true })}
                />
                <Coins className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
              </div>
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="effective_from">Mulai Berlaku <span className="text-destructive">*</span></Label>
                <Input
                  id="effective_from"
                  type="date"
                  {...register("effective_from")}
                />
                {errors.effective_from && (
                  <p className="text-xs text-destructive">{errors.effective_from.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="effective_until">Berlaku Sampai (Opsional)</Label>
                <Input
                  id="effective_until"
                  type="date"
                  {...register("effective_until")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Deskripsi Tugas / Fasilitas</Label>
              <Textarea
                id="description"
                placeholder="Rincian tanggung jawab atau fasilitas jabatan..."
                rows={2}
                {...register("description")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                defaultValue={editingRate?.status || "active"}
                onValueChange={(val) => setValue("status", val as "active" | "inactive")}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
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
                {isSubmitting ? "Menyimpan..." : editingRate ? "Simpan Perubahan" : "Simpan Gaji"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG KONFIRMASI HAPUS */}
      <AlertDialog open={!!deletingRate} onOpenChange={() => setDeletingRate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tarif Gaji Manajemen?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data kompensasi ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Hapus Gaji"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
