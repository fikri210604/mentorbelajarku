import type { AttendanceStatus, EnrollmentStatus } from '@/types/database.types';

export interface StudentActivePackageProgress {
  enrollmentId: string;
  packageName: string;
  programName: string;
  bimbelTypeName: string;
  maxMeetings: number;
  completedMeetings: number;
  remainingMeetings: number;
  percentage: number;
  status: EnrollmentStatus;
}

export interface StudentMeetingHistoryItem {
  id: string;
  sessionId: string;
  sessionDate: string;
  startTime?: string | null;
  endTime?: string | null;
  tutorName: string;
  programName?: string | null;
  bimbelTypeName?: string | null;
  material: string | null;
  notes: string | null;
  status: AttendanceStatus;
  meetingNumber: number | null; // 1, 2, ... for present/late, null for permission/sick/absent
  meetingCode?: string | null; // e.g. "P1", "P2" for present/late, null for permission/sick/absent
  photoPath?: string | null;
  checkedInAt?: string | null;
}

export interface StudentProgressResult {
  studentId: string;
  activePackage: StudentActivePackageProgress | null;
  history: StudentMeetingHistoryItem[];
}
