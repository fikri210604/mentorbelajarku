import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SYNTHETIC_STUDENTS } from '@/data/students';
import { SYNTHETIC_ATTENDANCE } from '@/data/attendance';
import type {
  StudentActivePackageProgress,
  StudentMeetingHistoryItem,
  StudentProgressResult,
} from '../types';

export class StudentProgressService {
  /**
   * Mengambil data paket belajar aktif, kalkulasi progres pertemuan ke-X,
   * dan daftar histori presensi lengkap dengan nama tutor serta nomor pertemuan valid.
   */
  static async getStudentProgressAndHistory(studentId: string): Promise<StudentProgressResult> {
    const supabase = createServerSupabaseClient();

    try {
      // 1. Coba ambil dari database Supabase (tabel enrollments)
      const { data: enrollmentData, error: enrollErr } = await supabase
        .from('enrollments')
        .select(`
          id,
          package_name,
          max_meetings,
          status,
          programs (name),
          bimbel_types (name)
        `)
        .eq('student_id', studentId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // 2. Ambil histori dari view v_attendance_with_meeting_number
      const { data: attendanceRows, error: attErr } = await supabase
        .from('v_attendance_with_meeting_number')
        .select('*')
        .eq('student_id', studentId)
        .order('session_date', { ascending: false });

      if (!enrollErr && !attErr && (enrollmentData || (attendanceRows && attendanceRows.length > 0))) {
        const history: StudentMeetingHistoryItem[] = (attendanceRows || []).map((row: any) => ({
          id: row.id,
          sessionId: row.session_id,
          sessionDate: row.session_date,
          startTime: row.start_time,
          endTime: row.end_time,
          tutorName: row.tutor_name || 'Tutor Bimbel',
          programName: row.program_name,
          bimbelTypeName: row.bimbel_type_name,
          material: row.material,
          notes: row.notes,
          status: row.status,
          meetingNumber: row.meeting_number ? Number(row.meeting_number) : null,
          meetingCode: row.meeting_number ? `P${Number(row.meeting_number)}` : null,
          photoPath: row.photo_path,
          checkedInAt: row.checked_in_at,
        }));

        let activePackage: StudentActivePackageProgress | null = null;

        if (enrollmentData) {
          const maxMeetings = enrollmentData.max_meetings || 8;
          // Hitung jumlah pertemuan efektif (present/late) di dalam enrollment ini
          const completedMeetings = history.filter(
            (h) => h.status === 'present' || h.status === 'late'
          ).length;
          const remainingMeetings = Math.max(0, maxMeetings - completedMeetings);
          const percentage = Math.min(100, Math.round((completedMeetings / maxMeetings) * 100));

          activePackage = {
            enrollmentId: enrollmentData.id,
            packageName: enrollmentData.package_name || 'Paket Bimbel',
            programName: (enrollmentData.programs as any)?.name || 'Program Belajar',
            bimbelTypeName: (enrollmentData.bimbel_types as any)?.name || 'Reguler',
            maxMeetings,
            completedMeetings,
            remainingMeetings,
            percentage,
            status: enrollmentData.status,
          };
        }

        return {
          studentId,
          activePackage,
          history,
        };
      }
    } catch (err) {
      console.warn('StudentProgressService Supabase query fallback to synthetic data:', err);
    }

    // 3. Fallback ke Data Sintetis (untuk mode prototype atau sebelum migrasi Supabase dieksekusi)
    return this.getSyntheticProgressAndHistory(studentId);
  }

  /**
   * Helper fallback untuk data sintetis & testing lokal
   */
  static getSyntheticProgressAndHistory(studentId: string): StudentProgressResult {
    const student = SYNTHETIC_STUDENTS.find((s) => s.id === studentId);

    // Default package specs berdasarkan tipe bimbel
    const bimbelType = student?.bimbel_type || 'Reguler';
    const maxMeetings = bimbelType.toLowerCase().includes('intensif') ? 12 : 8;

    // Filter seluruh presensi untuk murid ini
    const rawAtts = SYNTHETIC_ATTENDANCE.filter((a) => a.student_id === studentId);

    // Urutkan secara kronologis (ascending) untuk menghitung "Pertemuan ke-X"
    const sortedChronological = [...rawAtts].sort(
      (a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
    );

    let counter = 0;
    const itemsWithMeetingNum = sortedChronological.map((att) => {
      let meetingNumber: number | null = null;
      // Hanya hadir dan telat yang dihitung sebagai pertemuan efektif
      if (att.status === 'present' || att.status === 'late') {
        counter += 1;
        meetingNumber = counter;
      }
      return {
        id: att.id,
        sessionId: att.session_id,
        sessionDate: att.session_date,
        tutorName: att.tutor_name || 'Tutor Bimbel',
        programName: att.program_name,
        bimbelTypeName: att.bimbel_type_name,
        material: att.material,
        notes: att.notes || null,
        status: att.status,
        meetingNumber,
        meetingCode: meetingNumber ? `P${meetingNumber}` : null,
        photoPath: att.photo_path || null,
        checkedInAt: att.checked_in_at,
      };
    });

    const completedMeetings = counter;
    const remainingMeetings = Math.max(0, maxMeetings - completedMeetings);
    const percentage = Math.min(100, Math.round((completedMeetings / maxMeetings) * 100));

    // Urutkan kembali descending (terbaru di atas) untuk tampilan list riwayat
    const history = itemsWithMeetingNum.reverse();

    const activePackage: StudentActivePackageProgress = {
      enrollmentId: `enr-${studentId}`,
      packageName: `Paket ${bimbelType} (${maxMeetings} Sesi)`,
      programName: student?.enrolled_program || 'Matematika Dasar & Logika',
      bimbelTypeName: bimbelType,
      maxMeetings,
      completedMeetings,
      remainingMeetings,
      percentage,
      status: 'active',
    };

    return {
      studentId,
      activePackage,
      history,
    };
  }

  /**
   * Helper untuk menghitung prediksi nomor pertemuan berikutnya bagi murid.
   * Sangat berguna ditampilkan di formulir absensi sebelum tutor submit.
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
