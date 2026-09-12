"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Mail,
  Phone,
  Lock,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Save,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from "../schemas/profile.schema";
import {
  updateTutorProfile,
  changeTutorPassword,
} from "../actions/profile.actions";

interface TutorProfilePageProps {
  initialData: {
    userId: string;
    fullName: string;
    email: string;
    phone: string;
    bio: string;
    role: string;
    mustChangePassword: boolean;
  };
}

export default function TutorProfilePage({ initialData }: TutorProfilePageProps) {
  // State Status Keamanan Kata Sandi
  const [mustChangePassword, setMustChangePassword] = useState(
    initialData.mustChangePassword
  );

  // State Feedback Profil
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // State Feedback Password
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Form 1: Update Profil
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: initialData.fullName,
      phone: initialData.phone || "",
      bio: initialData.bio || "",
    },
  });

  // Form 2: Ganti Password
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onProfileSubmit = async (data: UpdateProfileInput) => {
    setProfileSuccess(null);
    setProfileError(null);

    const res = await updateTutorProfile(data, initialData.userId);
    if (!res.success) {
      setProfileError(res.error || "Gagal memperbarui profil.");
      return;
    }

    setProfileSuccess(res.message || "Profil berhasil diperbarui!");
    setTimeout(() => setProfileSuccess(null), 4000);
  };

  const onPasswordSubmit = async (data: ChangePasswordInput) => {
    setPasswordSuccess(null);
    setPasswordError(null);

    const res = await changeTutorPassword(data, initialData.userId);
    if (!res.success) {
      setPasswordError(res.error || "Gagal mengubah kata sandi.");
      return;
    }

    setPasswordSuccess(res.message || "Kata sandi berhasil diubah!");
    setMustChangePassword(false);
    resetPasswordForm();
    setTimeout(() => setPasswordSuccess(null), 5000);
  };

  const [showPasswordConfirmDialog, setShowPasswordConfirmDialog] = useState(false);
  const [pendingPasswordData, setPendingPasswordData] = useState<ChangePasswordInput | null>(null);

  const handlePreSubmitPassword = (data: ChangePasswordInput) => {
    setPendingPasswordData(data);
    setShowPasswordConfirmDialog(true);
  };

  const handleExecuteChangePassword = async () => {
    if (!pendingPasswordData) return;
    setShowPasswordConfirmDialog(false);
    await onPasswordSubmit(pendingPasswordData);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Profil & Keamanan Akun"
        description="Kelola informasi identitas tutor, kontak WhatsApp, dan perbarui kata sandi akun Anda."
      />

      {/* Banner Peringatan Keamanan jika masih menggunakan password default */}
      {mustChangePassword ? (
        <Alert
          variant="warning"
          className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
        >
          <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="font-semibold text-sm">
            Perhatian Keamanan: Akun Masih Menggunakan Password Bawaan
          </AlertTitle>
          <AlertDescription className="text-xs text-amber-800 dark:text-amber-300 mt-1">
            Anda saat ini menggunakan kata sandi default dari Manajemen. Silakan ubah kata sandi pada kartu <strong>Keamanan Akun & Ganti Kata Sandi</strong> di bawah agar data dan privasi honor mengajar Anda tetap terlindungi.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="font-semibold text-sm">
            Keamanan Akun Aktif & Terlindungi
          </AlertTitle>
          <AlertDescription className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
            Kata sandi kustom Anda aktif. Peringatan ganti password pada dashboard telah dihilangkan.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KARTU 1: INFORMASI PROFIL TUTOR */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3 bg-muted/20 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Informasi Profil Tutor
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Identitas dan data kontak yang dilihat oleh pihak Manajemen.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-semibold capitalize">
                {initialData.role}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-4">
              {profileError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{profileError}</AlertDescription>
                </Alert>
              )}

              {profileSuccess && (
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-xs">{profileSuccess}</AlertDescription>
                </Alert>
              )}

              <div>
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  Nama Lengkap Tutor *
                </label>
                <Input
                  {...registerProfile("fullName")}
                  placeholder="Nama Lengkap"
                  className="mt-1 text-xs"
                />
                {profileErrors.fullName && (
                  <p className="text-xs text-destructive mt-1 font-medium">
                    {profileErrors.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  Alamat Email (Login)
                </label>
                <Input
                  value={initialData.email}
                  disabled
                  className="mt-1 text-xs bg-muted/50 cursor-not-allowed"
                />
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Email akun dikelola oleh Manajemen Bimbel.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  Nomor WhatsApp / Telepon
                </label>
                <Input
                  {...registerProfile("phone")}
                  placeholder="08123456789"
                  className="mt-1 text-xs"
                />
                {profileErrors.phone && (
                  <p className="text-xs text-destructive mt-1 font-medium">
                    {profileErrors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  Bio / Catatan Keahlian Mengajar
                </label>
                <Textarea
                  {...registerProfile("bio")}
                  placeholder="Contoh: Tutor Matematika & Sains dengan pengalaman mengajar 3 tahun di jenjang SD dan SMP."
                  rows={3}
                  className="mt-1 text-xs resize-none"
                />
                {profileErrors.bio && (
                  <p className="text-xs text-destructive mt-1 font-medium">
                    {profileErrors.bio.message}
                  </p>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isProfileSubmitting}
                  className="text-xs gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isProfileSubmitting ? "Menyimpan..." : "Simpan Profil"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* KARTU 2: KEAMANAN AKUN & GANTI KATA SANDI */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-3 bg-muted/20 border-b">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Keamanan Akun & Kata Sandi
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Perbarui kata sandi untuk melindungi hak akses dan data absensi Anda.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4">
            <form onSubmit={handleSubmitPassword(handlePreSubmitPassword)} className="space-y-4">
              {passwordError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{passwordError}</AlertDescription>
                </Alert>
              )}

              {passwordSuccess && (
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-xs">{passwordSuccess}</AlertDescription>
                </Alert>
              )}

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Kata Sandi Saat Ini *
                </label>
                <Input
                  {...registerPassword("currentPassword")}
                  type="password"
                  placeholder="Masukkan kata sandi saat ini"
                  className="mt-1 text-xs"
                />
                {passwordErrors.currentPassword && (
                  <p className="text-xs text-destructive mt-1 font-medium">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Kata Sandi Baru * (Min. 8 Karakter, Huruf & Angka)
                </label>
                <Input
                  {...registerPassword("newPassword")}
                  type="password"
                  placeholder="Masukkan kata sandi baru"
                  className="mt-1 text-xs"
                />
                {passwordErrors.newPassword && (
                  <p className="text-xs text-destructive mt-1 font-medium">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Ulangi Kata Sandi Baru *
                </label>
                <Input
                  {...registerPassword("confirmPassword")}
                  type="password"
                  placeholder="Ketik ulang kata sandi baru"
                  className="mt-1 text-xs"
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-xs text-destructive mt-1 font-medium">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="rounded-lg p-2.5 bg-muted/40 border text-[11px] text-muted-foreground space-y-1">
                <span className="font-semibold text-foreground block">
                  Ketentuan Kata Sandi Aman:
                </span>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Minimal 8 karakter kombinasi huruf dan angka.</li>
                  <li>Setelah disimpan, peringatan ganti password otomatis nonaktif.</li>
                </ul>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPasswordSubmitting}
                  className="text-xs gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {isPasswordSubmitting ? "Menyimpan..." : "Perbarui Kata Sandi"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Konfirmasi Ganti Kata Sandi Alert Dialog */}
      <AlertDialog open={showPasswordConfirmDialog} onOpenChange={setShowPasswordConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Konfirmasi Perubahan Kata Sandi
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin memperbarui kata sandi akun Anda? Setelah berhasil diperbarui, Anda harus menggunakan kata sandi baru untuk login selanjutnya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPasswordSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPasswordSubmitting}
              onClick={handleExecuteChangePassword}
              className="gap-1.5"
            >
              <KeyRound className="w-4 h-4" />
              {isPasswordSubmitting ? "Memproses..." : "Ya, Perbarui Kata Sandi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
