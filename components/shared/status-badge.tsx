import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Aktif", variant: "default" },
  inactive: { label: "Nonaktif", variant: "secondary" },
  graduated: { label: "Lulus", variant: "outline" },
  scheduled: { label: "Terjadwal", variant: "outline" },
  completed: { label: "Selesai", variant: "default" },
  cancelled: { label: "Dibatalkan", variant: "destructive" },
  rescheduled: { label: "Dijadwal Ulang", variant: "secondary" },
  present: { label: "Hadir", variant: "default" },
  absent: { label: "Absen", variant: "destructive" },
  permission: { label: "Izin", variant: "secondary" },
  sick: { label: "Sakit", variant: "secondary" },
  late: { label: "Terlambat", variant: "outline" },
  draft: { label: "Draft", variant: "outline" },
  processed: { label: "Diproses", variant: "secondary" },
  paid: { label: "Dibayar", variant: "default" },
  submitted: { label: "Diajukan", variant: "outline" },
  verified: { label: "Terverifikasi", variant: "default" },
  correction_requested: { label: "Minta Koreksi", variant: "destructive" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_LABELS[status] || { label: status, variant: "outline" };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
