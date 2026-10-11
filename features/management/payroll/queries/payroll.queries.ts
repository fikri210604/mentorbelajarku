import { createServerClient } from "@/lib/supabase/server";
import { signAttendancePhotoPath } from "@/lib/storage";
import { AttendanceAuditInfo, PayrollWithDetails } from "../types";

export async function getPayrolls(): Promise<PayrollWithDetails[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tutor_payments")
    .select(`
      *,
      tutors (*, profiles (*)),
      items:tutor_payment_items (
        *,
        students (*),
        bimbel_types (*)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching payrolls:", error);
    return [];
  }
  return (data as unknown as PayrollWithDetails[]) || [];
}

export async function getPayrollById(id: string): Promise<PayrollWithDetails | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tutor_payments")
    .select(`
      *,
      tutors (*, profiles (*)),
      items:tutor_payment_items (
        *,
        students (*),
        bimbel_types (*),
        sessions (*, programs (*))
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const rawPayment = data as any;
  const rawItems = (rawPayment.items || []) as any[];

  // Ambil data attendance untuk seluruh session_id & student_id pada payment ini
  const sessionIds = Array.from(new Set(rawItems.map((it) => it.session_id).filter(Boolean))) as string[];
  const studentIds = Array.from(new Set(rawItems.map((it) => it.student_id).filter(Boolean))) as string[];

  const attendanceMap = new Map<string, AttendanceAuditInfo>();

  if (sessionIds.length > 0 && studentIds.length > 0) {
    const { data: attendances, error: attError } = await supabase
      .from("attendance")
      .select("id, session_id, student_id, status, verification_status, photo_path, notes, checked_in_at")
      .in("session_id", sessionIds)
      .in("student_id", studentIds);

    if (!attError && attendances) {
      for (const att of attendances) {
        attendanceMap.set(`${att.session_id}_${att.student_id}`, att as AttendanceAuditInfo);
      }
    }
  }

  // Tanda tangani URL foto untuk keperluan audit preview
  const itemsWithAudit = await Promise.all(
    rawItems.map(async (item) => {
      const att = attendanceMap.get(`${item.session_id}_${item.student_id}`);
      let photo_url: string | null = null;
      if (att?.photo_path) {
        try {
          photo_url = await signAttendancePhotoPath(att.photo_path);
        } catch {
          photo_url = null;
        }
      }

      return {
        ...item,
        attendance: att ? { ...att, photo_url } : null,
      };
    })
  );

  return {
    ...rawPayment,
    items: itemsWithAudit,
  } as PayrollWithDetails;
}

export async function getTutorPayrolls(tutorId: string): Promise<PayrollWithDetails[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tutor_payments")
    .select(`
      *,
      items:tutor_payment_items (
        *,
        students (*),
        bimbel_types (*)
      )
    `)
    .eq("tutor_id", tutorId)
    .order("period_start", { ascending: false });

  if (error) return [];
  return (data as unknown as PayrollWithDetails[]) || [];
}
