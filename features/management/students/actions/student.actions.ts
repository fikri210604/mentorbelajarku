"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { studentSchema, StudentInput } from "../schemas/student.schema";

export async function createStudent(input: StudentInput) {
  const validated = studentSchema.parse(input);
  try {
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

    if (!error && data) {
      revalidatePath("/management/students");
      return { success: true, data };
    }
  } catch (err) {
    console.warn("createStudent Supabase fallback:", err);
  }

  // Update in-memory synthetic students for local demo/prototype
  try {
    const { SYNTHETIC_STUDENTS } = await import("@/data/students");
    const newStudent = {
      id: `std-${Date.now()}`,
      student_code: validated.studentCode,
      name: validated.name,
      gender: (validated.gender as any) || "male",
      school: validated.school || "-",
      grade: validated.grade || "-",
      parent_name: validated.parentName || "-",
      parent_phone: validated.parentPhone || "-",
      address: validated.address || "-",
      status: (validated.status as any) || "active",
      enrolled_program: "Bimbel Reguler",
      bimbel_type: "Reguler",
    };
    SYNTHETIC_STUDENTS.unshift(newStudent);
  } catch (err) {
    console.warn("SYNTHETIC_STUDENTS fallback error:", err);
  }

  revalidatePath("/management/students");
  return { success: true, message: "Murid baru berhasil ditambahkan!" };
}

export async function updateStudent(id: string, input: Partial<StudentInput>) {
  try {
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

    if (!error && data) {
      revalidatePath("/management/students");
      revalidatePath(`/management/students/${id}`);
      return { success: true, data };
    }
  } catch (err) {
    console.warn("updateStudent Supabase fallback:", err);
  }

  // Update in-memory synthetic students for local demo/prototype
  try {
    const { SYNTHETIC_STUDENTS } = await import("@/data/students");
    const student = SYNTHETIC_STUDENTS.find((s) => s.id === id || s.student_code === id);
    if (student) {
      if (input.name) student.name = input.name;
      if (input.school) student.school = input.school;
      if (input.grade) student.grade = input.grade;
      if (input.parentName) student.parent_name = input.parentName;
      if (input.parentPhone) student.parent_phone = input.parentPhone;
      if (input.address) student.address = input.address;
      if (input.status) student.status = input.status as any;
    }
  } catch (err) {
    console.warn("SYNTHETIC_STUDENTS update fallback error:", err);
  }

  revalidatePath("/management/students");
  revalidatePath(`/management/students/${id}`);
  return { success: true, message: "Data murid berhasil diperbarui!" };
}

export async function updateStudentStatus(id: string, status: "active" | "inactive") {
  try {
    const supabase = createServerClient();
    await supabase
      .from("students")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
  } catch (err) {
    console.warn("Supabase updateStudentStatus fallback:", err);
  }

  // Update in-memory synthetic students for local demo/prototype
  try {
    const { SYNTHETIC_STUDENTS } = await import("@/data/students");
    const student = SYNTHETIC_STUDENTS.find((s) => s.id === id || s.student_code === id);
    if (student) {
      student.status = status;
    }
  } catch (err) {
    console.warn("SYNTHETIC_STUDENTS update fallback error:", err);
  }

  revalidatePath("/management/students");
  revalidatePath(`/management/students/${id}`);
  revalidatePath("/management/dashboard");
  return {
    success: true,
    message: `Status murid berhasil diubah menjadi ${status === "active" ? "Aktif" : "Nonaktif"}.`,
  };
}
