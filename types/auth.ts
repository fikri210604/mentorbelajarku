import { UserRole } from "./database.types";

export type Role = UserRole;

export type ManagementSubrole = 'owner' | 'hrd' | 'finance' | 'general';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role: Role;
  subrole?: ManagementSubrole | null;
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

export type Permission =
  | "student:create"
  | "student:read"
  | "student:update"
  | "student:delete"
  | "tutor:create"
  | "tutor:read"
  | "tutor:update"
  | "tutor:delete"
  | "schedule:create"
  | "schedule:read"
  | "schedule:update"
  | "schedule:delete"
  | "session:create"
  | "session:read"
  | "session:update"
  | "session:delete"
  | "attendance:create"
  | "attendance:read"
  | "attendance:update"
  | "attendance:verify"
  | "payroll:generate"
  | "payroll:read"
  | "payroll:finalize"
  | "payroll:pay"
  | "reports:read"
  | "settings:manage";
