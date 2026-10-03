import type { Permission } from "@/types/auth";
import {
  ROLE_PERMISSIONS,
  SUBROLE_PERMISSIONS,
  SYSTEM_PERMISSIONS,
} from "@/config/permissions";

/**
 * Kumpulan permission id yang dikenal sistem.
 * Gabungan master permission + permission yang direferensikan tiap role,
 * agar id lama seperti `reports:read` tetap dianggap valid.
 */
export const KNOWN_PERMISSION_IDS: ReadonlySet<string> = new Set<string>([
  ...SYSTEM_PERMISSIONS.map((p) => p.id),
  ...Object.values(ROLE_PERMISSIONS).flat(),
  ...Object.values(SUBROLE_PERMISSIONS).flat(),
]);

export function normalizeRoleName(roleName?: string | null): string {
  return (roleName ?? "").toLowerCase().trim();
}

export function isKnownPermission(value: string): value is Permission {
  return KNOWN_PERMISSION_IDS.has(value);
}

export function isOwnerRoleName(roleName?: string | null): boolean {
  return normalizeRoleName(roleName) === "owner";
}

/**
 * Menentukan role portal (untuk routing/gerbang portal) dari nama role dinamis.
 * Mengembalikan null bila nama role tidak dikenali.
 */
export function portalRoleForRoleName(
  roleName?: string | null
): "management" | "tutor" | "admin" | "finance" | null {
  const normalized = normalizeRoleName(roleName);
  if (!normalized) return null;
  if (normalized === "tutor") return "tutor";
  if (normalized === "admin") return "admin";
  if (normalized === "finance") return "management";
  if (["owner", "curriculum", "hrd", "management"].includes(normalized)) {
    return "management";
  }
  return null;
}

/**
 * Resolusi permission berdasarkan nama role.
 * Urutan: owner (penuh) -> role dinamis -> role statis -> kosong (fail closed).
 *
 * Catatan: fungsi ini murni (tanpa I/O) untuk Fase 1. Resolusi dari database
 * (role_permissions) akan ditambahkan pada Fase 2.
 */
export function resolvePermissionsForRoleName(
  roleName?: string | null
): Permission[] {
  const normalized = normalizeRoleName(roleName);
  if (!normalized) return [];

  if (normalized === "owner") {
    return SYSTEM_PERMISSIONS.map((p) => p.id);
  }

  // Fallback role statis (management/admin/finance/tutor).
  // Role dinamis (mis. curriculum, hrd) diresolusi dari database (role_permissions).
  const staticPermissions = ROLE_PERMISSIONS[normalized as keyof typeof ROLE_PERMISSIONS];
  if (staticPermissions) {
    return [...staticPermissions];
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
