import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  className?: string;
  children?: React.ReactNode;
}

export type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "danger"
  | "info";

export const STATUS_LABELS: Record<string, { label: string; variant: BadgeVariant }> = {
  // Presensi
  present: { label: "Hadir", variant: "success" },
  absent: { label: "Absen", variant: "danger" },
  permission: { label: "Izin", variant: "warning" },
  sick: { label: "Sakit", variant: "info" },
  late: { label: "Terlambat", variant: "warning" },

  // Sesi & Status Umum
  active: { label: "Aktif", variant: "success" },
  inactive: { label: "Nonaktif", variant: "secondary" },
  graduated: { label: "Lulus", variant: "secondary" },
  scheduled: { label: "Terjadwal", variant: "info" },
  completed: { label: "Selesai", variant: "success" },
  cancelled: { label: "Dibatalkan", variant: "danger" },
  rescheduled: { label: "Dijadwal Ulang", variant: "warning" },

  // Payroll & Verifikasi
  draft: { label: "Draft", variant: "secondary" },
  processed: { label: "Diproses", variant: "info" },
  paid: { label: "Dibayar", variant: "success" },
  submitted: { label: "Diajukan", variant: "info" },
  verified: { label: "Terverifikasi", variant: "success" },
  correction_requested: { label: "Minta Koreksi", variant: "danger" },
};

export function StatusBadge({ status, className, children }: StatusBadgeProps) {
  const config = STATUS_LABELS[status] || {
    label: status,
    variant: "outline" as BadgeVariant,
  };

  return (
    <Badge variant={config.variant} className={className}>
      {children || config.label}
    </Badge>
  );
}


