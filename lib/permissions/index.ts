import { Role } from "@/types/auth";
import {
  ROLE_PERMISSIONS,
  SUBROLE_PERMISSIONS,
  hasPermission,
  hasSubrolePermission,
  canSubroleAccessRoute,
} from "@/config/permissions";
import {
  KNOWN_PERMISSION_IDS,
  normalizeRoleName,
  isKnownPermission,
  isOwnerRoleName,
  resolvePermissionsForRoleName,
  portalRoleForRoleName,
  roleNameHasPermission,
  hasAnyPermission,
} from "./resolver";

export {
  ROLE_PERMISSIONS,
  SUBROLE_PERMISSIONS,
  hasPermission,
  hasSubrolePermission,
  canSubroleAccessRoute,
  KNOWN_PERMISSION_IDS,
  normalizeRoleName,
  isKnownPermission,
  isOwnerRoleName,
  resolvePermissionsForRoleName,
  portalRoleForRoleName,
  roleNameHasPermission,
  hasAnyPermission,
};

export function canAccessManagement(role?: Role): boolean {
  if (!role) return false;
  return role === "management" || role === "admin";
}

export function canAccessTutor(role?: Role): boolean {
  if (!role) return false;
  return role === "tutor" || role === "management" || role === "admin";
}

