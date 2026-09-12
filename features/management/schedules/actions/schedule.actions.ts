"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { scheduleSchema, ScheduleInput } from "../schemas/schedule.schema";
import { SYNTHETIC_SCHEDULES } from "@/data/schedules";
import { SYNTHETIC_TUTORS } from "@/data/tutors";
import { SYNTHETIC_PROGRAMS } from "@/data/programs";
import { SYNTHETIC_BIMBEL_TYPES } from "@/data/bimbel-types";
import { SYNTHETIC_STUDENTS } from "@/data/students";

export async function createSchedule(input: ScheduleInput) {
  try {
    const validated = scheduleSchema.parse(input);
    const supabase = createServerClient();
    const studentIds = validated.studentIds;

    // 1. Coba simpan ke PostgreSQL via Supabase
    try {
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

      if (!schErr && schedule) {
        // 2. Simpan seluruh murid yang ditugaskan ke dalam tabel schedule_students
        if (studentIds.length > 0) {
          const mappingRows = studentIds.map((stId) => ({
            schedule_id: schedule.id,
            student_id: stId,
          }));

          const { error: mapErr } = await supabase
            .from("schedule_students")
            .insert(mappingRows);

          if (mapErr) {
            console.error("Error inserting schedule_students mapping:", mapErr);
          }
        }

        // 3. Catat audit log
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
          },
        });

        revalidatePath("/management/schedules");
        revalidatePath("/tutor/schedules");
        return { success: true, data: schedule };
      }
    } catch (dbErr) {
      console.warn("Supabase schedule insert fallback to synthetic:", dbErr);
    }

    // 4. Fallback Prototype Mode (Simpan ke memory untuk testing demo tanpa error)
    const tutor = SYNTHETIC_TUTORS.find((t) => t.id === validated.tutorId);
    const program = SYNTHETIC_PROGRAMS.find((p) => p.id === validated.programId);
    const bimbelType = SYNTHETIC_BIMBEL_TYPES.find((b) => b.id === validated.bimbelTypeId);
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const firstStudent = SYNTHETIC_STUDENTS.find((s) => s.id === studentIds[0]);

    const newSyntheticSchedule = {
      id: `sch-${Date.now()}`,
      day_of_week: validated.dayOfWeek,
      day_name: days[validated.dayOfWeek] || "Senin",
      start_time: validated.startTime,
      end_time: validated.endTime,
      tutor_id: validated.tutorId,
      tutor_name: tutor?.name || "Tutor Pengajar",
      student_id: studentIds[0],
      student_name:
        studentIds.length === 1
          ? firstStudent?.name || "Murid Privat"
          : undefined,
      student_code: firstStudent?.student_code,
      class_group_name:
        studentIds.length > 1
          ? `Kelas Kelompok (${studentIds.length} Murid)`
          : undefined,
      program_id: validated.programId,
      program_name: program?.name || "Program Bimbel",
      bimbel_type_id: validated.bimbelTypeId,
      bimbel_type_name: bimbelType?.name || "Reguler",
      duration_minutes: bimbelType?.duration_minutes || 60,
      status: validated.status,
    };

    SYNTHETIC_SCHEDULES.unshift(newSyntheticSchedule as any);

    revalidatePath("/management/schedules");
    revalidatePath("/tutor/schedules");
    return { success: true, data: newSyntheticSchedule };
  } catch (err: unknown) {
    console.error("Create schedule error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Terjadi kesalahan sistem saat membuat jadwal.",
    };
  }
}
