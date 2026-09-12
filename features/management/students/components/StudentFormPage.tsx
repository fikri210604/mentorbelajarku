"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/shared/page-header";
import { studentSchema, StudentInput } from "../schemas/student.schema";
import { createStudent, updateStudent } from "../actions/student.actions";
import { StudentWithPrograms } from "../types";

interface StudentFormPageProps {
  initialData?: StudentWithPrograms | null;
  isEdit?: boolean;
}

export default function StudentFormPage({ initialData, isEdit = false }: StudentFormPageProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudentInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      studentCode: initialData?.student_code || "",
      name: initialData?.name || "",
      gender: (initialData?.gender as "male" | "female") || undefined,
      birthDate: initialData?.birth_date || "",
      school: initialData?.school || "",
      grade: initialData?.grade || "",
      parentName: initialData?.parent_name || "",
      parentPhone: initialData?.parent_phone || "",
      address: initialData?.address || "",
      status: (initialData?.status as "active" | "inactive" | "graduated") || "active",
    },
  });

  const onSubmit = async (data: StudentInput) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      if (isEdit && initialData) {
        const res = await updateStudent(initialData.id, data);
        if (res && !res.success) {
          setSubmitError(res.error || "Gagal memperbarui data murid.");
          return;
        }
        setSubmitSuccess("Data murid berhasil diperbarui!");
        setTimeout(() => {
          router.push(`/management/students/${initialData.id}`);
          router.refresh();
        }, 800);
      } else {
        const res = await createStudent(data);
        if (res && !res.success) {
          setSubmitError(res.error || "Gagal menambahkan murid baru.");
          return;
        }
        setSubmitSuccess("Murid baru berhasil ditambahkan!");
        setTimeout(() => {
          router.push("/management/students");
          router.refresh();
        }, 800);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem saat menyimpan data.";
      setSubmitError(msg);
      console.error("Error saving student:", err);
    }
  };

  const hasValidationErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title={isEdit ? "Edit Data Murid" : "Tambah Murid Baru"}
        description="Lengkapi informasi murid bimbel di bawah ini."
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Kode Murid (NIS) *</label>
                <Input
                  {...register("studentCode")}
                  placeholder="Contoh: STD-2026-001"
                  disabled={isEdit}
                  className="mt-1"
                />
                {errors.studentCode && (
                  <p className="text-xs text-destructive mt-1">{errors.studentCode.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Nama Lengkap *</label>
                <Input {...register("name")} placeholder="Nama lengkap murid" className="mt-1" />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Sekolah</label>
                <Input {...register("school")} placeholder="Contoh: SMAN 1" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Kelas / Tingkat</label>
                <Input {...register("grade")} placeholder="Contoh: 10 SMA" className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Nama Orang Tua</label>
                <Input {...register("parentName")} placeholder="Nama ayah/ibu/wali" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">No. HP Orang Tua</label>
                <Input {...register("parentPhone")} placeholder="081234567890" className="mt-1" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Alamat</label>
              <Input {...register("address")} placeholder="Alamat rumah murid" className="mt-1" />
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
