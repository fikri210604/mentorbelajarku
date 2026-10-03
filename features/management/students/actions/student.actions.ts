"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { checkPermission } from "@/lib/auth/session";
import { studentSchema, StudentInput } from "../schemas/student.schema";
import { STUDENTS_CACHE_TAG } from "@/lib/cache/tags";

export async function createStudent(input: StudentInput) {
  const { allowed } = await checkPermission("student:create");
  if (!allowed) {
    return { success: false, error: "FORBIDDEN: Anda tidak memiliki hak menambah murid." };
  }

  const validated = studentSchema.parse(input);
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("students")
    .insert({
      student_code: validated.studentCode,
      name: validated.name,
      gender: validated.gender ?? null,
      birth_date: validated.birthDate ?? null,
      avatar_url: validated.avatarUrl ?? null,
      school: validated.school ?? null,
      level: validated.level ?? "SD",
      grade: validated.grade ?? null,
      parent_name: validated.parentName ?? null,
      parent_phone: validated.parentPhone ?? null,
      address: validated.address ?? null,
      status: validated.status,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: "Gagal menambahkan murid. Periksa kembali data yang dimasukkan." };
  }

  revalidateTag(STUDENTS_CACHE_TAG, "max");
  revalidatePath("/management/students");
  return { success: true, data, message: "Murid baru berhasil ditambahkan!" };
}

