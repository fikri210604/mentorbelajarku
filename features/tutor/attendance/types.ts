import { Tables } from "@/types/database";

export type Attendance = Tables<"attendance">;

export interface AttendanceWithDetails extends Attendance {
  students?: Tables<"students"> | null;
  /** Signed URL sementara (dibuat server-side) untuk menampilkan bukti foto. */
  photo_url?: string | null;
  /** Materi diturunkan dari relasi learning_records. */
  learning_records?: { id: string; material: string | null; notes: string | null } | { id: string; material: string | null; notes: string | null }[] | null;
  material?: string | null;
  sessions?: (Tables<"sessions"> & {
    tutors?: (Tables<"tutors"> & { profiles?: Tables<"profiles"> | null }) | null;
    programs?: Tables<"programs"> | null;
    bimbel_types?: Tables<"bimbel_types"> | null;
  }) | null;
}
