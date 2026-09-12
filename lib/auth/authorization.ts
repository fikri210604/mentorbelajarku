import type { UserRole, VerificationStatus } from '@/types/database.types';

export interface UserSessionContext {
  userId: string;
  role: UserRole;
  tutorId?: string | null;
}

export interface AttendancePermissions {
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_verify: boolean;
}

/**
 * Validates that a user session exists and is authenticated.
 */
export function requireAuth(user: UserSessionContext | null | undefined): UserSessionContext {
  if (!user || !user.userId) {
    throw new Error('UNAUTHORIZED: Authentication required.');
  }
  return user;
}

/**
 * Validates that the authenticated user possesses one of the allowed roles.
 */
export function requireRole(
  user: UserSessionContext | null | undefined,
  allowedRoles: UserRole[]
): UserSessionContext {
  const authenticatedUser = requireAuth(user);
  if (!allowedRoles.includes(authenticatedUser.role)) {
    throw new Error(`FORBIDDEN: Requires one of the following roles: [${allowedRoles.join(', ')}]`);
  }
  return authenticatedUser;
}

/**
 * Computes granular attendance permissions dynamically based on user identity,
 * tutor ownership, and current verification status.
 *
 * NOTE: As per DESIGN.md Section 34.1, permissions are always computed at runtime
 * and strictly validated on the server.
 */
export function computeAttendancePermissions(params: {
  currentUserId: string;
  currentUserRole: UserRole;
  currentTutorId?: string | null;
  attendanceOwnerUserId?: string | null;
  sessionTutorId?: string | null;
  verificationStatus?: VerificationStatus;
}): AttendancePermissions {
  const {
    currentUserId,
    currentUserRole,
    currentTutorId,
    attendanceOwnerUserId,
    sessionTutorId,
    verificationStatus = 'submitted',
  } = params;

  // Management / Admin has full administrative power including verification
  if (currentUserRole === 'management' || currentUserRole === 'admin') {
    return {
      can_view: true,
      can_edit: true,
      can_delete: true,
      can_verify: true,
    };
  }

  // Finance role: view only, cannot edit or verify attendance
  if (currentUserRole === 'finance') {
    return {
      can_view: true,
      can_edit: false,
      can_delete: false,
      can_verify: false,
    };
  }

  // Tutor role: check ownership
  const isOwner =
    (attendanceOwnerUserId && attendanceOwnerUserId === currentUserId) ||
    (currentTutorId && sessionTutorId && currentTutorId === sessionTutorId);

  if (isOwner) {
    // If management has already verified the attendance, tutor cannot edit/delete anymore
    const isLocked = verificationStatus === 'verified';
    return {
      can_view: true,
      can_edit: !isLocked,
      can_delete: !isLocked,
      can_verify: false, // Tutors cannot verify their own attendance
    };
  }

  // Other tutors: can view class history, cannot modify
  return {
    can_view: true,
    can_edit: false,
    can_delete: false,
    can_verify: false,
  };
}
