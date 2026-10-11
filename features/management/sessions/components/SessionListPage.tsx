"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Eye,
  Sparkles,
  Loader2,
  CalendarPlus,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { generateSessionsAction } from "../actions/session.actions";
import { SessionWithDetails } from "../types";

interface SessionListPageProps {
  initialSessions?: SessionWithDetails[];
}

export default function SessionListPage({
  initialSessions = [],
}: SessionListPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [targetDate, setTargetDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [mode, setMode] = useState<"today" | "custom" | "week">("today");

  const handleGenerate = (generationMode: "today" | "custom" | "week") => {
    startTransition(async () => {
      try {
        let input: any = {};
        const todayStr = new Date().toISOString().split("T")[0];

        if (generationMode === "today") {
          input = { targetDate: todayStr };
        } else if (generationMode === "week") {
          const start = new Date();
          const end = new Date();
          end.setDate(start.getDate() + 6);
          input = {
            startDate: start.toISOString().split("T")[0],
            endDate: end.toISOString().split("T")[0],
          };
        } else {
          input = { targetDate };
        }

        const res = await generateSessionsAction(input);

        if (!res.success) {
          toast.error(res.error.message || "Gagal membuat sesi.");
          return;
        }

        toast.success(res.message || "Sesi berhasil digenerate!");
        setIsDialogOpen(false);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Terjadi kesalahan saat memproses sesi.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sesi Pembelajaran Aktual"
        description="Pencatatan sesi pertemuan riil antara tutor dan murid sebagai dasar absensi dan honor."
      >
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <CalendarPlus className="w-4 h-4" />
          Generate Sesi dari Jadwal
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                Generate Sesi Pembelajaran
              </DialogTitle>
              <DialogDescription>
                Sistem akan membaca jadwal rutin (schedules) yang aktif dan
                membuat sesi pembelajaran aktual pada tanggal yang dipilih.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={mode === "today" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("today")}
                  className={
                    mode === "today"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : ""
                  }
                >
                  Hari Ini
                </Button>
                <Button
                  type="button"
                  variant={mode === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("week")}
                  className={
                    mode === "week"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : ""
                  }
                >
                  7 Hari ke Depan
                </Button>
                <Button
                  type="button"
                  variant={mode === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("custom")}
                  className={
                    mode === "custom"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : ""
                  }
                >
                  Pilih Tanggal
                </Button>
              </div>

              {mode === "custom" && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="target-date">Tanggal Spesifik</Label>
                  <DatePicker
                    id="target-date"
                    value={targetDate}
                    onChange={(_, str) => setTargetDate(str)}
                    placeholder="Pilih tanggal sesi"
                  />
                </div>
              )}

              <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded border border-border/50">
                💡 Sesi yang sudah ada untuk jadwal dan tanggal yang sama tidak
                akan terduplikasi.
              </p>
            </div>

            <DialogFooter className="flex sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleGenerate(mode)}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Jalankan Generasi
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {initialSessions.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Tidak ada sesi pembelajaran"
          description="Belum ada sesi pembelajaran aktual yang tercatat. Anda dapat men-generate sesi hari ini langsung dari jadwal rutin."
          action={
            <Button
              onClick={() => handleGenerate("today")}
              disabled={isPending}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Membuat Sesi...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Sesi Hari Ini Sekarang
                </>
              )}
            </Button>
          }
        />
      ) : (
        <div className="rounded-md border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Tanggal & Jam</th>
                  <th className="px-4 py-3">Program / Tipe</th>
                  <th className="px-4 py-3">Tutor Aktual</th>
                  <th className="px-4 py-3">Murid Sesi</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {initialSessions.map((session) => {
                  const studentCount =
                    session.students?.length ?? session.attendance?.length ?? 0;
                  return (
                    <tr
                      key={session.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">
                        {session.session_date}
                        <span className="text-xs text-muted-foreground block">
                          {session.start_time.slice(0, 5)} -{" "}
                          {session.end_time.slice(0, 5)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">
                          {session.programs?.name}
                        </span>
                        <span className="text-muted-foreground text-xs block">
                          {session.bimbel_types?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {session.tutors?.profiles?.full_name || "Tutor"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {studentCount}
                        </span>{" "}
                        murid
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={session.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Lihat Detail Sesi"
                          aria-label="Lihat Detail Sesi"
                        >
                          <Link href={`/management/sessions/${session.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
