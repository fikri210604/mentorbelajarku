import { Tables } from "@/types/database";

export type Session = Tables<"sessions">;

export interface SessionStudentItem {
  id: string;
  student_code: string;
  name: string;
  school?: string | null;
  grade?: string | null;
  status?: string | null;
  enrollment_id?: string | null;
}

export interface SessionWithDetails extends Session {
  tutors?: (Tables<"tutors"> & { profiles?: Tables<"profiles"> | null }) | null;
  programs?: Tables<"programs"> | null;
  bimbel_types?: Tables<"bimbel_types"> | null;
  attendance?: (Tables<"attendance"> & { students?: Tables<"students"> | null })[];
  schedules?: {
    id: string;
    schedule_students?: {
      id: string;
      student_id: string;
      enrollment_id: string | null;
      students: Tables<"students"> | null;
    }[];
  } | null;
  students?: SessionStudentItem[];
}
