"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Coins,
  User,
  Mail,
  Phone,
  Edit2,
  KeyRound,
  Trash2,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/utils";
import { TutorWithProfile } from "../types";
import { EditTutorDialog } from "./EditTutorDialog";
import { ResendCredentialsDialog } from "./ResendCredentialsDialog";
import { DeleteTutorDialog } from "./DeleteTutorDialog";
import { formatTutorDisplayName } from "../utils/tutor-greeting";

interface TutorDetailPageProps {
  tutor: TutorWithProfile | null;
}

export default function TutorDetailPage({
  tutor: initialTutor,
}: TutorDetailPageProps) {
  const router = useRouter();
  const [tutor, setTutor] = useState<TutorWithProfile | null>(initialTutor);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResendOpen, setIsResendOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (!tutor) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">Tutor tidak ditemukan</h2>
        <p className="text-sm text-muted-foreground">
          Data tutor ini mungkin telah dihapus atau tidak terdaftar.
        </p>
        <Button asChild variant="outline">
          <Link href="/management/tutors">Kembali ke Daftar Tutor</Link>
        </Button>
      </div>
    );
  }

  const tutorGender = tutor.gender || tutor.profiles?.gender;
  const isFemale = tutorGender === "female";
  const tutorName = formatTutorDisplayName(tutor.profiles?.full_name || "Detail Tutor", tutorGender);
  const tutorEmail = tutor.profiles?.email || "-";
  const tutorPhone = tutor.profiles?.phone || "-";

  return (
    <div className="space-y-6">
      <PageHeader
        title={tutorName}
        description={`Panggilan: ${isFemale ? "Umi" : "Abi"} • Status: ${tutor.status === "active" ? "Aktif Mengajar" : "Nonaktif"} • Kontak: ${tutorPhone}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/management/tutors">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Kembali
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            className="gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Ubah Profil
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsResendOpen(true)}
            className="gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Reset Kredensial
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
            className="gap-1.5 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Profil */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span>Profil & Akun Pengajar</span>
              </div>
              <StatusBadge status={tutor.status} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-muted-foreground block text-xs">
                  Nama Lengkap
                </span>
                <span className="font-semibold text-foreground text-base">
                  {tutorName}
                </span>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                  isFemale
                    ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                    : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                }`}
              >
                {isFemale ? "Umi (Perempuan)" : "Abi (Laki-laki)"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-muted-foreground block text-xs flex items-center gap-1">
                  <Mail className="w-3 h-3 text-muted-foreground" />
                  Alamat Email (Login)
                </span>
                <span className="font-mono text-xs font-medium text-foreground">
                  {tutorEmail}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-xs flex items-center gap-1">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  Nomor HP / WhatsApp
                </span>
                <span className="font-mono text-xs font-medium text-foreground">
                  {tutorPhone}
                </span>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-muted-foreground block text-xs">
                Bio / Spesialisasi Mengajar
              </span>
              <p className="font-normal text-muted-foreground text-xs mt-0.5 leading-relaxed bg-muted/30 p-2.5 rounded-md border">
                {tutor.bio || "Belum ada bio atau spesialisasi yang dicatat."}
              </p>
            </div>

            <div className="pt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarCheck className="w-3.5 h-3.5 text-muted-foreground" />
              <span>
                Terdaftar sejak:{" "}
                {tutor.created_at
                  ? new Date(tutor.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "-"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card Konfigurasi Honor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" />
              <span>Konfigurasi Tarif Honor</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tutor.rates && tutor.rates.length > 0 ? (
              <div className="space-y-2.5">
                {tutor.rates.map((rate) => (
                  <div
                    key={rate.id}
                    className="p-3 border rounded-lg flex justify-between items-center text-sm bg-muted/20"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {rate.bimbel_types?.name || "Tipe Bimbel"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Berlaku sejak: {rate.effective_from}
                      </p>
                    </div>
                    <span className="font-mono font-semibold text-primary">
                      {formatCurrency(Number(rate.rate_per_student))} / murid
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground space-y-2">
                <Coins className="w-8 h-8 mx-auto text-muted-foreground/40" />
                <p>Belum ada tarif khusus yang diatur untuk tutor ini.</p>
                <p className="text-xs text-muted-foreground/80">
                  Sistem akan otomatis menggunakan tarif standar global bimbel untuk penghitungan honor.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Dialogs */}
      <EditTutorDialog
        tutor={tutor}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={(updated) => setTutor(updated)}
      />

      <ResendCredentialsDialog
        tutor={tutor}
        open={isResendOpen}
        onOpenChange={setIsResendOpen}
      />

      <DeleteTutorDialog
        tutor={tutor}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onSuccess={() => {
          router.push("/management/tutors");
        }}
        onDeactivated={() => {
          setTutor((prev) => (prev ? { ...prev, status: "inactive" } : null));
        }}
      />
    </div>
  );
}
