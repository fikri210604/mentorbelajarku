import { Tables } from "@/types/database";

export type Student = Tables<"students">;
export type StudentProgram = Tables<"student_programs">;

export interface StudentWithPrograms extends Student {
  student_programs?: (StudentProgram & {
    programs?: Tables<"programs"> | null;
    bimbel_types?: Tables<"bimbel_types"> | null;
  })[];
  enrollments?: (Tables<"enrollments"> & {
    programs?: Tables<"programs"> | null;
    bimbel_types?: Tables<"bimbel_types"> | null;
  })[];
}
