import { Tables } from "@/types/database";

export type Attendance = Tables<"attendance">;

export interface AttendanceWithDetails extends Attendance {
  students?: Tables<"students"> | null;
  sessions?: (Tables<"sessions"> & {
    tutors?: (Tables<"tutors"> & { profiles?: Tables<"profiles"> | null }) | null;
    programs?: Tables<"programs"> | null;
    bimbel_types?: Tables<"bimbel_types"> | null;
  }) | null;
}
