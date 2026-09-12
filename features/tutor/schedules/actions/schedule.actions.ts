"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { scheduleSchema, ScheduleInput } from "../schemas/schedule.schema";

export async function createSchedule(input: ScheduleInput) {
  const validated = scheduleSchema.parse(input);
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("schedules")
    .insert({
      tutor_id: validated.tutorId,
      program_id: validated.programId,
      bimbel_type_id: validated.bimbelTypeId,
      student_id: validated.studentId ?? null,
      class_group_id: validated.classGroupId ?? null,
      day_of_week: validated.dayOfWeek,
      start_time: validated.startTime,
      end_time: validated.endTime,
      location: validated.location ?? null,
      status: validated.status,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/management/schedules");
  return { success: true, data };
}
