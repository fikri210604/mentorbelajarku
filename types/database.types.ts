export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'management' | 'tutor' | 'admin' | 'finance';
export type StudentStatus = 'active' | 'inactive' | 'graduated';
export type TutorStatus = 'active' | 'inactive';
export type BimbelTypeStatus = 'active' | 'inactive';
export type ProgramStatus = 'active' | 'inactive';
export type EnrollmentStatus = 'active' | 'completed' | 'cancelled';
export type ScheduleStatus = 'active' | 'inactive';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
export type AttendanceStatus = 'present' | 'absent' | 'permission' | 'sick' | 'late';
export type VerificationStatus = 'submitted' | 'verified' | 'correction_requested';
export type PayrollStatus = 'draft' | 'processed' | 'paid';

type WithUpdate<T extends Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Relationships: unknown[] }>> = {
  [K in keyof T]: {
    Row: T[K]['Row'];
    Insert: T[K]['Insert'];
    Update: Partial<T[K]['Insert']>;
    Relationships: T[K]['Relationships'];
  };
};

export type Database = {
  public: {
    Tables: WithUpdate<{
      user: {
        Row: {
          id: string;
          name: string;
          email: string;
          email_verified: boolean;
          image: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          email_verified?: boolean;
          image?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          role: UserRole;
          must_change_password: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          must_change_password?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      tutors: {
        Row: {
          id: string;
          profile_id: string;
          bio: string | null;
          status: TutorStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          bio?: string | null;
          status?: TutorStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      programs: {
        Row: {
          id: string;
          code: string;
          name: string;
          level: string;
          description: string | null;
          status: ProgramStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code?: string;
          name: string;
          level: string;
          description?: string | null;
          status?: ProgramStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      bimbel_types: {
        Row: {
          id: string;
          name: string;
          duration_minutes: number;
          description: string | null;
          status: BimbelTypeStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          duration_minutes: number;
          description?: string | null;
          status?: BimbelTypeStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      bimbel_packages: {
        Row: {
          id: string;
          bimbel_type_id: string;
          name: string;
          level: string;
          max_meetings: number;
          duration_minutes: number;
          monthly_price: number;
          description: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bimbel_type_id: string;
          name: string;
          level: string;
          max_meetings?: number;
          duration_minutes?: number;
          monthly_price?: number;
          description?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      students: {
        Row: {
          id: string;
          student_code: string;
          name: string;
          gender: 'male' | 'female' | null;
          birth_date: string | null;
          school: string | null;
          grade: string | null;
          level: string;
          parent_name: string | null;
          parent_phone: string | null;
          address: string | null;
          status: StudentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_code: string;
          name: string;
          gender?: 'male' | 'female' | null;
          birth_date?: string | null;
          school?: string | null;
          grade?: string | null;
          level?: string;
          parent_name?: string | null;
          parent_phone?: string | null;
          address?: string | null;
          status?: StudentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      enrollments: {
        Row: {
          id: string;
          student_id: string;
          program_id: string;
          bimbel_type_id: string;
          package_id: string | null;
          package_name: string;
          max_meetings: number;
          price: number;
          start_date: string;
          end_date: string | null;
          status: EnrollmentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          program_id: string;
          bimbel_type_id: string;
          package_id?: string | null;
          package_name?: string;
          max_meetings?: number;
          price?: number;
          start_date?: string;
          end_date?: string | null;
          status?: EnrollmentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      student_programs: {
        Row: {
          id: string;
          student_id: string;
          program_id: string;
          bimbel_type_id: string;
          total_sessions: number;
          start_date: string;
          end_date: string | null;
          status: EnrollmentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          program_id: string;
          bimbel_type_id: string;
          total_sessions: number;
          start_date: string;
          end_date?: string | null;
          status?: EnrollmentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      class_groups: {
        Row: {
          id: string;
          name: string;
          program_id: string;
          bimbel_type_id: string;
          capacity: number | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          program_id: string;
          bimbel_type_id: string;
          capacity?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      class_group_members: {
        Row: {
          id: string;
          class_group_id: string;
          student_id: string;
          joined_at: string;
          left_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_group_id: string;
          student_id: string;
          joined_at?: string;
          left_at?: string | null;
          created_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      schedules: {
        Row: {
          id: string;
          student_id: string | null;
          class_group_id: string | null;
          tutor_id: string;
          program_id: string;
          bimbel_type_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          location: string | null;
          notes: string | null;
          status: ScheduleStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id?: string | null;
          class_group_id?: string | null;
          tutor_id: string;
          program_id: string;
          bimbel_type_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          location?: string | null;
          notes?: string | null;
          status?: ScheduleStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      schedule_students: {
        Row: {
          id: string;
          schedule_id: string;
          student_id: string;
          enrollment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          schedule_id: string;
          student_id: string;
          enrollment_id?: string | null;
          created_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      sessions: {
        Row: {
          id: string;
          schedule_id: string | null;
          tutor_id: string;
          program_id: string;
          bimbel_type_id: string;
          class_group_id: string | null;
          session_date: string;
          start_time: string;
          end_time: string;
          status: SessionStatus;
          rescheduled_from_session_id: string | null;
          notes: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          schedule_id?: string | null;
          tutor_id: string;
          program_id: string;
          bimbel_type_id: string;
          class_group_id?: string | null;
          session_date: string;
          start_time: string;
          end_time: string;
          status?: SessionStatus;
          rescheduled_from_session_id?: string | null;
          notes?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      attendance: {
        Row: {
          id: string;
          session_id: string;
          student_id: string;
          enrollment_id: string | null;
          student_program_id: string | null;
          status: AttendanceStatus;
          verification_status: VerificationStatus;
          photo_path: string | null;
          material: string | null;
          notes: string | null;
          checked_in_at: string | null;
          checked_in_by: string | null;
          verified_at: string | null;
          verified_by: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          student_id: string;
          enrollment_id?: string | null;
          student_program_id?: string | null;
          status: AttendanceStatus;
          verification_status?: VerificationStatus;
          photo_path?: string | null;
          material?: string | null;
          notes?: string | null;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      learning_records: {
        Row: {
          id: string;
          attendance_id: string;
          tutor_id: string;
          student_id: string;
          material: string;
          notes: string | null;
          homework: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          attendance_id: string;
          tutor_id: string;
          student_id: string;
          material: string;
          notes?: string | null;
          homework?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      progress_reports: {
        Row: {
          id: string;
          student_id: string;
          enrollment_id: string | null;
          tutor_id: string | null;
          period_title: string;
          achievement: string;
          evaluation: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          enrollment_id?: string | null;
          tutor_id?: string | null;
          period_title: string;
          achievement: string;
          evaluation: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      tutor_rates: {
        Row: {
          id: string;
          tutor_id: string | null;
          bimbel_type_id: string;
          level: string;
          rate_per_student: number;
          effective_from: string;
          effective_until: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tutor_id?: string | null;
          bimbel_type_id: string;
          level?: string;
          rate_per_student: number;
          effective_from: string;
          effective_until?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      management_rates: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          role_level: string;
          rate_type: string;
          amount: number;
          effective_from: string;
          effective_until: string | null;
          description: string | null;
          status: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          role_level: string;
          rate_type?: string;
          amount: number;
          effective_from: string;
          effective_until?: string | null;
          description?: string | null;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tutor_payments: {
        Row: {
          id: string;
          tutor_id: string;
          period_start: string;
          period_end: string;
          gross_amount: number;
          bonus: number;
          deduction: number;
          net_amount: number;
          status: PayrollStatus;
          paid_at: string | null;
          processed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tutor_id: string;
          period_start: string;
          period_end: string;
          gross_amount?: number;
          bonus?: number;
          deduction?: number;
          net_amount?: number;
          status?: PayrollStatus;
          paid_at?: string | null;
          processed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      tutor_payment_items: {
        Row: {
          id: string;
          tutor_payment_id: string;
          session_id: string;
          student_id: string;
          bimbel_type_id: string;
          rate: number;
          quantity: number;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          tutor_payment_id: string;
          session_id: string;
          student_id: string;
          bimbel_type_id: string;
          rate: number;
          quantity?: number;
          amount: number;
          created_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
    }>;
    Views: {
      student_programs: {
        Row: {
          id: string;
          student_id: string;
          program_id: string;
          bimbel_type_id: string;
          total_sessions: number;
          start_date: string;
          end_date: string | null;
          status: EnrollmentStatus;
          created_at: string;
          updated_at: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      v_attendance_with_meeting_number: {
        Row: {
          id: string;
          session_id: string;
          student_id: string;
          enrollment_id: string | null;
          status: AttendanceStatus;
          verification_status: VerificationStatus;
          photo_path: string | null;
          material: string | null;
          notes: string | null;
          checked_in_at: string | null;
          session_date: string;
          start_time: string;
          end_time: string;
          session_tutor_id: string;
          tutor_name: string | null;
          student_name: string;
          student_code: string;
          program_name: string | null;
          bimbel_type_name: string | null;
          max_meetings: number | null;
          enrollment_status: EnrollmentStatus | null;
          meeting_number: number | null;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      student_status: StudentStatus;
      tutor_status: TutorStatus;
      bimbel_type_status: BimbelTypeStatus;
      program_status: ProgramStatus;
      enrollment_status: EnrollmentStatus;
      schedule_status: ScheduleStatus;
      session_status: SessionStatus;
      attendance_status: AttendanceStatus;
      verification_status: VerificationStatus;
      payroll_status: PayrollStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
