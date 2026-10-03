"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/shared/page-header";
import { studentSchema, StudentInput } from "../schemas/student.schema";
import { createStudent, updateStudent } from "../actions/student.actions";
import { StudentWithPrograms } from "../types";
import { toast } from "sonner";

interface StudentFormPageProps {
  initialData?: StudentWithPrograms | null;
  isEdit?: boolean;
}

const EDUCATION_LEVELS = [
  { value: "TK/PAUD", label: "TK / PAUD (Pendidikan Anak Usia Dini)" },
  { value: "SD", label: "SD (Sekolah Dasar)" },
  { value: "SMP", label: "SMP (Sekolah Menengah Pertama)" },
  { value: "SMA", label: "SMA / SMK (Sekolah Menengah Atas)" },
  { value: "Umum", label: "Alumni / Gap Year / Umum" },
] as const;

const GRADE_OPTIONS_BY_LEVEL: Record<string, string[]> = {
  "TK/PAUD": ["PAUD / Kelompok Bermain (KB)", "TK A", "TK B"],
  "SD": ["1 SD", "2 SD", "3 SD", "4 SD", "5 SD", "6 SD"],
  "SMP": ["7 SMP", "8 SMP", "9 SMP"],
  "SMA": ["10 SMA", "11 SMA", "12 SMA"],
  "Umum": ["Alumni / Gap Year", "Persiapan UTBK / Kedinasan", "Umum"],
};

const BIMBEL_TYPE_OPTIONS = [
  { value: "Reguler", label: "Reguler (60 Menit - Standar)", duration: 60 },
  { value: "Intensif", label: "Intensif (75 Menit - Percepatan & Ujian)", duration: 75 },
  { value: "Private", label: "Private (90 Menit - 1-on-1 Eksklusif)", duration: 90 },
] as const;

