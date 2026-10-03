import TutorDashboardPage from "@/features/tutor/dashboard/components/TutorDashboardPage";
import { requireAuthUser } from "@/lib/auth/session";
import { getSessions } from "@/features/tutor/sessions/queries/session.queries";
import { getTutorSchedules } from "@/features/management/schedules/queries/schedule.queries";
import { PayrollCalculatorService } from "@/features/shared/payroll/services/payroll-calculator.service";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Tutor | Bimbel Belajarku",
};

interface RawSession {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
  students?: Array<{ id: string; name?: string; student_code?: string }>;
  programs?: { name?: string } | null;
  bimbel_types?: { name?: string; duration_minutes?: number } | null;
}

interface RawSchedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  status: string;
  students?: Array<{ id: string; name?: string }>;
  programs?: { name?: string } | null;
  bimbel_types?: { name?: string; duration_minutes?: number } | null;
}

export default async function Page() {
  const session = await requireAuthUser();

  // Estimasi honor bulan berjalan dihitung server-side dari sesi/completed + presensi payable (present/late)
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${lastDay}`;

  const [sessions, schedules, payrollEstimate] = await Promise.all([
    session.tutorId ? getSessions(session.tutorId) : Promise.resolve([]),
    session.tutorId ? getTutorSchedules(session.tutorId) : Promise.resolve([]),
    session.tutorId
      ? PayrollCalculatorService.calculateTutorPayroll(session.tutorId, monthStart, monthEnd)
          .then((r) => r.grossAmount)
          .catch((err) => {
            // Rate belum dikonfigurasi atau gagal kalkulasi → tampilkan tanpa nilai, bukan angka palsu
            console.error("Gagal menghitung estimasi honor:", err);
            return null;
          })
      : Promise.resolve(null),
  ]);

  const currentMonthPayroll = payrollEstimate ?? null;

  const mappedSessions = (sessions as unknown as RawSession[]).map((s) => ({
    id: s.id,
    session_date: s.session_date,
    start_time: s.start_time,
    end_time: s.end_time,
    status: s.status,
    students: s.students,
    student_name: s.students?.[0]?.name,
    program_name: s.programs?.name,
    bimbel_type_name: s.bimbel_types?.name,
    duration_minutes: s.bimbel_types?.duration_minutes,
  }));

  const mappedSchedules = (schedules as unknown as RawSchedule[]).map((sch) => ({
    id: sch.id,
    day_of_week: sch.day_of_week,
    start_time: sch.start_time,
    end_time: sch.end_time,
    status: sch.status,
    students: sch.students,
    program_name: sch.programs?.name,
    bimbel_type_name: sch.bimbel_types?.name,
    duration_minutes: sch.bimbel_types?.duration_minutes,
  }));

  return (
    <TutorDashboardPage
      mustChangePassword={session.profile?.must_change_password ?? false}
      tutorName={session.profile?.full_name || session.user.name || "Tutor"}
      sessions={mappedSessions}
      schedules={mappedSchedules}
      estMonthlyPayroll={currentMonthPayroll}
    />
  );
}
