import { Tables } from "@/types/database";

export type Attendance = Tables<"attendance">;

export interface LearningRecordSummary {
  id: string;
  material: string | null;
  notes: string | null;
}

export interface AttendanceWithDetails extends Attendance {
  students?: Tables<"students"> | null;
  /** Signed URL sementara (dibuat server-side) untuk menampilkan bukti foto. */
  photo_url?: string | null;
  /** Materi pembelajaran: berasal dari relasi learning_records, bukan kolom attendance. */
  learning_records?: LearningRecordSummary | LearningRecordSummary[] | null;
  /** Proyeksi ringkas materi untuk tampilan tabel (diturunkan dari learning_records). */
  material?: string | null;
  sessions?: (Tables<"sessions"> & {
    tutors?: (Tables<"tutors"> & { profiles?: Tables<"profiles"> | null }) | null;
    programs?: Tables<"programs"> | null;
    bimbel_types?: Tables<"bimbel_types"> | null;
  }) | null;
}