export async function updateStudent(id: string, input: Partial<StudentInput>) {
  const { allowed } = await checkPermission("student:update");
  if (!allowed) {
    return { success: false, error: "FORBIDDEN: Anda tidak memiliki hak mengubah data murid." };
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("students")
    .update({
      ...(input.name && { name: input.name }),
      ...(input.gender !== undefined && { gender: input.gender }),
      ...(input.birthDate !== undefined && { birth_date: input.birthDate }),
      ...(input.school !== undefined && { school: input.school }),
      ...(input.level !== undefined && { level: input.level }),
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
    return { success: false, error: "Gagal memperbarui data murid." };
  }

  revalidateTag(STUDENTS_CACHE_TAG, "max");
  revalidatePath("/management/students");
  revalidatePath(`/management/students/${id}`);
  return { success: true, data, message: "Data murid berhasil diperbarui!" };
}

export async function updateStudentStatus(id: string, status: "active" | "inactive") {
  const { allowed } = await checkPermission("student:update");
  if (!allowed) {
    return { success: false, error: "FORBIDDEN: Anda tidak memiliki hak mengubah status murid." };
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("students")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, error: "Gagal mengubah status murid." };
  }

  revalidateTag(STUDENTS_CACHE_TAG, "max");
  revalidatePath("/management/students");
  return {
    success: true,
    message: `Status murid berhasil diubah menjadi ${status === "active" ? "Aktif" : "Nonaktif"}.`,
  };
}

interface DeleteStudentSnapshot {
  name?: string;
  student_code?: string;
}

type DeleteStudentResult =
  | { success: true; message: string }
  | { success: false; error: string };

/**
 * Menghapus murid beserta seluruh relasi turunannya.
 *
 * Jalur utama memakai function Postgres `delete_student_cascade` (migration
 * 0002) sehingga seluruh proses berjalan dalam SATU transaksi (atomik) dan
 * hanya satu round-trip ke database. Bila function belum tersedia, otomatis
 * jatuh ke fallback bertahap agar fitur tetap berjalan.
 */
export async function deleteStudent(id: string): Promise<DeleteStudentResult> {
  const tStart = Date.now();
  const { allowed, user } = await checkPermission("student:delete");
  const authMs = Date.now() - tStart;
  if (!allowed || !user) {
    return { success: false, error: "FORBIDDEN: Anda tidak memiliki hak menghapus data murid." };
  }

  const supabase = createServerClient();
  const tRpcStart = Date.now();
  const { data, error } = await supabase.rpc("delete_student_cascade", {
    p_student_id: id,
    p_actor_user_id: user.user.id,
  });
  const rpcMs = Date.now() - tRpcStart;

  if (error) {
    // Function belum di-apply (migration 0002 belum dijalankan) -> fallback.
    if (error.code === "PGRST202" || /could not find the function/i.test(error.message)) {
      console.info(
        `[deleteStudent] FALLBACK (migration 0002 belum di-apply). auth=${authMs}ms, rpc-probe=${rpcMs}ms`
      );
      return deleteStudentFallback(id, user.user.id);
    }

    console.error("deleteStudent rpc error:", error);
    return {
      success: false,
      error: "Gagal menghapus data murid. Silakan coba beberapa saat lagi.",
    };
  }

  const result = data as {
    success?: boolean;
    error?: string;
    student?: DeleteStudentSnapshot;
  } | null;

  if (!result?.success) {
    return {
      success: false,
      error: result?.error === "NOT_FOUND" ? "Data murid tidak ditemukan." : "Gagal menghapus data murid.",
    };
  }

  revalidateTag(STUDENTS_CACHE_TAG, "max");
  revalidatePath("/management/students");
  revalidatePath("/management/dashboard");
  revalidatePath("/management/schedules");
  revalidatePath("/management/sessions");

  console.info(
    `[deleteStudent] RPC ok. auth=${authMs}ms, rpc=${rpcMs}ms, total=${Date.now() - tStart}ms`
  );

  return {
    success: true,
    message: `Murid "${result.student?.name ?? ""}" (${result.student?.student_code ?? ""}) berhasil dihapus.`,
  };
}

/**
 * Fallback penghapusan bertahap. Hanya dipakai bila function RPC belum
 * tersedia. Operasi independen dijalankan paralel untuk memangkas round-trip.
 */
async function deleteStudentFallback(
  id: string,
  actorUserId: string
): Promise<DeleteStudentResult> {
  const tStart = Date.now();
  const supabase = createServerClient();

  const { data: student, error: fetchErr } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const fetchMs = Date.now() - tStart;

  if (fetchErr || !student) {
    return { success: false, error: "Data murid tidak ditemukan." };
  }

  try {
    // Relasi independen dijalankan paralel (4 round-trip -> 1).
    const tBatch1 = Date.now();
    await Promise.all([
      supabase.from("tutor_payment_items").update({ student_id: null }).eq("student_id", id),
      supabase.from("progress_reports").delete().eq("student_id", id),
      supabase.from("schedule_students").delete().eq("student_id", id),
      supabase.from("enrollments").delete().eq("student_id", id),
    ]);
    const batch1Ms = Date.now() - tBatch1;

    // learning_records lebih dulu dari attendance (FK cascade attendance -> learning_records).
    const tRecords = Date.now();
    await supabase.from("learning_records").delete().eq("student_id", id);
    await supabase.from("attendance").delete().eq("student_id", id);
    const recordsMs = Date.now() - tRecords;

    const tDelete = Date.now();
    const { error: deleteErr } = await supabase.from("students").delete().eq("id", id);
    const deleteMs = Date.now() - tDelete;
    if (deleteErr) {
      console.error("deleteStudent fallback error:", deleteErr);
      return { success: false, error: "Gagal menghapus data murid." };
    }

    await supabase.from("audit_logs").insert({
      user_id: actorUserId,
      action: "DELETE_STUDENT",
      entity_type: "students",
      entity_id: id,
      metadata: {
        student_code: student.student_code,
        name: student.name,
        school: student.school,
        level: student.level,
        grade: student.grade,
        parent_name: student.parent_name,
        parent_phone: student.parent_phone,
        status: student.status,
      },
    });

    revalidateTag(STUDENTS_CACHE_TAG, "max");
    revalidatePath("/management/students");
    revalidatePath("/management/dashboard");
    revalidatePath("/management/schedules");
    revalidatePath("/management/sessions");

    console.info(
      `[deleteStudent] FALLBACK ok. fetch=${fetchMs}ms, batch1=${batch1Ms}ms, records+attendance=${recordsMs}ms, delete=${deleteMs}ms, total=${Date.now() - tStart}ms`
    );

    return {
      success: true,
      message: `Murid "${student.name}" (${student.student_code}) berhasil dihapus.`,
    };
  } catch (err: unknown) {
    console.error("deleteStudent fallback catch error:", err);
    return {
      success: false,
      error: "Terjadi kesalahan internal saat menghapus data murid.",
    };
  }
}

