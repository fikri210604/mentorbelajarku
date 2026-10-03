"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNavTabs } from "./SettingsNavTabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import {
  permissionSchema,
  PermissionInput,
} from "../schemas/permission.schema";
import { savePermissionAction, deletePermissionAction } from "../actions/permission.actions";
import type { PermissionDefinition } from "@/types/auth";

interface PermissionsCatalogPageProps {
  initialPermissions: PermissionDefinition[];
}

export default function PermissionsCatalogPage({
  initialPermissions,
}: PermissionsCatalogPageProps) {
  const [permissions, setPermissions] =
    useState<PermissionDefinition[]>(initialPermissions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PermissionInput>({
    resolver: zodResolver(permissionSchema),
    defaultValues: { id: "", category: "", name: "", description: "" },
  });

  const openAddDialog = () => {
    reset({ id: "", category: "", name: "", description: "" });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: PermissionInput) => {
    setIsSubmitting(true);
    try {
      const res = await savePermissionAction(data);
      if (res.success && res.data) {
        toast.success(res.message);
        setPermissions((prev) => {
          const idx = prev.findIndex((p) => p.id === res.data!.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = res.data!;
            return next;
          }
          return [...prev, res.data!];
        });
        setIsDialogOpen(false);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Gagal menyimpan permission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (permission: PermissionDefinition) => {
    setDeletingId(permission.id);
    try {
      const res = await deletePermissionAction(permission.id);
      if (res.success) {
        toast.success(res.message);
        setPermissions((prev) => prev.filter((p) => p.id !== permission.id));
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Gagal menghapus permission.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsNavTabs />

      <PageHeader
        title="Katalog Permission"
        description="Master hak akses granular. Tambahkan permission baru, lalu centang pada peran terkait di menu Peran & Hak Akses."
      >
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          <span>Tambah Permission</span>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="w-4 h-4 text-primary" />
            Daftar Permission ({permissions.length})
          </CardTitle>
          <CardDescription>
            Identifier permission menggunakan format <code>modul:aksi</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identifier</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Belum ada permission.
                  </TableCell>
                </TableRow>
              ) : (
                permissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-mono text-xs">{permission.id}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {permission.category}
                    </TableCell>
                    <TableCell className="text-sm">{permission.name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                        disabled={deletingId === permission.id}
                        onClick={() => handleDelete(permission)}
                        title="Hapus permission"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Tambah Permission Baru</DialogTitle>
            <DialogDescription>
              Permission baru akan langsung dapat dicentang pada matriks peran.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="permission-id" className="text-xs font-semibold">
                Identifier <span className="text-destructive">*</span>
              </Label>
              <Input id="permission-id" placeholder="contoh: worksheet:approve" {...register("id")} />
              {errors.id && (
                <p className="text-[11px] text-destructive">{errors.id.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="permission-category" className="text-xs font-semibold">
                Kategori <span className="text-destructive">*</span>
              </Label>
              <Input
                id="permission-category"
                placeholder="contoh: Kurikulum & Materi"
                {...register("category")}
              />
              {errors.category && (
                <p className="text-[11px] text-destructive">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="permission-name" className="text-xs font-semibold">
                Nama Permission <span className="text-destructive">*</span>
              </Label>
              <Input
                id="permission-name"
                placeholder="contoh: Menyetujui Worksheet"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-[11px] text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="permission-description" className="text-xs font-semibold">
                Deskripsi
              </Label>
              <Textarea
                id="permission-description"
                rows={3}
                placeholder="Penjelasan singkat kegunaan permission"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-[11px] text-destructive">{errors.description.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
