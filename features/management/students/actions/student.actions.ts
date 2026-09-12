"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { studentSchema, StudentInput } from "../schemas/student.schema";

export async function createStudent(input: StudentInput) {
  const validated = studentSchema.parse(input);
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("students")
    .insert({
      student_code: validated.studentCode,
      name: validated.name,
      gender: validated.gender ?? null,
      birth_date: validated.birthDate ?? null,
      school: validated.school ?? null,
      grade: validated.grade ?? null,
      parent_name: validated.parentName ?? null,
      parent_phone: validated.parentPhone ?? null,
      address: validated.address ?? null,
      status: validated.status,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/management/students");
  return { success: true, data };
}

export async function updateStudent(id: string, input: Partial<StudentInput>) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("students")
    .update({
      ...(input.name && { name: input.name }),
      ...(input.gender !== undefined && { gender: input.gender }),
      ...(input.birthDate !== undefined && { birth_date: input.birthDate }),
      ...(input.school !== undefined && { school: input.school }),
      ...(input.grade !== undefined && { grade: input.grade }),
      ...(input.parentName !== undefined && { parent_name: input.parentName }),
      ...(input.parentPhone !== undefined && { parent_phone: input.parentPhone }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.status && { status: input.status }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/management/students");
  revalidatePath(`/management/students/${id}`);
  return { success: true, data };
}
