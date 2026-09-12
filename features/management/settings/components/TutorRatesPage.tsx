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
  Layers,
  GraduationCap,
  Search,
  Info,
  CheckCircle2,
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
import { tutorRateSchema, TutorRateInput } from "../schemas/settings.schema";
import { saveTutorRate, deleteTutorRate } from "../actions/settings.actions";
import { SYNTHETIC_TUTOR_RATES } from "@/data/payroll";
import { SettingsNavTabs } from "./SettingsNavTabs";

interface TutorRatesPageProps {
  initialRates?: any[];
  bimbelTypesList?: any[];
}

export default function TutorRatesPage({
  initialRates = [],
  bimbelTypesList = [],
}: TutorRatesPageProps) {
  const defaultRates =
    initialRates && initialRates.length > 0 ? initialRates : SYNTHETIC_TUTOR_RATES;
  const [rates, setRates] = useState(defaultRates);
  const [search, setSearch] = useState("");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<any | null>(null);
  const [deletingRate, setDeletingRate] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TutorRateInput>({
    resolver: zodResolver(tutorRateSchema),
    defaultValues: {
      bimbel_type_id: "",
      level: "SD",
      rate_per_student: 10000,
      effective_from: new Date().toISOString().split("T")[0],
      effective_until: null,
      notes: "",
      status: "active",
    },
  });

  const currentLevel = watch("level");
  const currentBimbelId = watch("bimbel_type_id");

  const openAddDialog = () => {
    setEditingRate(null);
    reset({
      bimbel_type_id: bimbelTypesList[0]?.id || "bt-reg-001",
      level: "SD",
      rate_per_student: 10000,
      effective_from: new Date().toISOString().split("T")[0],
      effective_until: null,
      notes: "Tarif standar murid SD untuk bimbel Reguler.",
      status: "active",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: any) => {
    setEditingRate(item);
    reset({
      id: item.id,
      bimbel_type_id: item.bimbel_type_id || item.bimbel_types?.id || "",
      level: item.level || "SD",
      rate_per_student: item.rate_per_student,
      effective_from: item.effective_from || new Date().toISOString().split("T")[0],
      effective_until: item.effective_until || null,
      notes: item.notes || "",
      status: item.status || "active",
    });
    setIsDialogOpen(true);
  };

  const applyPresetRate = (level: string, isIntensif: boolean) => {
    setValue("level", level);
    if (level === "SD") {
      setValue("rate_per_student", isIntensif ? 15000 : 10000);
      setValue("notes", `Tarif standar murid SD (${isIntensif ? "Intensif Rp15.000" : "Reguler Rp10.000"}).`);
    } else if (level === "SMP") {
      setValue("rate_per_student", 20000);
      setValue("notes", "Tarif standar murid SMP (Reguler & Intensif Rp20.000).");
    } else if (level === "SMA") {
      setValue("rate_per_student", 25000);
      setValue("notes", "Tarif standar murid SMA (Reguler & Intensif Rp25.000).");
    }
  };

  const onSubmit = async (data: TutorRateInput) => {
    const res = await saveTutorRate(data);
    if (!res.success) {
      toast.error(res.error || "Gagal menyimpan standar tarif honor tutor.");
      return;
    }

    toast.success(res.message);
    setIsDialogOpen(false);

    const bimbelObj = bimbelTypesList.find((b) => b.id === data.bimbel_type_id);
    const enriched = {
      ...data,
      id: editingRate ? editingRate.id : Date.now().toString(),
      bimbel_types: bimbelObj || { name: "Reguler" },
      bimbel_type_name: bimbelObj ? bimbelObj.name : "Reguler",
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
    const res = await deleteTutorRate(deletingRate.id);
    setIsDeleting(false);

    if (!res.success) {
      toast.error(res.error || "Gagal menghapus tarif tutor.");
      return;
    }

    toast.success(res.message);
    setRates((prev) => prev.filter((r) => r.id !== deletingRate.id));
    setDeletingRate(null);
  };

  const filtered = rates.filter((r) => {
    const q = search.toLowerCase();
    const bimbelName = r.bimbel_types?.name || r.bimbel_type_name || "";
    const levelName = r.level || "";
    const matchesSearch =
      bimbelName.toLowerCase().includes(q) ||
      levelName.toLowerCase().includes(q) ||
      (r.notes && r.notes.toLowerCase().includes(q));

    if (selectedLevelFilter !== "ALL") {
      return matchesSearch && levelName === selectedLevelFilter;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Standar Tarif Honor Tutor (Per Jenjang & Jenis Bimbel)"
        description="Konfigurasi honor mengajar per anak per jenis bimbel dan jenjang (SD, SMP, SMA). Berlaku seragam untuk seluruh tutor berdasarkan absensi kehadiran murid."
      >
        <Button onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Atur Tarif Baru
        </Button>
      </PageHeader>

      <SettingsNavTabs />

      {/* CALLOUT RANGKUMAN ATURAN BISNIS GAJI TERBARU */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/50 text-blue-900 dark:text-blue-200 text-xs space-y-2">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <p className="font-bold text-sm">Standar Perhitungan Honor Tutor Bimbel:</p>
        </div>
        <p className="text-blue-800/90 dark:text-blue-300/90 leading-relaxed">
          Seluruh tutor mendapatkan tarif honor yang <strong>sama per anak yang hadir</strong> sesuai jenjang pendidikan dan jenis bimbel:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-xs">
          <div className="p-2.5 rounded-lg bg-white/70 dark:bg-blue-900/40 border border-blue-200/60 dark:border-blue-800/50">
            <span className="font-bold text-foreground block">Jenjang SD:</span>
            <span>• Reguler: <strong>Rp10.000</strong> / murid</span><br />
            <span>• Intensif: <strong>Rp15.000</strong> / murid</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white/70 dark:bg-blue-900/40 border border-blue-200/60 dark:border-blue-800/50">
            <span className="font-bold text-foreground block">Jenjang SMP:</span>
            <span>• Reguler: <strong>Rp20.000</strong> / murid</span><br />
            <span>• Intensif: <strong>Rp20.000</strong> / murid</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white/70 dark:bg-blue-900/40 border border-blue-200/60 dark:border-blue-800/50">
            <span className="font-bold text-foreground block">Jenjang SMA:</span>
            <span>• Reguler & Intensif: <strong>Rp25.000</strong> / murid</span><br />
            <span>• Private 1-on-1: <strong>Rp50.000</strong> / murid</span>
          </div>
        </div>
      </div>

      {/* FILTER LEVEL & SEARCH */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari jenjang, jenis bimbel, atau catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg text-xs font-medium">
          {["ALL", "SD", "SMP", "SMA", "Semua Jenjang"].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedLevelFilter(lvl)}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                selectedLevelFilter === lvl
                  ? "bg-background text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {lvl === "ALL" ? "Semua" : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* TABEL TARIF */}
      <div className="rounded-md border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold border-b">
              <tr>
                <th className="px-4 py-3">Jenjang</th>
                <th className="px-4 py-3">Jenis Bimbel</th>
                <th className="px-4 py-3">Tarif per Murid Hadir</th>
                <th className="px-4 py-3">Simulasi Fee Sesi</th>
                <th className="px-4 py-3">Mulai Berlaku</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Belum ada standar tarif honor yang terkonfigurasi.
                  </td>
                </tr>
              ) : (
                filtered.map((rate) => {
                  const bimbelName = rate.bimbel_types?.name || rate.bimbel_type_name || "Reguler";
                  const rateVal = Number(rate.rate_per_student) || 10000;
                  const levelVal = rate.level || "SD";

                  return (
                    <tr key={rate.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-muted text-foreground">
                          <GraduationCap className="w-3.5 h-3.5 text-primary" />
                          {levelVal}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-md bg-primary/10 text-primary">
                            <Layers className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-semibold text-foreground">{bimbelName}</span>
                            {rate.notes && (
                              <span className="block text-xs font-normal text-muted-foreground truncate max-w-xs">
                                {rate.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          <Coins className="w-3.5 h-3.5" />
                          {formatCurrency(rateVal)} / murid
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <div className="flex flex-col gap-0.5 text-muted-foreground">
                          <span>1 murid: <strong className="text-foreground">{formatCurrency(rateVal * 1)}</strong></span>
                          <span>4 murid: <strong className="text-foreground">{formatCurrency(rateVal * 4)}</strong></span>
                        </div>
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
                            title="Edit Tarif Honor"
                            aria-label="Edit Tarif Honor"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingRate(rate)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            title="Hapus Tarif Honor"
                            aria-label="Hapus Tarif Honor"
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

      {/* DIALOG TAMBAH / EDIT TARIF */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRate ? "Edit Standar Tarif Honor" : "Atur Standar Tarif Honor Baru"}
            </DialogTitle>
            <DialogDescription>
              Tentukan standar tarif honor tutor per murid berdasarkan jenjang dan jenis bimbel.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="level">Jenjang Pendidikan <span className="text-destructive">*</span></Label>
                <Select
                  defaultValue={editingRate?.level || "SD"}
                  onValueChange={(val) => {
                    setValue("level", val);
                    const isIntensif = currentBimbelId.includes("int");
                    applyPresetRate(val, isIntensif);
                  }}
                >
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Pilih jenjang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SD">SD (Kelas 1-6)</SelectItem>
                    <SelectItem value="SMP">SMP (Kelas 7-9)</SelectItem>
                    <SelectItem value="SMA">SMA (Kelas 10-12)</SelectItem>
                    <SelectItem value="TK">TK / Calistung</SelectItem>
                    <SelectItem value="Semua Jenjang">Semua Jenjang</SelectItem>
                  </SelectContent>
                </Select>
                {errors.level && (
                  <p className="text-xs text-destructive">{errors.level.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bimbel_type_id">Jenis Bimbel <span className="text-destructive">*</span></Label>
                <Select
                  defaultValue={editingRate?.bimbel_type_id || editingRate?.bimbel_types?.id || bimbelTypesList[0]?.id || "bt-reg-001"}
                  onValueChange={(val) => {
                    setValue("bimbel_type_id", val);
                    const btObj = bimbelTypesList.find((b) => b.id === val);
                    const isInt = btObj?.name?.toLowerCase().includes("intensif") || val.includes("int");
                    applyPresetRate(currentLevel || "SD", isInt);
                  }}
                >
                  <SelectTrigger id="bimbel_type_id">
                    <SelectValue placeholder="Pilih jenis bimbel" />
                  </SelectTrigger>
                  <SelectContent>
                    {bimbelTypesList.length > 0 ? (
                      bimbelTypesList.map((bt) => (
                        <SelectItem key={bt.id} value={bt.id}>
                          {bt.name} ({bt.duration_minutes}m)
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="bt-reg-001">Reguler (60m)</SelectItem>
                        <SelectItem value="bt-int-002">Intensif (75m)</SelectItem>
                        <SelectItem value="bt-prv-003">Private (90m)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {errors.bimbel_type_id && (
                  <p className="text-xs text-destructive">{errors.bimbel_type_id.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rate_per_student">Tarif Honor per Murid Hadir (Rp) <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="rate_per_student"
                  type="number"
                  step={1000}
                  placeholder="10000"
                  {...register("rate_per_student", { valueAsNumber: true })}
                />
                <Coins className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Acuan: SD Reguler Rp10.000, SD Intensif Rp15.000, SMP Rp20.000, SMA Rp25.000.
              </p>
              {errors.rate_per_student && (
                <p className="text-xs text-destructive">{errors.rate_per_student.message}</p>
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
              <Label htmlFor="notes">Keterangan / Catatan Tambahan</Label>
              <Textarea
                id="notes"
                placeholder="Catatan ketentuan honor jenjang & bimbel ini..."
                rows={2}
                {...register("notes")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Status Tarif</Label>
              <Select
                defaultValue={editingRate?.status || "active"}
                onValueChange={(val) => setValue("status", val as "active" | "inactive")}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif (Digunakan saat ini)</SelectItem>
                  <SelectItem value="inactive">Nonaktif / Riwayat Lampau</SelectItem>
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
                {isSubmitting ? "Menyimpan..." : editingRate ? "Simpan Perubahan" : "Tetapkan Tarif"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG KONFIRMASI HAPUS */}
      <AlertDialog open={!!deletingRate} onOpenChange={() => setDeletingRate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Standar Tarif?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus standar tarif honor ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Hapus Tarif"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
