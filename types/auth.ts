import { UserRole } from "./database.types";

export type Role = UserRole;

export type ManagementSubrole = 'owner' | 'curriculum' | 'hrd' | 'finance' | 'general';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role: Role;
  subrole?: ManagementSubrole | null;
  roleId?: string | null;
  profileId?: string;
  tutorId?: string;
}

export interface AuthSession {
  user: AuthUser;
  session: {
    id: string;
    expiresAt: Date;
    token: string;
  };
}

/**
 * Permission adalah string dinamis yang bersumber dari tabel `permissions`
 * (master permission). Validasi dilakukan saat runtime melalui katalog permission,
 * bukan melalui union hardcoded, agar permission baru bisa ditambah tanpa deploy.
 *
 * Lihat `config/permissions.ts` (SYSTEM_PERMISSIONS) sebagai fallback saat DB belum aktif.
 */
export type Permission = string;

export interface RoleDefinition {
  id: string;
  name: string; // e.g. 'owner', 'curriculum', 'hrd', 'finance', 'tutor'
  display_name: string;
  description?: string | null;
  is_system: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PermissionDefinition {
  id: Permission;
  category: string;
  name: string;
  description?: string | null;
}

export interface RoleWithPermissions extends RoleDefinition {
  permissions: Permission[];
  user_count?: number;
}
