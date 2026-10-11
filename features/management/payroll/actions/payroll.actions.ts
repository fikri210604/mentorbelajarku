"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { checkPermission } from "@/lib/auth/session";
import { PayrollCalculatorService } from "../services/payroll-calculator.service";
import { processPayrollSchema, ProcessPayrollInput } from "../schemas/payroll.schema";

export async function generatePayrollAction(input: ProcessPayrollInput) {
  const { allowed, user } = await checkPermission("payroll:generate");
  if (!allowed || !user) {
    return { success: false, error: "FORBIDDEN: Anda tidak memiliki hak akses untuk membuat payroll." };
  }

  const parsed = processPayrollSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Input payroll tidak valid." };
  }
  const validated = parsed.data;

  const supabase = createServerClient();

  // Tolak pembuatan ulang periode yang sama (idempotensi lewat unique constraint).
  const { data: existing } = await supabase
    .from("tutor_payments")
    .select("id, status")
    .eq("tutor_id", validated.tutorId)
    .eq("period_start", validated.periodStart)
    .eq("period_end", validated.periodEnd)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      error: `Payroll untuk periode ini sudah ada (status: ${existing.status}). Hapus/selesaikan yang lama terlebih dahulu.`,
    };
  }

  const { grossAmount, items } = await PayrollCalculatorService.calculateTutorPayroll(
    validated.tutorId,
    validated.periodStart,
    validated.periodEnd
  );

  const bonus = validated.bonus || 0;
  const deduction = validated.deduction || 0;
  const netAmount = grossAmount + bonus - deduction;
  const sessionCount = new Set(items.map((i) => i.sessionId)).size;

  const { data: payment, error: paymentError } = await supabase
    .from("tutor_payments")
    .insert({
      tutor_id: validated.tutorId,
      period_start: validated.periodStart,
      period_end: validated.periodEnd,
      gross_amount: grossAmount,
      bonus,
      deduction,
      net_amount: netAmount,
      total_sessions: sessionCount,
      total_students_attended: items.length,
      status: "draft",
    })
    .select()
    .single();

  if (paymentError || !payment) {
    return { success: false, error: "Gagal membuat payroll." };
  }

  if (items.length > 0) {
    const paymentItems = items.map((item) => ({
      payment_id: payment.id,
      session_id: item.sessionId,
      student_id: item.studentId,
      bimbel_type_id: item.bimbelTypeId,
      session_date: item.sessionDate,
      payable_students_count: 1,
      rate_applied: item.rate,
      amount: item.amount,
      subtotal: item.amount,
      quantity: 1,
    }));

    const { error: itemError } = await supabase.from("tutor_payment_items").insert(paymentItems);

    if (itemError) {
      // Rollback: hapus payment agar tidak ada payroll tanpa item.
      await supabase.from("tutor_payments").delete().eq("id", payment.id);
      return { success: false, error: "Gagal menyimpan rincian payroll. Perubahan dibatalkan." };
    }
  }

  await supabase.from("audit_logs").insert({
    user_id: user.user.id,
    action: "PAYROLL_GENERATED",
    entity_type: "tutor_payments",
    entity_id: payment.id,
    metadata: {
      tutor_id: validated.tutorId,
      period_start: validated.periodStart,
      period_end: validated.periodEnd,
      gross_amount: grossAmount,
      bonus,
      deduction,
      net_amount: netAmount,
      item_count: items.length,
    },
  });

  revalidatePath("/management/payroll");
  return { success: true, data: payment };
}

