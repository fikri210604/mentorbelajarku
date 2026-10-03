"use client";

import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldCheck, Save, UserCog } from "lucide-react";
import { assignUserRoleAction } from "../actions/role.actions";
import type { ManagedUser } from "../queries/user-role.queries";
import type { RoleWithPermissions } from "@/types/auth";

interface UsersRolesPageProps {
  initialUsers: ManagedUser[];
  roles: RoleWithPermissions[];
}

export default function UsersRolesPage({ initialUsers, roles }: UsersRolesPageProps) {
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [selection, setSelection] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const u of initialUsers) {
      if (u.roleId) initial[u.id] = u.roleId;
    }
    return initial;
  });
  const [savingId, setSavingId] = useState<string | null>(null);

  const roleOptions = roles.map((r) => ({ id: r.id, label: r.display_name, name: r.name }));

  const handleSave = async (user: ManagedUser) => {
    const roleId = selection[user.id];
    if (!roleId) {
      toast.error("Pilih peran terlebih dahulu.");
      return;
    }

    setSavingId(user.id);
    try {
      const res = await assignUserRoleAction({ userId: user.id, roleId });
      if (res.success) {
        const role = roleOptions.find((r) => r.id === roleId);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? { ...u, roleId, roleName: role?.name ?? u.roleName }
              : u
          )
        );
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Gagal menetapkan role pengguna.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsNavTabs />

      <PageHeader
        title="Pengguna & Penetapan Peran"
        description="Tetapkan peran dinamis ke tiap pengguna. Perubahan langsung berlaku setelah disimpan."
      />

      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-primary">Penetapan Peran Dinamis</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Tambahkan peran baru di menu <strong>Peran &amp; Hak Akses</strong>, atur permission-nya,
            lalu tempelkan peran tersebut ke pengguna di halaman ini.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCog className="w-4 h-4 text-primary" />
            Daftar Pengguna
          </CardTitle>
          <CardDescription>
            {users.length} pengguna terdaftar. Role dinamis mengikuti tabel peran.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Peran Saat Ini</TableHead>
                <TableHead className="w-[260px]">Tetapkan Peran</TableHead>
                <TableHead className="w-[110px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Tidak ada pengguna.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-mono">
                        {user.roleName || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={selection[user.id] ?? ""}
                        onValueChange={(value: string | null) => {
                          if (!value) return;
                          setSelection((prev) => ({ ...prev, [user.id]: value }));
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Pilih peran..." />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={savingId === user.id || !selection[user.id]}
                        onClick={() => handleSave(user)}
                      >
                        <Save className="w-3.5 h-3.5" />
                        {savingId === user.id ? "Menyimpan..." : "Simpan"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
