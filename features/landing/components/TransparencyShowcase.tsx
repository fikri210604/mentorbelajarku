import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Camera,
  CalendarCheck,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  ShieldCheck,
  Award,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export function TransparencyShowcase() {
  return (
    <section id="keunggulan" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-muted/30 rounded-3xl my-8 border">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Side: Mockup Card of Actual Session & Attendance Report */}
        <div className="lg:col-span-6 relative">
          <div className="relative mx-auto max-w-md rounded-2xl border-2 border-primary/20 bg-card p-5 shadow-xl">
            {/* Header of Mockup Card */}
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                  MB
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Laporan Sesi Belajar</h4>
                  <p className="text-[10px] text-muted-foreground">ID Sesi: SES-2026-0912</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 text-[11px] font-bold">
                ✓ Hadir Tepat Waktu
              </Badge>
            </div>

            {/* Attendance Photo Verification Simulation */}
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-xl border bg-muted/60 p-4 flex flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
                  <Camera className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-foreground">
                  Foto Presensi Siswa & Tutor Terverifikasi
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  Terekam otomatis melalui kamera browser saat sesi berlangsung
                </span>
              </div>

              {/* Learning Progress Info */}
              <div className="rounded-xl border bg-background p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center text-muted-foreground border-b pb-1.5">
                  <span>Mata Pelajaran:</span>
                  <span className="font-bold text-foreground">Matematika Wajib (Kelas 11)</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground border-b pb-1.5">
                  <span>Topik Bahasan:</span>
                  <span className="font-semibold text-foreground">Persamaan & Pertidaksamaan Polinomial</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground border-b pb-1.5">
                  <span>Waktu & Durasi:</span>
                  <span className="font-semibold text-foreground">16.00 - 17.15 WIB (75 Menit)</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Catatan Evaluasi Tutor:</span>
                  <p className="text-[11px] bg-muted/40 p-2 rounded text-foreground italic leading-relaxed">
                    "Ananda Alghazy memahami teorema sisa dengan baik. Mampu menyelesaikan 6 latihan soal tingkat sedang dan 2 soal HOTS secara mandiri."
                  </p>
                </div>
              </div>
            </div>

            {/* Notification Badge */}
            <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground bg-primary/5 px-3 py-2 rounded-lg border border-primary/10">
              <div className="flex items-center gap-1.5 text-primary font-medium">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Terverifikasi di Sistem Akademik</span>
              </div>
              <span className="font-bold text-foreground">Status: Sukses</span>
            </div>
          </div>
        </div>

        {/* Right Side: Copywriting for Parents & Trust */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div>
            <Badge variant="outline" className="px-3 py-1 text-xs font-semibold border-primary/30 bg-primary/10 text-primary mb-3">
              Transparansi Belajar 100%
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading leading-tight">
              Orang Tua Tenang, Belajar Anak Terpantau Nyata
            </h2>
            <p className="text-muted-foreground mt-3 text-base sm:text-lg leading-relaxed">
              Kekhawatiran terbesar orang tua adalah tidak mengetahui apakah anak benar-benar belajar dan seberapa jauh kemajuannya. Di Mentor Belajarku, setiap sesi diaudit dan dilaporkan secara profesional.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-foreground">
                  Presensi Bukti Foto Langsung
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  Bukan sekadar centang kertas manual. Tutor melakukan presensi langsung dengan kamera perangkat, membuktikan kehadiran siswa secara akurat dan tepat waktu.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-foreground">
                  Pencatatan Materi & Evaluasi per Pertemuan
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  Tutor mencatat ringkasan sub-bab yang dipelajari dan progres penguasaan latihan soal siswa, memberikan gambaran jelas kesiapan menghadapi ujian sekolah.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-foreground">
                  Sistem Reschedule Ramah Siswa
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  Siswa berhalangan hadir karena sakit atau agenda mendadak dari sekolah? Sesi izin tidak dianggap hangus dan dapat dijadwalkan ulang dengan histori utuh.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
