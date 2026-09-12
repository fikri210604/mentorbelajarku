import { Permission, Role, ManagementSubrole } from "@/types/auth";
import {
  ROLE_PERMISSIONS,
  SUBROLE_PERMISSIONS,
  hasPermission,
  hasSubrolePermission,
  canSubroleAccessRoute,
} from "@/config/permissions";

export {
  ROLE_PERMISSIONS,
  SUBROLE_PERMISSIONS,
  hasPermission,
  hasSubrolePermission,
  canSubroleAccessRoute,
};

export function canAccessManagement(role?: Role): boolean {
  if (!role) return false;
  return role === "management" || role === "admin";
}

export function canAccessTutor(role?: Role): boolean {
  if (!role) return false;
  return role === "tutor" || role === "management" || role === "admin";
}

