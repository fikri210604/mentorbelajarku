"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker, TimePicker } from "@/components/ui/date-picker";
import { rescheduleSessionAction } from "@/features/management/sessions/actions/session.actions";

interface RescheduleSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: {
    id: string;
    session_date: string;
    start_time: string;
    end_time: string;
    program_name?: string;
  };
}

export function RescheduleSessionDialog({
  open,
  onOpenChange,
  session,
}: RescheduleSessionDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Default tanggal baru: 7 hari setelah sesi lama
  const [newDate, setNewDate] = useState(() => {
    try {
      const d = new Date(session.session_date);
      d.setDate(d.getDate() + 7);
      return d.toISOString().split("T")[0];
    } catch {
      return new Date().toISOString().split("T")[0];
    }
  });

  const [newStartTime, setNewStartTime] = useState(session.start_time?.slice(0, 5) || "16:00");
  const [newEndTime, setNewEndTime] = useState(session.end_time?.slice(0, 5) || "17:00");
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newDate) {
      toast.error("Tanggal sesi baru wajib diisi.");
      return;
    }

    if (newEndTime <= newStartTime) {
      toast.error("Jam selesai harus lebih akhir daripada jam mulai.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await rescheduleSessionAction({
          originalSessionId: session.id,
          newDate,
          newStartTime: `${newStartTime}:00`,
          newEndTime: `${newEndTime}:00`,
          reason: reason.trim() || undefined,
        });

        if (!res.success) {
          toast.error(res.error.message || "Gagal menjadwalkan ulang sesi.");
          return;
        }

        toast.success(res.message || "Sesi berhasil dijadwalkan ulang!");
        onOpenChange(false);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Terjadi kesalahan sistem saat reschedule.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="w-4 h-4 text-emerald-600" />
              Jadwalkan Ulang Sesi (Reschedule)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Sesi lama ({session.session_date}) akan ditandai sebagai <em>rescheduled</em> dengan riwayat utuh, dan sesi baru akan dibuat tanpa memotong kuota paket murid sebelum pembelajaran pengganti berlangsung.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="reschedule-date" className="text-xs font-semibold">
                Tanggal Sesi Baru Pengganti
              </Label>
              <DatePicker
                id="reschedule-date"
                value={newDate}
                onChange={(_, dateStr) => setNewDate(dateStr)}
                placeholder="Pilih tanggal pengganti"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label htmlFor="start-time" className="text-xs font-semibold">
                  Jam Mulai
                </Label>
                <TimePicker
                  id="start-time"
                  value={newStartTime}
                  onChange={(t) => setNewStartTime(t)}
                  placeholder="Pilih jam mulai"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end-time" className="text-xs font-semibold">
                  Jam Selesai
                </Label>
                <TimePicker
                  id="end-time"
                  value={newEndTime}
                  onChange={(t) => setNewEndTime(t)}
                  placeholder="Pilih jam selesai"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reschedule-reason" className="text-xs font-semibold">
                Alasan Penjadwalan Ulang (Opsional)
              </Label>
              <Textarea
                id="reschedule-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Murid izin sakit / Tutor berhalangan..."
                className="text-xs resize-none"
              />
            </div>

            <p className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded border border-border/50">
              💡 Sesuai aturan sistem: Sesi pengganti akan otomatis tertaut ke sesi asal via <code>rescheduled_from_session_id</code>.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Jadwalkan Ulang</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