export default function StudentFormPage({ initialData, isEdit = false }: StudentFormPageProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Deteksi nilai awal tingkat pendidikan dari data yang ada
  const initialLevel: "TK/PAUD" | "SD" | "SMP" | "SMA" | "Umum" = (() => {
    if (initialData?.level && ["TK/PAUD", "SD", "SMP", "SMA", "Umum"].includes(initialData.level)) {
      return initialData.level as "TK/PAUD" | "SD" | "SMP" | "SMA" | "Umum";
    }
    const g = initialData?.grade?.toUpperCase() || "";
    if (g.includes("TK") || g.includes("PAUD") || g.includes("KB")) return "TK/PAUD";
    if (g.includes("SMP") || g.includes("7") || g.includes("8") || g.includes("9")) return "SMP";
    if (g.includes("SMA") || g.includes("SMK") || g.includes("10") || g.includes("11") || g.includes("12")) return "SMA";
    if (g.includes("ALUMNI") || g.includes("UTBK")) return "Umum";
    return "SD";
  })();

  // Deteksi jenis bimbel murid dari enrollment atau profil
  const initialBimbelType: "Reguler" | "Intensif" | "Private" = (() => {
    const rawType =
      (initialData as any)?.bimbel_type ||
      initialData?.enrollments?.[0]?.bimbel_types?.name ||
      initialData?.student_programs?.[0]?.bimbel_types?.name ||
      "Reguler";
    if (rawType.toLowerCase().includes("private")) return "Private";
    if (rawType.toLowerCase().includes("intensif")) return "Intensif";
    return "Reguler";
  })();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StudentInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      studentCode: initialData?.student_code || "",
      name: initialData?.name || "",
      gender: (initialData?.gender as "male" | "female") || "male",
      birthDate: initialData?.birth_date || "",
      school: initialData?.school || "",
      level: initialLevel,
      grade: initialData?.grade || GRADE_OPTIONS_BY_LEVEL[initialLevel][0],
      bimbelType: initialBimbelType,
      parentName: initialData?.parent_name || "",
      parentPhone: initialData?.parent_phone || "",
      address: initialData?.address || "",
      status: (initialData?.status as "active" | "inactive" | "graduated") || "active",
    },
  });

  const watchLevel = watch("level") || "SD";
  const watchGrade = watch("grade");
  const watchBimbelType = watch("bimbelType") || "Reguler";

  const currentGradeOptions = GRADE_OPTIONS_BY_LEVEL[watchLevel] || GRADE_OPTIONS_BY_LEVEL["SD"];

  const handleLevelChange = (newLevel: "TK/PAUD" | "SD" | "SMP" | "SMA" | "Umum") => {
    setValue("level", newLevel);
    const options = GRADE_OPTIONS_BY_LEVEL[newLevel];
    if (options && options.length > 0) {
      setValue("grade", options[0]);
    }
  };

  const onSubmit = async (data: StudentInput) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      if (isEdit && initialData) {
        const res = await updateStudent(initialData.id, data);
        if (res && !res.success) {
          const errText = (res as any)?.error || "Gagal memperbarui data murid.";
          setSubmitError(errText);
          toast.error(errText);
          return;
        }
        setSubmitSuccess("Data murid berhasil diperbarui!");
        toast.success("Data murid berhasil diperbarui!");
        setTimeout(() => {
          router.push(`/management/students/${initialData.id}`);
          router.refresh();
        }, 800);
      } else {
        const res = await createStudent(data);
        if (res && !res.success) {
          const errText = (res as any)?.error || "Gagal menambahkan murid baru.";
          setSubmitError(errText);
          toast.error(errText);
          return;
        }
        setSubmitSuccess("Murid baru berhasil ditambahkan!");
        toast.success("Murid baru berhasil ditambahkan!");
        setTimeout(() => {
          router.push("/management/students");
          router.refresh();
        }, 800);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem saat menyimpan data.";
      setSubmitError(msg);
      toast.error(msg);
      console.error("Error saving student:", err);
    }
  };

  const hasValidationErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title={isEdit ? "Edit Data Murid" : "Tambah Murid Baru"}
        description="Lengkapi informasi data murid, jenjang sekolah, dan format paket bimbingan belajar."
      >
        <Button asChild variant="outline" size="sm">
          <Link href={isEdit && initialData ? `/management/students/${initialData.id}` : "/management/students"}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Batal
          </Link>
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Banner Alert Validasi Error */}
        {hasValidationErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Validasi Formulir Gagal</AlertTitle>
            <AlertDescription>
              Terdapat data yang belum sesuai. Mohon periksa kolom bertanda merah di bawah.
            </AlertDescription>
          </Alert>
        )}

        {/* Banner Alert Error Server */}
        {submitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Gagal Menyimpan Data</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        {/* Banner Alert Sukses */}
        {submitSuccess && (
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Berhasil Disimpan</AlertTitle>
            <AlertDescription>{submitSuccess}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Formulir Data Murid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* NIS & Nama */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Kode Murid (NIS) *</label>
                <Input
                  {...register("studentCode")}
                  placeholder="Contoh: STD-2026-001"
                  disabled={isEdit}
                  className="mt-1 text-xs"
                />
                {errors.studentCode && (
                  <p className="text-xs text-destructive mt-1">{errors.studentCode.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Nama Lengkap *</label>
                <Input {...register("name")} placeholder="Nama lengkap murid" className="mt-1 text-xs" />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
                )}
              </div>
            </div>

            {/* Sekolah, Tingkat & Kelas (Dropdown Berantai) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Sekolah Asal</label>
                <Input {...register("school")} placeholder="Contoh: TK Pertiwi / SDN 1" className="mt-1 text-xs" />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Tingkat Pendidikan *</label>
                <select
                  value={watchLevel}
                  onChange={(e) => handleLevelChange(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-xs bg-background"
                >
                  {EDUCATION_LEVELS.map((lvl) => (
                    <option key={lvl.value} value={lvl.value}>
                      {lvl.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Kelas / Rombel *</label>
                <select
                  value={watchGrade || currentGradeOptions[0]}
                  onChange={(e) => setValue("grade", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-xs bg-background"
                >
                  {currentGradeOptions.map((grd) => (
                    <option key={grd} value={grd}>
                      {grd}
                    </option>
                  ))}
                </select>
                {errors.grade && (
                  <p className="text-xs text-destructive mt-1">{errors.grade.message}</p>
                )}
              </div>
            </div>

            {/* Jenis Bimbel & Jenis Kelamin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Jenis Bimbel *</label>
                <select
                  value={watchBimbelType}
                  onChange={(e) => setValue("bimbelType", e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-xs bg-background"
                >
                  {BIMBEL_TYPE_OPTIONS.map((bt) => (
                    <option key={bt.value} value={bt.value}>
                      {bt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Otomatis menentukan durasi jadwal sesi belajar dan penyesuaian tarif honor tutor.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Jenis Kelamin</label>
                <select
                  {...register("gender")}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-xs bg-background"
                >
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                </select>
              </div>
            </div>

            {/* Tanggal Lahir */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Tanggal Lahir (Opsional)</label>
                <div className="mt-1">
                  <DatePicker
                    value={watch("birthDate")}
                    onChange={(_, str) => setValue("birthDate", str || null)}
                    placeholder="Pilih tanggal lahir murid"
                    maxDate={new Date()}
                    fromYear={1970}
                    clearable
                  />
                </div>
              </div>
            </div>

            {/* Data Orang Tua */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Nama Orang Tua / Wali</label>
                <Input {...register("parentName")} placeholder="Nama ayah/ibu/wali" className="mt-1 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">No. HP / WhatsApp Orang Tua</label>
                <Input {...register("parentPhone")} placeholder="081234567890" className="mt-1 text-xs" />
              </div>
            </div>

            {/* Alamat */}
            <div>
              <label className="text-xs font-semibold text-foreground">Alamat Domisili</label>
              <Input {...register("address")} placeholder="Alamat rumah murid" className="mt-1 text-xs" />
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Menyimpan..." : "Simpan Data"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
