import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface AttendanceReportData {
  total: number;
  present: number;
  permission: number;
  sick: number;
  late: number;
  absent: number;
  presentPct: number;
  permissionSickPct: number;
  latePct: number;
  absentPct: number;
  programBreakdown: {
    programName: string;
    total: number;
    present: number;
    rate: number;
  }[];
  recentRecords: {
    id: string;
    studentName: string;
    studentCode: string;
    programName: string;
    sessionDate: string;
    status: string;
  }[];
}

export interface PayrollReportData {
  totalPayroll: number;
  totalPaid: number;
  totalPending: number;
  totalSessions: number;
  totalTutors: number;
  paymentRecords: {
    id: string;
    tutorName: string;
    period: string;
    totalSessions: number;
    totalStudents: number;
    totalAmount: number;
    status: "draft" | "processed" | "paid";
    paidAt?: string | null;
  }[];
}

export interface StudentReportData {
  activeStudents: number;
  newStudentsThisMonth: number;
  graduatedStudents: number;
  inactiveStudents: number;
  totalStudents: number;
  programDistribution: {
    name: string;
    count: number;
    percentage: number;
  }[];
  levelDistribution: {
    level: string;
    count: number;
  }[];
}

export interface TutorReportData {
  activeTutors: number;
  totalSessionsThisMonth: number;
  avgStudentsPerSession: number;
  tutorList: {
    id: string;
    name: string;
    phone: string | null;
    status: string;
    sessionsCount: number;
    studentsTaughtCount: number;
  }[];
}

export class ReportService {
  /**
   * Mengambil rekapitulasi kehadiran aktual dari database
   */
  static async getAttendanceSummary(
    startDate?: string,
    endDate?: string
  ): Promise<AttendanceReportData> {
    const supabase = createServerSupabaseClient();

    let query = (supabase.from("attendance") as any).select(`
      id,
      status,
      checked_in_at,
      students (
        id,
        student_code,
        name
      ),
      sessions (
        id,
        session_date,
        program_id,
        programs (
          id,
          name
        )
      )
    `);

    const { data: records, error } = await query;

    if (error || !records || records.length === 0) {
      return {
        total: 0,
        present: 0,
        permission: 0,
        sick: 0,
        late: 0,
        absent: 0,
        presentPct: 0,
        permissionSickPct: 0,
        latePct: 0,
        absentPct: 0,
        programBreakdown: [],
        recentRecords: [],
      };
    }

    // Filter tanggal jika diberikan
    const filtered = records.filter((r: any) => {
      const sDate = r.sessions?.session_date;
      if (!sDate) return true;
      if (startDate && sDate < startDate) return false;
      if (endDate && sDate > endDate) return false;
      return true;
    });

    const total = filtered.length;
    let present = 0;
    let permission = 0;
    let sick = 0;
    let late = 0;
    let absent = 0;

    const progMap: Record<string, { total: number; present: number }> = {};

    for (const r of filtered) {
      const status = r.status;
      if (status === "present") present++;
      else if (status === "permission") permission++;
      else if (status === "sick") sick++;
      else if (status === "late") late++;
      else if (status === "absent") absent++;

      const progName = (r.sessions as any)?.programs?.name || "Program Lain";
      if (!progMap[progName]) {
        progMap[progName] = { total: 0, present: 0 };
      }
      progMap[progName].total++;
      if (status === "present" || status === "late") {
        progMap[progName].present++;
      }
    }

    const presentPct = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    const permissionSickPct = total > 0 ? Math.round(((permission + sick) / total) * 100) : 0;
    const latePct = total > 0 ? Math.round((late / total) * 100) : 0;
    const absentPct = total > 0 ? Math.round((absent / total) * 100) : 0;

    const programBreakdown = Object.entries(progMap).map(([programName, stats]) => ({
      programName,
      total: stats.total,
      present: stats.present,
      rate: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
    }));

    const recentRecords = filtered.slice(0, 10).map((r: any) => ({
      id: r.id,
      studentName: r.students?.name || "Murid",
      studentCode: r.students?.student_code || "-",
      programName: r.sessions?.programs?.name || "Program",
      sessionDate: r.sessions?.session_date || "-",
      status: r.status,
    }));

    return {
      total,
      present,
      permission,
      sick,
      late,
      absent,
      presentPct,
      permissionSickPct,
      latePct,
      absentPct,
      programBreakdown,
      recentRecords,
    };
  }

