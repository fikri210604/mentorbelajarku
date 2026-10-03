"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getSafeErrorMessage } from "@/lib/traits/response.trait";
import { checkPermission } from "@/lib/auth/session";
import { scheduleSchema, ScheduleInput } from "../schemas/schedule.schema";

export async function createSchedule(input: ScheduleInput) {
  const { allowed } = await checkPermission("schedule:create");
  if (!allowed) {
    return { success: false, error: "FORBIDDEN: Anda tidak memiliki hak membuat jadwal." };
  }

  try {
    const validated = scheduleSchema.parse(input);
    const supabase = createServerClient();
    const studentIds = validated.studentIds;

    const { data: schedule, error: schErr } = await supabase
      .from("schedules")
      .insert({
        tutor_id: validated.tutorId,
        program_id: validated.programId,
        bimbel_type_id: validated.bimbelTypeId,
        day_of_week: validated.dayOfWeek,
        start_time: validated.startTime,
        end_time: validated.endTime,
        location: validated.location ?? null,
        notes: validated.notes ?? null,
        status: validated.status,
      })
      .select()
      .single();

    if (schErr || !schedule) {
      return { success: false, error: "Gagal membuat jadwal. Periksa kembali data yang dimasukkan." };
    }

    if (studentIds.length > 0) {
      const mappingRows = studentIds.map((stId) => ({
        schedule_id: schedule.id,
        student_id: stId,
      }));

      const { error: mapErr } = await supabase.from("schedule_students").insert(mappingRows);

      if (mapErr) {
        // Batalkan jadwal yatim agar tidak ada jadwal tanpa peserta.
        await supabase.from("schedules").delete().eq("id", schedule.id);
        return { success: false, error: "Gagal menautkan murid ke jadwal." };
      }
    }

    await supabase.from("audit_logs").insert({
      action: "SCHEDULE_CREATED",
      entity_type: "schedule",
      entity_id: schedule.id,
      metadata: {
        tutorId: validated.tutorId,
        studentCount: studentIds.length,
        studentIds: studentIds,
        dayOfWeek: validated.dayOfWeek,
        time: `${validated.startTime}-${validated.endTime}`,
        subjectId: validated.subjectId,
        targetMaterial: validated.targetMaterial,
      },
    });

    revalidatePath("/management/schedules");
    revalidatePath("/tutor/schedules");
    return { success: true, data: schedule };
  } catch (err: unknown) {
    console.error("Create schedule error:", err);
    return {
      success: false,
      error: getSafeErrorMessage(err, "Terjadi kesalahan sistem saat membuat jadwal."),
    };
  }
}
