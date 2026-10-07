import type { Permission } from "@/types/auth";
import { SYSTEM_PERMISSIONS } from "@/config/permissions";

/**
 * Kumpulan master permission id yang didukung sistem bimbel.
 */
export const KNOWN_PERMISSION_IDS: ReadonlySet<Permission> = new Set<Permission>(
  SYSTEM_PERMISSIONS.map((p) => p.id)
);

export function normalizeRoleName(roleName?: string | null): string {
  return (roleName ?? "").toLowerCase().trim();
}

export function isKnownPermission(value: string): value is Permission {
  return KNOWN_PERMISSION_IDS.has(value as Permission);
}

export function isOwnerRoleName(roleName?: string | null): boolean {
  return normalizeRoleName(roleName) === "owner";
}

/**
 * Menentukan role portal routing dari nama peran di database.
 * Sistem bimbel ini memisahkan 2 portal utama:
 * - 'tutor' untuk pengajar
 * - 'management' untuk seluruh peran staf & pimpinan (owner, hrd, kurikulum, keuangan, dan seluruh peran dinamis baru di database)
 */
export function portalRoleForRoleName(
  roleName?: string | null
): "management" | "tutor" {
  const normalized = normalizeRoleName(roleName);
  return normalized === "tutor" ? "tutor" : "management";
}

/**
 * Resolusi permission fallback untuk peran sistem ('owner' dan 'tutor').
 * Hak akses aktual seluruh peran dinamis operasional dikelola dan dibaca langsung
 * dari database (tabel 'roles' dan 'role_permissions').
 */
export function resolvePermissionsForRoleName(
  roleName?: string | null
): Permission[] {
  const normalized = normalizeRoleName(roleName);
  if (!normalized) return [];

  // Owner selalu memiliki seluruh hak akses sistem secara penuh
  if (normalized === "owner") {
    return SYSTEM_PERMISSIONS.map((p) => p.id);
  }

  // Hak akses dasar pengajar / tutor
  if (normalized === "tutor") {
    return [
      "student:read",
      "schedule:read",
      "session:read",
      "attendance:create",
      "attendance:read",
      "attendance:update",
      "worksheet:create",
      "worksheet:read",
      "progress_report:read",
      "progress_report:manage",
      "payroll:read",
    ];
  }

  return [];
}

export function roleNameHasPermission(
  roleName: string | null | undefined,
  permission: Permission
): boolean {
  return resolvePermissionsForRoleName(roleName).includes(permission);
}

export function hasAnyPermission(
  granted: readonly Permission[] | null | undefined,
  required: readonly Permission[]
): boolean {
  if (!granted || granted.length === 0) return false;
  return required.some((permission) => granted.includes(permission));
}