  /**
   * Mengambil rekapitulasi payroll/honor tutor dari database
   */
  static async getPayrollSummary(): Promise<PayrollReportData> {
    const supabase = createServerSupabaseClient();

    const { data: payments, error } = await (supabase.from("tutor_payments") as any)
      .select(`
        id,
        period_start,
        period_end,
        total_sessions,
        total_students_attended,
        total_amount,
        status,
        paid_at,
        tutors (
          id,
          profiles (
            full_name
          )
        )
      `)
      .order("period_start", { ascending: false });

    if (error || !payments || payments.length === 0) {
      return {
        totalPayroll: 0,
        totalPaid: 0,
        totalPending: 0,
        totalSessions: 0,
        totalTutors: 0,
        paymentRecords: [],
      };
    }

    let totalPayroll = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalSessions = 0;
    const tutorIdSet = new Set<string>();

    const paymentRecords = payments.map((p: any) => {
      const amount = Number(p.total_amount) || 0;
      totalPayroll += amount;
      if (p.status === "paid") {
        totalPaid += amount;
      } else {
        totalPending += amount;
      }

      totalSessions += Number(p.total_sessions) || 0;
      if (p.tutors?.id) tutorIdSet.add(p.tutors.id);

      return {
        id: p.id,
        tutorName: p.tutors?.profiles?.full_name || "Tutor",
        period: `${p.period_start} s/d ${p.period_end}`,
        totalSessions: Number(p.total_sessions) || 0,
        totalStudents: Number(p.total_students_attended) || 0,
        totalAmount: amount,
        status: p.status,
        paidAt: p.paid_at,
      };
    });

    return {
      totalPayroll,
      totalPaid,
      totalPending,
      totalSessions,
      totalTutors: tutorIdSet.size,
      paymentRecords,
    };
  }

  /**
   * Mengambil ringkasan statistik perkembangan murid
   */
  static async getStudentReport(): Promise<StudentReportData> {
    const supabase = createServerSupabaseClient();

    const { data: rawStudents, error } = await (supabase.from("students") as any)
      .select(`
        id,
        status,
        created_at,
        level,
        enrollments (
          programs (
            name
          )
        )
      `);

    const students = (rawStudents as any[]) || [];

    if (error || students.length === 0) {
      return {
        activeStudents: 0,
        newStudentsThisMonth: 0,
        graduatedStudents: 0,
        inactiveStudents: 0,
        totalStudents: 0,
        programDistribution: [],
        levelDistribution: [],
      };
    }

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    let activeStudents = 0;
    let graduatedStudents = 0;
    let inactiveStudents = 0;
    let newStudentsThisMonth = 0;

    const progCountMap: Record<string, number> = {};
    const levelCountMap: Record<string, number> = {};

    for (const s of students) {
      if (s.status === "active") activeStudents++;
      else if (s.status === "graduated") graduatedStudents++;
      else if (s.status === "inactive") inactiveStudents++;

      if (s.created_at && s.created_at.startsWith(currentYearMonth)) {
        newStudentsThisMonth++;
      }

      const lvl = s.level || "Umum";
      levelCountMap[lvl] = (levelCountMap[lvl] || 0) + 1;

      const enrollments = s.enrollments || [];
      for (const en of enrollments) {
        const pName = en.programs?.name || "Program Lain";
        progCountMap[pName] = (progCountMap[pName] || 0) + 1;
      }
    }

    const totalStudents = students.length;
    const programDistribution = Object.entries(progCountMap).map(([name, count]) => ({
      name,
      count,
      percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0,
    }));

    const levelDistribution = Object.entries(levelCountMap).map(([level, count]) => ({
      level,
      count,
    }));

    return {
      activeStudents,
      newStudentsThisMonth,
      graduatedStudents,
      inactiveStudents,
      totalStudents,
      programDistribution,
      levelDistribution,
    };
  }

  /**
   * Mengambil laporan kinerja dan statistik tutor
   */
  static async getTutorReport(): Promise<TutorReportData> {
    const supabase = createServerSupabaseClient();

    const { data: tutors, error } = await (supabase.from("tutors") as any)
      .select(`
        id,
        status,
        profiles (
          full_name,
          phone
        ),
        sessions (
          id,
          session_date,
          status,
          attendance (
            id,
            status
          )
        )
      `);

    if (error || !tutors || tutors.length === 0) {
      return {
        activeTutors: 0,
        totalSessionsThisMonth: 0,
        avgStudentsPerSession: 0,
        tutorList: [],
      };
    }

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    let activeTutors = 0;
    let totalSessionsThisMonth = 0;
    let totalAllSessions = 0;
    let totalStudentsTaught = 0;

    const tutorList = tutors.map((t: any) => {
      if (t.status === "active") activeTutors++;

      const tutorSessions = t.sessions || [];
      totalAllSessions += tutorSessions.length;

      let tutorSessionMonthCount = 0;
      let tutorStudentsCount = 0;

      for (const s of tutorSessions) {
        if (s.session_date && s.session_date.startsWith(currentYearMonth)) {
          tutorSessionMonthCount++;
          totalSessionsThisMonth++;
        }
        const attList = s.attendance || [];
        tutorStudentsCount += attList.length;
        totalStudentsTaught += attList.length;
      }

      return {
        id: t.id,
        name: t.profiles?.full_name || "Tutor",
        phone: t.profiles?.phone || null,
        status: t.status,
        sessionsCount: tutorSessions.length,
        studentsTaughtCount: tutorStudentsCount,
      };
    });

    const avgStudentsPerSession =
      totalAllSessions > 0 ? Number((totalStudentsTaught / totalAllSessions).toFixed(1)) : 0;

    return {
      activeTutors,
      totalSessionsThisMonth,
      avgStudentsPerSession,
      tutorList,
    };
  }
}
