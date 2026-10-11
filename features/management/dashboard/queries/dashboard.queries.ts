import { createServerSupabaseClient } from "@/lib/supabase/server";
import { scheduleOccursOnDay } from "@/lib/utils/recurrence";
import { getSessions } from "@/features/management/sessions/queries/session.queries";
import { getSchedules } from "@/features/management/schedules/queries/schedule.queries";
import { SessionWithDetails } from "@/features/management/sessions/types";
import { ScheduleWithDetails } from "@/features/management/schedules/types";

export interface DashboardStats {
  totalStudents: number;
  totalTutors: number;
  todaySessions: number;
  todayCompletedSessions: number;
  pendingPayroll: number;
  pendingAttendanceVerification: number;
}

export interface WeeklyTrendItem {
  day: string;
  selesai: number;
  terjadwal: number;
}

export interface BimbelTypeBreakdownItem {
  name: string;
  value: number;
  color: string;
}

export interface DashboardData {
  stats: DashboardStats;
  todaySessions: SessionWithDetails[];
  todaySchedules: ScheduleWithDetails[];
  weeklyTrends: WeeklyTrendItem[];
  bimbelTypeDistribution: BimbelTypeBreakdownItem[];
  allScheduledDates: string[];
}

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BIMBEL_COLORS: Record<string, string> = {
  Reguler: "#3b82f6",
  Intensif: "#f59e0b",
  Private: "#a855f7",
};

/**
 * Mengambil data agregat real untuk Management Dashboard
 */
export async function getDashboardData(targetDate?: string): Promise<DashboardData> {
  const supabase = createServerSupabaseClient();
  const dateStr = targetDate || new Date().toISOString().split("T")[0];
  const [y, m, d] = dateStr.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayOfWeek = dateObj.getDay();

  // 1. Fetch Fast Dashboard Stats dari view v_dashboard_stats atau fallback
  let stats: DashboardStats = {
    totalStudents: 0,
    totalTutors: 0,
    todaySessions: 0,
    todayCompletedSessions: 0,
    pendingPayroll: 0,
    pendingAttendanceVerification: 0,
  };

  try {
    const { data: viewData, error: viewErr } = await (supabase as any)
      .from("v_dashboard_stats")
      .select("*")
      .maybeSingle();

    if (!viewErr && viewData) {
      const v = viewData as Record<string, any>;
      stats = {
        totalStudents: Number(v.total_active_students) || 0,
        totalTutors: Number(v.total_active_tutors) || 0,
        todaySessions: Number(v.today_sessions_count) || 0,
        todayCompletedSessions: Number(v.today_completed_sessions_count) || 0,
        pendingPayroll: Number(v.pending_payroll_count) || 0,
        pendingAttendanceVerification: Number(v.pending_attendance_verification_count) || 0,
      };
    } else {
      // Fallback penghitungan langsung
      const [
        { count: stdCount },
        { count: tutCount },
        { count: sessCount },
        { count: compSessCount },
        { count: payCount },
      ] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("tutors").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("sessions").select("id", { count: "exact", head: true }).eq("session_date", dateStr),
        supabase.from("sessions").select("id", { count: "exact", head: true }).eq("session_date", dateStr).eq("status", "completed"),
        supabase.from("tutor_payments").select("id", { count: "exact", head: true }).eq("status", "draft"),
      ]);

      stats = {
        totalStudents: stdCount || 0,
        totalTutors: tutCount || 0,
        todaySessions: sessCount || 0,
        todayCompletedSessions: compSessCount || 0,
        pendingPayroll: payCount || 0,
        pendingAttendanceVerification: 0,
      };
    }
  } catch (err) {
    console.warn("Dashboard stats fetch fallback:", err);
  }

  // 2. Fetch Sesi dan Jadwal
  const [allSessions, allSchedules] = await Promise.all([
    getSessions(),
    getSchedules(),
  ]);

  // Sesi aktual pada tanggal target
  const todaySessions = allSessions.filter((s) => s.session_date === dateStr);

  // Jadwal rutin aktif pada hari dalam seminggu (mendukung multi-hari)
  const todaySchedules = allSchedules.filter(
    (sch) => scheduleOccursOnDay(sch, dayOfWeek) && sch.status === "active"
  );

  // Kumpulkan seluruh tanggal yang memiliki sesi pembelajaran
  const allScheduledDates = Array.from(new Set(allSessions.map((s) => s.session_date)));

  // 3. Hitung Tren Sesi Mingguan (7 hari ke belakang atau 7 hari minggu berjalan)
  const weeklyTrends: WeeklyTrendItem[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split("T")[0];
    const dayName = DAY_NAMES[d.getDay()];

    const daySessions = allSessions.filter((s) => s.session_date === dayStr);
    const selesai = daySessions.filter((s) => s.status === "completed").length;
    const terjadwal = daySessions.length;

    weeklyTrends.push({
      day: dayName,
      selesai,
      terjadwal,
    });
  }

  // 4. Hitung Distribusi Tipe Bimbel dari enrollments atau sessions
  const bimbelCounts: Record<string, number> = {
    Reguler: 0,
    Intensif: 0,
    Private: 0,
  };

  for (const s of allSessions) {
    const typeName = s.bimbel_types?.name || "Reguler";
    if (bimbelCounts[typeName] !== undefined) {
      bimbelCounts[typeName]++;
    } else {
      bimbelCounts[typeName] = 1;
    }
  }

  const bimbelTypeDistribution: BimbelTypeBreakdownItem[] = Object.entries(bimbelCounts).map(
    ([name, value]) => ({
      name: `${name} (${name === "Private" ? "90m" : name === "Intensif" ? "75m" : "60m"})`,
      value: value || 1, // Minimal 1 agar chart tidak hilang jika masih awal
      color: BIMBEL_COLORS[name] || "#3b82f6",
    })
  );

  return {
    stats,
    todaySessions,
    todaySchedules,
    weeklyTrends,
    bimbelTypeDistribution,
    allScheduledDates,
  };
}
