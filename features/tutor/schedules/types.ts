import { Tables } from "@/types/database";

export type Schedule = Tables<"schedules">;

export interface ScheduleWithDetails extends Schedule {
  students?: Tables<"students"> | null;
  class_groups?: Tables<"class_groups"> | null;
  schedule_students?: Array<{
    id?: string;
    student_id?: string;
    students?: Tables<"students"> | null;
  }>;
  student_names?: string[];
  tutors?: (Tables<"tutors"> & { profiles?: Tables<"profiles"> | null }) | null;
  programs?: Tables<"programs"> | null;
  bimbel_types?: Tables<"bimbel_types"> | null;
}
