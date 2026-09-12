export * from './users';
export * from './bimbel-types';
export * from './programs';
export * from './tutors';
export * from './students';
export * from './schedules';
export * from './sessions';
export * from './attendance';
export * from './payroll';

import { SYNTHETIC_STUDENTS } from './students';
import { SYNTHETIC_TUTORS } from './tutors';
import { SYNTHETIC_SESSIONS } from './sessions';
import { SYNTHETIC_ATTENDANCE } from './attendance';
import { SYNTHETIC_TUTOR_RATES, SYNTHETIC_PAYMENTS } from './payroll';

/**
 * Quick aggregate summary metrics for Dashboard
 */
export function getDummyDashboardStats() {
  const activeStudents = SYNTHETIC_STUDENTS.filter((s) => s.status === 'active').length;
  const activeTutors = SYNTHETIC_TUTORS.filter((t) => t.status === 'active').length;
  const todayStr = '2026-09-10';
  const todaySessions = SYNTHETIC_SESSIONS.filter((s) => s.session_date === todayStr);
  const pendingAttendance = SYNTHETIC_ATTENDANCE.filter(
    (a) => a.verification_status === 'submitted'
  ).length;

  return {
    studentCount: activeStudents,
    tutorCount: activeTutors,
    todaySessions,
    pendingAttendanceCount: pendingAttendance,
  };
}
