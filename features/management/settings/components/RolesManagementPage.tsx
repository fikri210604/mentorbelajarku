"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Shield,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  KeyRound,
  CheckCircle2,
  Lock,
  BookOpen,
  Users,
  Calendar,
  CreditCard,
  Settings,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
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
import { cn } from "cn";
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
import { roleSchema, RoleInput } from "../schemas/role.schema";
import {
  saveRoleAction,
  deleteRoleAction,
  updateRolePermissionsAction,
} from "../actions/role.actions";
import { SYSTEM_PERMISSIONS } from "@/config/permissions";
import { Permission, PermissionDefinition, RoleWithPermissions } from "@/types/auth";
import { isOwnerRoleName } from "@/lib/permissions/resolver";

export interface RolesManagementPageProps {
  initialRoles?: RoleWithPermissions[];
  initialPermissions?: PermissionDefinition[];
  roleName?: string | null;
  permissions?: Permission[];
  currentSubrole?: string | null;
}

export default function RolesManagementPage({
  initialRoles = [],
  initialPermissions = [],
  roleName,
  permissions: userPermissions = [],
  currentSubrole = "owner",
}: RolesManagementPageProps) {
  const isOwner = isOwnerRoleName(roleName);
  const canManageRoles = isOwner || userPermissions.includes("roles:manage");

  const [roles, setRoles] = useState<RoleWithPermissions[]>(initialRoles);
  const permissions =
    initialPermissions.length > 0 ? initialPermissions : SYSTEM_PERMISSIONS;
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleWithPermissions | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State dialog matriks hak akses (Permissions Matrix)
  const [matrixRole, setMatrixRole] = useState<RoleWithPermissions | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RoleInput>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      display_name: "",
      description: "",
    },
  });

  // Group permissions per kategori untuk tampilan checklist yang terstruktur
  const permissionCategories = Array.from(
    new Set(permissions.map((p) => p.category))
  );

  const openAddRoleDialog = () => {
    setEditingRole(null);
    reset({
      name: "",
      display_name: "",
      description: "",
    });
    setIsRoleDialogOpen(true);
  };

  const openEditRoleDialog = (role: RoleWithPermissions) => {
    setEditingRole(role);
    reset({
      id: role.id,
      name: role.name,
      display_name: role.display_name,
      description: role.description || "",
    });
    setIsRoleDialogOpen(true);
  };

  const onSubmitRole = async (data: RoleInput) => {
    try {
      const res = await saveRoleAction(data);
      if (res.success && res.data) {
        toast.success(res.message);
        if (editingRole) {
          setRoles((prev) =>
            prev.map((r) =>
              r.id === res.data!.id
                ? { ...r, ...res.data!, permissions: r.permissions }
                : r
            )
          );
        } else {
          setRoles((prev) => [...prev, res.data!]);
        }
        setIsRoleDialogOpen(false);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat menyimpan peran.");
    }
  };

  const confirmDeleteRole = async () => {
    if (!deletingRole) return;
    setIsDeleting(true);
    try {
      const res = await deleteRoleAction(deletingRole.id);
      if (res.success) {
        toast.success(res.message);
        setRoles((prev) => prev.filter((r) => r.id !== deletingRole.id));
        setDeletingRole(null);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Gagal menghapus peran.");
    } finally {
      setIsDeleting(false);
    }
  };

  const openPermissionsMatrix = (role: RoleWithPermissions) => {
    setMatrixRole(role);
    setSelectedPermissions(role.permissions || []);
  };

  const togglePermission = (permId: string) => {
    if (!canManageRoles) return;
    if (matrixRole?.name === "owner") return; // Owner selalu all
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const toggleCategoryPermissions = (category: string) => {
    if (!canManageRoles) return;
    if (matrixRole?.name === "owner") return;
    const catPerms = permissions.filter((p) => p.category === category).map(
      (p) => p.id
    );
    const allSelected = catPerms.every((id) => selectedPermissions.includes(id));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !catPerms.includes(id as any)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...catPerms])));
    }
  };

  // Salin izin dari peran lain: sumber dari tabel roles + role_permissions (database),
  // bukan katalog hardcoded. Id disaring ke katalog aktif agar tidak menyimpan permission yatim.
  const knownPermissionIds = new Set(permissions.map((p) => p.id));

  const copyPermissionsFromRole = (sourceRoleId: string) => {
    if (!canManageRoles) return;
    if (matrixRole?.name === "owner") return;
    const source = roles.find((r) => r.id === sourceRoleId);
    if (!source) return;
    const sourcePerms = source.name === "owner" ? Array.from(knownPermissionIds) : source.permissions;
    setSelectedPermissions(sourcePerms.filter((id) => knownPermissionIds.has(id)));
  };

  const savePermissions = async () => {
    if (!canManageRoles || !matrixRole) return;
    setIsSavingPermissions(true);
    try {
      const res = await updateRolePermissionsAction(matrixRole.id, selectedPermissions);
      if (res.success) {
        toast.success(res.message);
        setRoles((prev) =>
          prev.map((r) =>
            r.id === matrixRole.id
              ? { ...r, permissions: selectedPermissions as Permission[] }
              : r
          )
        );
        setMatrixRole(null);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Gagal menyimpan hak akses peran.");
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Kurikulum & Materi":
        return BookOpen;
      case "Akademik & Siswa":
        return Users;
      case "Presensi & Evaluasi":
        return Calendar;
      case "Keuangan & Honor":
        return CreditCard;
      default:
        return Settings;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. BREADCRUMB & NAVIGASI */}
      <SettingsNavTabs />

      {/* 2. HEADER HALAMAN */}
      <PageHeader
        title="Manajemen Peran & Hak Akses (RBAC)"
        description="Pusat kendali peran tim bimbel. Pimpinan dapat menambahkan scope tugas baru (seperti Bagian Kurikulum) dan mengatur checklist izin akses secara dinamis."
      >
        {canManageRoles && (
          <Button onClick={openAddRoleDialog} className="gap-2 shadow-xs cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>Tambah Peran Baru</span>
          </Button>
        )}
      </PageHeader>

      {/* 3. ALERT INFORMASI */}
      {!canManageRoles ? (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm text-foreground">
          <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-800 dark:text-amber-300">Mode Hanya-Lihat (Read-Only)</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Akun Anda tidak memiliki izin <strong>Manajemen Role & Hak Akses</strong>. Anda hanya dapat melihat cakupan izin yang aktif dan tidak dapat memodifikasi matriks hak akses.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-foreground">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-primary">Sistem Peran Fleksibel & Dinamis</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Anda dapat mendefinisikan peran baru (misalnya <strong>Bagian Kurikulum</strong> untuk mengelola master mapel, silabus bab materi, dan worksheet siswa). Tutor juga dapat diberi izin mengunggah lembar kerja, namun kurikulum dan owner memegang kendali review penuh.
            </p>
          </div>
        </div>
      )}

      {/* 4. GRID DAFTAR ROLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => {
          const isOwnerRole = role.name === "owner";
          const permCount = isOwnerRole ? permissions.length : role.permissions.length;

          return (
            <div
              key={role.id}
              className={cn(
                "relative flex flex-col justify-between p-5 rounded-2xl border bg-card text-card-foreground shadow-2xs transition-all hover:border-border/90 hover:shadow-xs",
                isOwnerRole && "border-primary/40 bg-linear-to-b from-primary/5 via-card to-card"
              )}
            >
              <div className="space-y-3">
                {/* Header Card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                        isOwnerRole
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-foreground border-border"
                      )}
                    >
                      {isOwnerRole ? (
                        <ShieldCheck className="w-5 h-5" />
                      ) : (
                        <Shield className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-foreground leading-tight">
                        {role.display_name}
                      </h3>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">
                        slug: {role.name}
                      </p>
                    </div>
                  </div>

                  {role.is_system ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border shrink-0">
                      <Lock className="w-2.5 h-2.5" />
                      System
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      Kustom
                    </span>
                  )}
                </div>

                {/* Deskripsi */}
                <p className="text-xs text-muted-foreground line-clamp-3 min-h-[36px] leading-relaxed">
                  {role.description || "Tidak ada deskripsi peran."}
                </p>

                {/* Status Hak Akses */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-primary" />
                    Cakupan Izin:
                  </span>
                  <span className="font-semibold text-foreground">
                    {isOwnerRole ? (
                      <span className="text-primary font-bold">Akses Penuh (100%)</span>
                    ) : (
                      `${permCount} dari ${permissions.length} izin`
                    )}
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center gap-2 pt-4 mt-3 border-t border-border/80">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openPermissionsMatrix(role)}
                  className="flex-1 text-xs gap-1.5 cursor-pointer font-medium"
                >
                  <KeyRound className="w-3.5 h-3.5 text-primary" />
                  <span>
                    {isOwnerRole || !canManageRoles
                      ? "Lihat Izin Akses"
                      : "Atur Hak Akses"}
                  </span>
                </Button>

                {!role.is_system && canManageRoles && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEditRoleDialog(role)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Edit Peran"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeletingRole(role)}
                      className="text-destructive/80 hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      title="Hapus Peran"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. MODAL DIALOG: TAMBAH / EDIT PERAN */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Perbarui Data Peran" : "Tambah Peran Tim Baru"}
            </DialogTitle>
            <DialogDescription>
              Tentukan identitas peran baru untuk mendelegasikan tugas (contoh: Bagian Kurikulum, Tim Soal, Supervisor).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmitRole)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="display_name" className="text-xs font-semibold">
                Nama Tampilan Peran <span className="text-destructive">*</span>
              </Label>
              <Input
                id="display_name"
                placeholder="Contoh: Bagian Kurikulum & Materi"
                {...register("display_name")}
              />
              {errors.display_name && (
                <p className="text-[11px] text-destructive">{errors.display_name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">
                Identifier Slug (Sistem) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="contoh: curriculum atau kurikulum"
                disabled={Boolean(editingRole)}
                {...register("name")}
              />
              <p className="text-[10px] text-muted-foreground">
                Gunakan huruf kecil, angka, atau garis bawah tanpa spasi. Tidak dapat diubah setelah dibuat.
              </p>
              {errors.name && (
                <p className="text-[11px] text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold">
                Deskripsi Tanggung Jawab
              </Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Jelaskan ruang lingkup tugas peran ini..."
                {...register("description")}
              />
              {errors.description && (
                <p className="text-[11px] text-destructive">{errors.description.message}</p>
              )}
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRoleDialogOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : editingRole ? "Simpan Perubahan" : "Buat Peran"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. MODAL DIALOG: MATRIKS HAK AKSES (PERMISSIONS CHECKLIST) */}
      <Dialog open={Boolean(matrixRole)} onOpenChange={(open) => !open && setMatrixRole(null)}>
        <DialogContent className="sm:max-w-[720px] max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1">
              <KeyRound className="w-4 h-4" />
              <span>Matriks Hak Akses Granular</span>
            </div>
            <DialogTitle className="text-lg flex items-center gap-2 flex-wrap">
              <span>Pengaturan Izin: {matrixRole?.display_name}</span>
              {!canManageRoles && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Mode Baca Saja
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {canManageRoles
                ? "Centang modul dan fitur yang diizinkan untuk diakses oleh pemegang peran ini."
                : "Daftar hak akses dan cakupan fitur yang sedang aktif untuk peran ini."}
            </DialogDescription>
          </DialogHeader>

          {/* Body Checklist - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {matrixRole?.name === "owner" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
              <Info className="w-4 h-4 shrink-0" />
              <span>
                Peran <strong>Owner</strong> adalah superadministrator mutlak. Seluruh hak akses selalu aktif secara default.
              </span>
            </div>
          )}

          {/* Dropdown salin izin dari peran lain (hanya untuk pengelola peran) */}
          {matrixRole?.name !== "owner" && canManageRoles && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl border border-primary/20 bg-primary/5">
              <div className="sm:flex-1 space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Salin Izin dari Peran Lain</p>
                <p className="text-[10px] text-muted-foreground">
                  Ambil paket izin dari peran yang sudah terdaftar di database, lalu sesuaikan manual sebelum disimpan.
                </p>
              </div>
              <Select onValueChange={(value: string | null) => { if (value) copyPermissionsFromRole(value); }}>
                <SelectTrigger className="w-full sm:w-[280px] h-9 text-xs bg-card cursor-pointer">
                  <SelectValue placeholder="Pilih peran sumber..." />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((r) => r.id !== matrixRole?.id)
                    .map((r) => (
                      <SelectItem key={r.id} value={r.id} className="text-xs">
                        {r.display_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

            {permissionCategories.map((category) => {
              const CategoryIcon = getCategoryIcon(category);
              const categoryPermissions = permissions.filter(
                (p) => p.category === category
              );
              const allCategorySelected = categoryPermissions.every((p) =>
                selectedPermissions.includes(p.id)
              );

              return (
                <div
                  key={category}
                  className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                      <CategoryIcon className="w-4 h-4 text-primary" />
                      <span>{category}</span>
                    </div>

                    {matrixRole?.name !== "owner" && canManageRoles && (
                      <button
                        type="button"
                        onClick={() => toggleCategoryPermissions(category)}
                        className="text-xs text-primary font-medium hover:underline cursor-pointer"
                      >
                        {allCategorySelected ? "Hapus Semua" : "Pilih Semua"}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {categoryPermissions.map((perm) => {
                      const isChecked =
                        matrixRole?.name === "owner" ||
                        selectedPermissions.includes(perm.id);
                      const isControlDisabled = matrixRole?.name === "owner" || !canManageRoles;

                      return (
                        <label
                          key={perm.id}
                          className={cn(
                            "flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all select-none",
                            isControlDisabled
                              ? "cursor-default"
                              : "cursor-pointer hover:bg-muted/40",
                            isChecked
                              ? "bg-primary/5 border-primary/40 text-foreground"
                              : "bg-card border-border text-muted-foreground",
                            isControlDisabled && !isChecked && "opacity-60"
                          )}
                          onClick={(e) => {
                            if (isControlDisabled) return;
                            e.preventDefault();
                            togglePermission(perm.id);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            disabled={isControlDisabled}
                            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary"
                          />
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold leading-snug">
                              {perm.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground line-clamp-2">
                              {perm.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="p-4 px-6 border-t bg-card/60">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-muted-foreground font-medium">
                Total Dipilih:{" "}
                <strong className="text-foreground">
                  {matrixRole?.name === "owner"
                    ? permissions.length
                    : selectedPermissions.length}
                </strong>{" "}
                dari {permissions.length} izin
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMatrixRole(null)}
                  disabled={isSavingPermissions}
                >
                  Tutup
                </Button>
                {matrixRole?.name !== "owner" && canManageRoles && (
                  <Button
                    type="button"
                    onClick={savePermissions}
                    disabled={isSavingPermissions}
                  >
                    {isSavingPermissions ? "Menyimpan..." : "Simpan Hak Akses"}
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. ALERT DIALOG: KONFIRMASI HAPUS PERAN */}
      <AlertDialog
        open={Boolean(deletingRole)}
        onOpenChange={(open) => !open && setDeletingRole(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Peran Ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus peran{" "}
              <strong>&quot;{deletingRole?.display_name}&quot;</strong>? Pengguna yang memegang peran ini akan kehilangan akses khusus yang telah diatur. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteRole}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus Peran"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