export async function finalizePayrollAction(payrollId: string) {
  const { allowed, user } = await checkPermission("payroll:finalize");
  if (!allowed || !user) {
    return { success: false, error: "FORBIDDEN: Anda tidak memiliki hak akses untuk finalisasi payroll." };
  }

  const supabase = createServerClient();
  const { data: before } = await supabase
    .from("tutor_payments")
    .select("status")
    .eq("id", payrollId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("tutor_payments")
    .update({ status: "processed", finalized_at: new Date().toISOString(), finalized_by: user.user.id })
    .eq("id", payrollId)
    .select()
    .single();

  if (error) return { success: false, error: "Gagal finalisasi payroll." };

  await supabase.from("audit_logs").insert({
    user_id: user.user.id,
    action: "PAYROLL_FINALIZED",
    entity_type: "tutor_payments",
    entity_id: payrollId,
    metadata: { before, after: { status: "processed" } },
  });

  revalidatePath("/management/payroll");
  revalidatePath(`/management/payroll/${payrollId}`);
  return { success: true, data };
}

export interface MarkPayrollAsPaidInput {
  paymentReference?: string;
  notes?: string;
}

export async function markPayrollAsPaidAction(
  payrollId: string,
  extra?: MarkPayrollAsPaidInput
) {
  const { allowed, user } = await checkPermission("payroll:pay");
  if (!allowed || !user) {
    return { success: false, error: "FORBIDDEN: Anda tidak memiliki hak akses untuk memproses pembayaran payroll." };
  }

  const supabase = createServerClient();
  const { data: before } = await supabase
    .from("tutor_payments")
    .select("status, payment_reference, notes")
    .eq("id", payrollId)
    .maybeSingle();

  const updatePayload: {
    status: "paid";
    paid_at: string;
    paid_by: string;
    payment_reference?: string | null;
    notes?: string | null;
  } = {
    status: "paid",
    paid_at: new Date().toISOString(),
    paid_by: user.user.id,
  };

  if (extra?.paymentReference !== undefined) {
    updatePayload.payment_reference = extra.paymentReference.trim() || null;
  }
  if (extra?.notes !== undefined) {
    updatePayload.notes = extra.notes.trim() || null;
  }

  const { data, error } = await supabase
    .from("tutor_payments")
    .update(updatePayload)
    .eq("id", payrollId)
    .select()
    .single();

  if (error) return { success: false, error: "Gagal memproses pembayaran payroll." };

  await supabase.from("audit_logs").insert({
    user_id: user.user.id,
    action: "PAYROLL_PAID",
    entity_type: "tutor_payments",
    entity_id: payrollId,
    metadata: { before, after: updatePayload },
  });

  revalidatePath("/management/payroll");
  revalidatePath(`/management/payroll/${payrollId}`);
  revalidatePath("/tutor/payroll");
  return { success: true, data };
}

export interface AuditAttendanceInput {
  attendanceId: string;
  verificationStatus: "verified" | "correction_requested";
  notes?: string;
  payrollId?: string;
}

/**
 * Server Action: Melakukan verifikasi atau meminta koreksi bukti foto presensi
 * langsung dari audit rincian penggajian tutor.
 */
export async function auditAttendanceAction(input: AuditAttendanceInput) {
  const { allowed, user } = await checkPermission("attendance:verify");
  if (!allowed || !user) {
    return { success: false, error: "FORBIDDEN: Anda tidak memiliki hak akses untuk memverifikasi presensi." };
  }

  const supabase = createServerClient();
  const { data: before } = await supabase
    .from("attendance")
    .select("verification_status, notes")
    .eq("id", input.attendanceId)
    .maybeSingle();

  const { error } = await supabase
    .from("attendance")
    .update({
      verification_status: input.verificationStatus,
      notes: input.notes !== undefined ? (input.notes.trim() || null) : before?.notes,
      verified_at: new Date().toISOString(),
      verified_by: user.user.id,
      updated_by: user.user.id,
    })
    .eq("id", input.attendanceId);

  if (error) {
    return { success: false, error: "Gagal memperbarui status verifikasi presensi." };
  }

  await supabase.from("audit_logs").insert({
    user_id: user.user.id,
    action: input.verificationStatus === "verified" ? "ATTENDANCE_VERIFIED" : "ATTENDANCE_CORRECTION_REQUESTED",
    entity_type: "attendance",
    entity_id: input.attendanceId,
    metadata: {
      before,
      after: { verification_status: input.verificationStatus, notes: input.notes },
      payroll_id: input.payrollId,
    },
  });

  if (input.payrollId) {
    revalidatePath(`/management/payroll/${input.payrollId}`);
  }
  revalidatePath("/management/payroll");
  revalidatePath("/management/attendance");
  revalidatePath("/tutor/payroll");
  revalidatePath("/tutor/dashboard");

  return {
    success: true,
    message:
      input.verificationStatus === "verified"
        ? "Foto presensi berhasil diverifikasi."
        : "Permintaan koreksi foto berhasil dicatat untuk tutor.",
  };
}

/**
 * Server Action: Mengeluarkan item sesi dari draft payroll tutor (misal jika dibatalkan/ditunda).
 */
export async function removePayrollItemAction(itemId: string, payrollId: string) {
  const { allowed, user } = await checkPermission("payroll:generate");
  if (!allowed || !user) {
    return { success: false, error: "FORBIDDEN: Anda tidak memiliki hak akses untuk mengubah rincian payroll." };
  }

  const supabase = createServerClient();

  const { data: payment } = await supabase
    .from("tutor_payments")
    .select("status, gross_amount, bonus, deduction")
    .eq("id", payrollId)
    .maybeSingle();

  if (!payment || payment.status !== "draft") {
    return { success: false, error: "Hanya payroll berstatus 'draft' yang itemnya dapat dikeluarkan." };
  }

  const { data: item } = await supabase
    .from("tutor_payment_items")
    .select("amount, session_id, student_id")
    .eq("id", itemId)
    .maybeSingle();

  if (!item) {
    return { success: false, error: "Item sesi payroll tidak ditemukan." };
  }

  const { error: delError } = await supabase
    .from("tutor_payment_items")
    .delete()
    .eq("id", itemId);

  if (delError) {
    return { success: false, error: "Gagal mengeluarkan item dari payroll." };
  }

  // Hitung ulang nominal payroll
  const { data: remainingItems } = await supabase
    .from("tutor_payment_items")
    .select("amount, session_id")
    .eq("payment_id", payrollId);

  const newGross = (remainingItems || []).reduce((sum, it) => sum + Number(it.amount || 0), 0);
  const newNet = newGross + Number(payment.bonus || 0) - Number(payment.deduction || 0);
  const sessionCount = new Set((remainingItems || []).map((i) => i.session_id)).size;

  await supabase
    .from("tutor_payments")
    .update({
      gross_amount: newGross,
      net_amount: newNet,
      total_sessions: sessionCount,
      total_students_attended: (remainingItems || []).length,
    })
    .eq("id", payrollId);

  await supabase.from("audit_logs").insert({
    user_id: user.user.id,
    action: "PAYROLL_ITEM_REMOVED",
    entity_type: "tutor_payment_items",
    entity_id: itemId,
    metadata: {
      payroll_id: payrollId,
      removed_amount: item.amount,
      session_id: item.session_id,
      student_id: item.student_id,
    },
  });

  revalidatePath(`/management/payroll/${payrollId}`);
  revalidatePath("/management/payroll");
  return { success: true, message: "Sesi berhasil dikeluarkan dari penggajian periode ini." };
}
