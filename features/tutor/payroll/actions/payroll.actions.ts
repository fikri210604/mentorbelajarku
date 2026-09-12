"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { PayrollCalculatorService } from "../services/payroll-calculator.service";
import { processPayrollSchema, ProcessPayrollInput } from "../schemas/payroll.schema";

export async function generatePayrollAction(input: ProcessPayrollInput) {
  const validated = processPayrollSchema.parse(input);
  const supabase = createServerClient();

  const { grossAmount, items } = await PayrollCalculatorService.calculateTutorPayroll(
    validated.tutorId,
    validated.periodStart,
    validated.periodEnd
  );

  const bonus = validated.bonus || 0;
  const deduction = validated.deduction || 0;
  const netAmount = grossAmount + bonus - deduction;

  // Insert tutor payment record
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
      status: "draft",
    })
    .select()
    .single();

  if (paymentError || !payment) {
    return { success: false, error: paymentError?.message || "Gagal membuat payroll" };
  }

  // Insert payment items
  if (items.length > 0) {
    const paymentItems = items.map((item) => ({
      tutor_payment_id: payment.id,
      session_id: item.sessionId,
      student_id: item.studentId,
      bimbel_type_id: item.bimbelTypeId,
      rate: item.rate,
      quantity: 1,
      amount: item.amount,
    }));

    await supabase.from("tutor_payment_items").insert(paymentItems);
  }

  revalidatePath("/management/payroll");
  return { success: true, data: payment };
}

export async function finalizePayrollAction(payrollId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tutor_payments")
    .update({ status: "processed", updated_at: new Date().toISOString() })
    .eq("id", payrollId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/management/payroll");
  revalidatePath(`/management/payroll/${payrollId}`);
  return { success: true, data };
}

export async function markPayrollAsPaidAction(payrollId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("tutor_payments")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", payrollId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/management/payroll");
  revalidatePath(`/management/payroll/${payrollId}`);
  return { success: true, data };
}
