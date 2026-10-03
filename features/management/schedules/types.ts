import { Tables } from "@/types/database";

export type Schedule = Tables<"schedules">;

export interface ScheduleWithDetails extends Schedule {
  students?: Tables<"students"> | null;
  class_groups?: Tables<"class_groups"> | null;
  tutors?: (Tables<"tutors"> & { profiles?: Tables<"profiles"> | null }) | null;
  programs?: Tables<"programs"> | null;
  bimbel_types?: Tables<"bimbel_types"> | null;
  schedule_students?: Array<
    Tables<"schedule_students"> & {
      students?: Tables<"students"> | null;
    }
  >;
  // Derived helper for UI
  student_names?: string[];
  total_students?: number;
  // Kurikulum & Penugasan Materi
  subject_id?: string | null;
  subject_name?: string | null;
  topic_id?: string | null;
  topic_title?: string | null;
  target_material?: string | null;
  worksheet_url?: string | null;
  worksheet_name?: string | null;
}
