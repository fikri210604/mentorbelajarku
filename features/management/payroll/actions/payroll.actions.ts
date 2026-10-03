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

export async function markPayrollAsPaidAction(payrollId: string) {
  const { allowed, user } = await checkPermission("payroll:pay");
  if (!allowed || !user) {
    return { success: false, error: "FORBIDDEN: Anda tidak memiliki hak akses untuk memproses pembayaran payroll." };
  }

  const supabase = createServerClient();
  const { data: before } = await supabase
    .from("tutor_payments")
    .select("status")
    .eq("id", payrollId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("tutor_payments")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      paid_by: user.user.id,
    })
    .eq("id", payrollId)
    .select()
    .single();

  if (error) return { success: false, error: "Gagal memproses pembayaran payroll." };

  await supabase.from("audit_logs").insert({
    user_id: user.user.id,
    action: "PAYROLL_PAID",
    entity_type: "tutor_payments",
    entity_id: payrollId,
    metadata: { before, after: { status: "paid" } },
  });

  revalidatePath("/management/payroll");
  revalidatePath(`/management/payroll/${payrollId}`);
  return { success: true, data };
}
