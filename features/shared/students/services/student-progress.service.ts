import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AttendanceStatus, EnrollmentStatus } from '@/types/database.types';
import type {
  StudentActivePackageProgress,
  StudentMeetingHistoryItem,
  StudentProgressResult,
} from '../types';

interface AttendanceViewRow {
  id: string;
  session_id: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  tutor_name: string | null;
  program_name: string | null;
  bimbel_type_name: string | null;
  material: string | null;
  notes: string | null;
  status: string;
  meeting_number: number | string | null;
  meeting_code: string | null;
  photo_path: string | null;
  checked_in_at: string | null;
}

interface ActiveEnrollmentRow {
  id: string;
  package_name: string | null;
  max_meetings: number | null;
  status: string;
  programs?: { name?: string } | null;
  bimbel_types?: { name?: string } | null;
}

export class StudentProgressService {
  /**
   * Mengambil paket belajar aktif, progres pertemuan ke-X, dan histori presensi.
   * Tanpa fallback sintetis: mengembalikan hasil kosong bila data tidak ditemukan.
   */
  static async getStudentProgressAndHistory(studentId: string): Promise<StudentProgressResult> {
    const supabase = createServerSupabaseClient();
    const empty: StudentProgressResult = { studentId, activePackage: null, history: [] };

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentId);
      let targetUuid = studentId;

      if (!isUuid) {
        const { data: std } = await supabase
          .from('students')
          .select('id')
          .eq('student_code', studentId)
          .maybeSingle();

        if (!std?.id) return empty;
        targetUuid = std.id;
      }

      const [enrollmentRes, attendanceRes] = await Promise.all([
        supabase
          .from('enrollments')
          .select('id, package_name, max_meetings, status, programs (name), bimbel_types (name)')
          .eq('student_id', targetUuid)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('v_attendance_with_meeting_number')
          .select('*')
          .eq('student_id', targetUuid)
          .order('session_date', { ascending: false }),
      ]);

      if (enrollmentRes.error || attendanceRes.error) {
        console.error('StudentProgressService query error');
        return empty;
      }

      const history: StudentMeetingHistoryItem[] = ((attendanceRes.data || []) as unknown as AttendanceViewRow[]).map(
        (row) => ({
          id: row.id,
          sessionId: row.session_id,
          sessionDate: row.session_date,
          startTime: row.start_time ?? undefined,
          endTime: row.end_time ?? undefined,
          tutorName: row.tutor_name || 'Tutor Bimbel',
          programName: row.program_name ?? '',
          bimbelTypeName: row.bimbel_type_name ?? '',
          material: row.material,
          notes: row.notes,
          status: row.status as AttendanceStatus,
          meetingNumber: row.meeting_number ? Number(row.meeting_number) : null,
          meetingCode:
            row.meeting_code || (row.meeting_number ? `P${Number(row.meeting_number)}` : null),
          photoPath: row.photo_path,
          checkedInAt: row.checked_in_at,
        })
      );

      let activePackage: StudentActivePackageProgress | null = null;
      const enrollmentData = enrollmentRes.data as unknown as ActiveEnrollmentRow | null;

      if (enrollmentData) {
        const maxMeetings = enrollmentData.max_meetings || 8;
        const completedMeetings = history.filter(
          (h) => h.status === 'present' || h.status === 'late'
        ).length;
        const remainingMeetings = Math.max(0, maxMeetings - completedMeetings);
        const percentage = Math.min(100, Math.round((completedMeetings / maxMeetings) * 100));

        activePackage = {
          enrollmentId: enrollmentData.id,
          packageName: enrollmentData.package_name || 'Paket Bimbel',
          programName: enrollmentData.programs?.name || 'Program Belajar',
          bimbelTypeName: enrollmentData.bimbel_types?.name || 'Reguler',
          maxMeetings,
          completedMeetings,
          remainingMeetings,
          percentage,
          status: enrollmentData.status as EnrollmentStatus,
        };
      }

      return { studentId, activePackage, history };
    } catch (err) {
      console.error('StudentProgressService unexpected error:', err);
      return empty;
    }
  }

  /**
   * Prediksi nomor pertemuan berikutnya bagi murid.
   */
  static async getNextMeetingInfo(studentId: string): Promise<{
    packageName: string;
    nextMeetingNumber: number;
    maxMeetings: number;
    completedMeetings: number;
    remainingMeetings: number;
  }> {
    const { activePackage } = await this.getStudentProgressAndHistory(studentId);
    if (!activePackage) {
      return {
        packageName: 'Paket Belajar',
        nextMeetingNumber: 1,
        maxMeetings: 8,
        completedMeetings: 0,
        remainingMeetings: 8,
      };
    }

    const nextMeetingNumber = Math.min(
      activePackage.maxMeetings,
      activePackage.completedMeetings + 1
    );

    return {
      packageName: activePackage.packageName,
      nextMeetingNumber,
      maxMeetings: activePackage.maxMeetings,
      completedMeetings: activePackage.completedMeetings,
      remainingMeetings: activePackage.remainingMeetings,
    };
  }
}
