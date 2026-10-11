"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ShieldAlert,
  HelpCircle,
  Sparkles,
  Timer,
  Check,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker, TimePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SettingsNavTabs } from "./SettingsNavTabs";
import {
  attendanceWindowSettingSchema,
  AttendanceWindowSettingInput,
} from "../schemas/settings.schema";
import { saveAttendanceWindowSetting } from "../actions/settings.actions";

interface AttendanceWindowSettingsPageProps {
  initialSetting?: any;
}

export default function AttendanceWindowSettingsPage({
  initialSetting,
}: AttendanceWindowSettingsPageProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Default values
  const defaultValues: AttendanceWindowSettingInput = {
    id: initialSetting?.id,
    name: initialSetting?.name || "Pengaturan Standar Presensi",
    open_before_minutes: Number(initialSetting?.open_before_minutes ?? 15),
    close_after_hours: Number(initialSetting?.close_after_hours ?? 4),
    max_days_allowed: Number(initialSetting?.max_days_allowed ?? 1),
    daily_cutoff_time: initialSetting?.daily_cutoff_time || "23:59:59",
    allow_tutor_backdate: Boolean(
      initialSetting?.allow_tutor_backdate ?? false,
    ),
    description:
      initialSetting?.description ||
      "Konfigurasi baku batas waktu presensi dan upload foto sesi oleh tutor.",
    status: initialSetting?.status || "active",
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<AttendanceWindowSettingInput>({
    resolver: zodResolver(attendanceWindowSettingSchema),
    defaultValues,
  });

  const watchOpenBefore = watch("open_before_minutes", 15);
  const watchCloseHours = watch("close_after_hours", 4);
  const watchMaxDays = watch("max_days_allowed", 1);
  const watchAllowBackdate = watch("allow_tutor_backdate", false);

  // State untuk kalkulator simulasi
  const [simDate, setSimDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [simTime, setSimTime] = useState("16:00");

  // Perhitungan simulasi jendela waktu
  const getSimulationResult = () => {
    try {
      const [sh, sm] = simTime.split(":").map(Number);
      const [year, month, day] = simDate.split("-").map(Number);
      const startObj = new Date(year, month - 1, day, sh, sm);

      const openObj = new Date(
        startObj.getTime() - (watchOpenBefore || 0) * 60 * 1000,
      );
      const normalCloseObj = new Date(
        startObj.getTime() + (watchCloseHours || 0) * 60 * 60 * 1000,
      );

      const maxDayObj = new Date(
        year,
        month - 1,
        day + (watchMaxDays || 0),
        23,
        59,
        59,
      );

      const pad = (n: number) => String(n).padStart(2, "0");
      const fmtTime = (d: Date) =>
        `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      const fmtDate = (d: Date) =>
        `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;

      return {
        openTime: `${fmtTime(openObj)} WIB`,
        normalClose: `${fmtTime(normalCloseObj)} WIB (hari yang sama)`,
        maxAllowed:
          (watchMaxDays || 0) > 0
            ? `${fmtDate(maxDayObj)} pukul 23:59 WIB (H+${watchMaxDays})`
            : `${fmtTime(normalCloseObj)} WIB (H+0)`,
      };
    } catch {
      return {
        openTime: "-",
        normalClose: "-",
        maxAllowed: "-",
      };
    }
  };

  const simResult = getSimulationResult();

  const onSubmit = async (data: AttendanceWindowSettingInput) => {
    setIsSaving(true);
    try {
      const res = await saveAttendanceWindowSetting(data);
      if (res.success) {
        toast.success(
          res.message || "Master batas waktu absensi berhasil diperbarui.",
        );
        if (res.data?.id) {
          setValue("id", res.data.id);
        }
      } else {
        toast.error(res.error || "Gagal menyimpan pengaturan.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem saat menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsNavTabs />

      <PageHeader
        title="Batas Waktu Absensi & Toleransi Presensi"
        description="Konfigurasi waktu buka presensi sebelum jadwal mulai dan batas akhir toleransi keterlambatan upload absensi tutor."
      />

      {/* Header Info Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                Master Batas Waktu & Toleransi Upload Presensi
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Aturan ini mengontrol kapan tombol presensi dibuka untuk tutor,
              berapa lama batas toleransi pengunggahan foto bukti belajar, serta
              batas hari maksimal sebelum pengisian kedaluwarsa.
            </p>
          </div>
          <Badge
            variant="outline"
            className="self-start sm:self-center px-3 py-1 gap-1.5 border-primary/30 text-primary"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Berlaku Global</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Konfigurasi Utama */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Timer className="w-4 h-4 text-primary" />
                Konfigurasi Jendela Waktu
              </CardTitle>
              <CardDescription className="text-xs">
                Sesuaikan parameter jam dan toleransi hari sesuai kebijakan
                operasional bimbel
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-5">
                {/* 1. Nama Kebijakan */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold">
                    Nama Konfigurasi
                  </Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Contoh: Pengaturan Standar Presensi"
                    className="h-9 text-sm"
                  />
                  {errors.name && (
                    <p className="text-[11px] text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* 2. Jam Buka Awal (Menit) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="open_before_minutes"
                        className="text-xs font-semibold"
                      >
                        Buka Presensi Lebih Awal
                      </Label>
                      <span className="text-[11px] font-mono text-primary font-bold">
                        {watchOpenBefore} menit
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        id="open_before_minutes"
                        type="number"
                        min={0}
                        max={180}
                        {...register("open_before_minutes", {
                          valueAsNumber: true,
                        })}
                        className="h-9 text-sm"
                      />
                      <span className="text-xs text-muted-foreground shrink-0">
                        menit sebelum jadwal
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Tutor bisa mulai membuka kamera {watchOpenBefore} menit
                      sebelum jam mulai.
                    </p>
                    {errors.open_before_minutes && (
                      <p className="text-[11px] text-destructive">
                        {errors.open_before_minutes.message}
                      </p>
                    )}
                  </div>

                  {/* 3. Toleransi Jam Upload */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="close_after_hours"
                        className="text-xs font-semibold"
                      >
                        Toleransi Jam Upload
                      </Label>
                      <span className="text-[11px] font-mono text-primary font-bold">
                        {watchCloseHours} jam
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        id="close_after_hours"
                        type="number"
                        min={1}
                        max={72}
                        {...register("close_after_hours", {
                          valueAsNumber: true,
                        })}
                        className="h-9 text-sm"
                      />
                      <span className="text-xs text-muted-foreground shrink-0">
                        jam setelah mulai
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Batas waktu normal upload foto dan submit presensi setelah
                      jam mengajar.
                    </p>
                    {errors.close_after_hours && (
                      <p className="text-[11px] text-destructive">
                        {errors.close_after_hours.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* 4. Toleransi Keterlambatan Hari (H+N) */}
                <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="max_days_allowed"
                        className="text-xs font-semibold"
                      >
                        Toleransi Hari Keterlambatan Upload (H+N Hari)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Mengizinkan tutor yang memiliki kendala untuk upload di
                        keesokan harinya hingga pukul 23:59.
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="font-mono text-xs shrink-0"
                    >
                      H+{watchMaxDays} Hari
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 max-w-xs">
                    <Input
                      id="max_days_allowed"
                      type="number"
                      min={0}
                      max={30}
                      {...register("max_days_allowed", { valueAsNumber: true })}
                      className="h-9 text-sm"
                    />
                    <span className="text-xs text-muted-foreground">
                      hari (
                      {watchMaxDays === 0
                        ? "hanya hari H"
                        : `s/d H+${watchMaxDays}`}
                      )
                    </span>
                  </div>
                  {errors.max_days_allowed && (
                    <p className="text-[11px] text-destructive">
                      {errors.max_days_allowed.message}
                    </p>
                  )}
                </div>

                {/* 5. Switch Backdate Bebas */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5">
                  <div className="space-y-0.5 pr-4">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <Label
                        htmlFor="allow_tutor_backdate"
                        className="text-xs font-semibold text-foreground cursor-pointer"
                      >
                        Izinkan Bebas Backdate Tanpa Batas (Mode Fleksibel)
                      </Label>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Jika aktif, tutor dapat mengisi presensi sesi kapan saja
                      tanpa batas kedaluwarsa waktu.
                    </p>
                  </div>
                  <Switch
                    id="allow_tutor_backdate"
                    checked={watchAllowBackdate}
                    onCheckedChange={(checked) =>
                      setValue("allow_tutor_backdate", checked, {
                        shouldDirty: true,
                      })
                    }
                  />
                </div>

                {/* 6. Deskripsi / Catatan SOP */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="description"
                    className="text-xs font-semibold"
                  >
                    Catatan Kebijakan & SOP Presensi
                  </Label>
                  <Textarea
                    id="description"
                    rows={3}
                    {...register("description")}
                    placeholder="Instruksi untuk tutor terkait batas waktu upload presensi..."
                    className="text-xs resize-none"
                  />
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t border-border flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => reset(defaultValues)}
                  className="text-xs gap-1.5 text-muted-foreground"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Bawaan</span>
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="text-xs gap-1.5 min-w-32 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Panel Simulator & Panduan Probis */}
        <div className="lg:col-span-5 space-y-6">
          {/* Simulator Interaktif */}
          <Card className="shadow-xs border-primary/20 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-primary">
                <Sparkles className="w-4 h-4" />
                Simulator Jendela Waktu
              </CardTitle>
              <CardDescription className="text-xs">
                Cek hasil perhitungan waktu presensi tutor berdasarkan simulasi
                sesi berikut
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">
                    Contoh Tanggal Sesi
                  </Label>
                  <DatePicker
                    value={simDate}
                    onChange={(_, str) => setSimDate(str)}
                    placeholder="Pilih tanggal sesi"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">
                    Jam Mulai Sesi
                  </Label>
                  <TimePicker
                    value={simTime}
                    onChange={(t) => setSimTime(t)}
                    placeholder="Pilih jam mulai"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2.5 p-3.5 rounded-xl border border-border bg-muted/30 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-muted-foreground">
                    Waktu Buka Presensi:
                  </span>
                  <span className="font-semibold text-foreground font-mono">
                    {simResult.openTime}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-muted-foreground">
                    Batas Normal Sesi:
                  </span>
                  <span className="font-semibold text-foreground font-mono">
                    {simResult.normalClose}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Batas Maksimal Upload:
                  </span>
                  <span className="font-bold text-primary font-mono">
                    {simResult.maxAllowed}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Dispensasi Override Per Sesi</span>
                </div>
                <p className="text-[10.5px] leading-relaxed opacity-90">
                  Jika ada tutor yang terlambat upload melebihi batas di atas,
                  Admin dapat membuka dispensasi tanggal khusus pada halaman
                  detail sesi terkait tanpa perlu mengubah aturan global.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Panduan Probis Bimbel */}
          <Card className="shadow-xs border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                Rekomendasi Kebijakan Bimbel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <p>
                  <strong className="text-foreground">
                    Sesi Reguler / Sore:
                  </strong>{" "}
                  Toleransi 4-6 jam memastikan tutor dapat submit absensi
                  sebelum tengah malam di hari yang sama.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <p>
                  <strong className="text-foreground">
                    Toleransi H+1 Hari:
                  </strong>{" "}
                  Direkomendasikan aktif agar tutor yang mengajar sesi malam
                  (misal selesai 20.00) tetap dapat mengunggah foto di keesokan
                  paginya.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <p>
                  <strong className="text-foreground">
                    Integritas Payroll:
                  </strong>{" "}
                  Sesi yang absensinya terverifikasi tepat waktu menjadi dasar
                  otomatis perhitungan payroll tutor di akhir bulan.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
