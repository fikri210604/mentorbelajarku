import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  CalendarCheck,
  Camera,
  Coins,
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-24 py-12 md:py-20">
      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6">
          <Badge variant="outline" className="px-3.5 py-1 text-sm font-medium gap-1.5 border-primary/30 bg-primary/5 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Sistem Manajemen & Absensi Bimbel Modern
          </Badge>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground font-heading leading-tight">
            Kelola Sesi Belajar, Absensi & Honor Tutor{' '}
            <span className="text-primary underline decoration-primary/30 underline-offset-8">
              Secara Akurat
            </span>
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Platform operasional bimbingan belajar terpadu. Pencatatan absensi langsung dengan foto bukti,
            pelacakan progres materi, pembagian jadwal adaptif, serta penghitungan payroll otomatis.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className={buttonVariants({ size: 'lg', className: 'h-12 px-8 text-base shadow-md' })}
            >
              Masuk ke Portal
            </Link>
          </div>

          {/* Quick Metrics Banner */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 w-full max-w-4xl border rounded-2xl p-6 bg-card shadow-sm">
            <div className="flex flex-col items-center text-center">
              <span className="text-2xl sm:text-3xl font-bold text-foreground">100%</span>
              <span className="text-xs sm:text-sm text-muted-foreground mt-1">Absensi Terverifikasi</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-2xl sm:text-3xl font-bold text-foreground">Real-Time</span>
              <span className="text-xs sm:text-sm text-muted-foreground mt-1">Sinkronisasi Sesi</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-2xl sm:text-3xl font-bold text-foreground">Multi-Tutor</span>
              <span className="text-xs sm:text-sm text-muted-foreground mt-1">Fleksibel & Many-to-Many</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-2xl sm:text-3xl font-bold text-foreground">Server-Safe</span>
              <span className="text-xs sm:text-sm text-muted-foreground mt-1">Audit & Payroll Integritas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Program / Bimbel Type Highlights */}
      <section id="programs" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-3">Layanan Fleksibel</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">
            Tiga Format Pembelajaran Utama
          </h2>
          <p className="text-muted-foreground mt-2">
            Setiap jenis bimbel memiliki durasi dan alokasi sesi terkonfigurasi, disesuaikan dengan kebutuhan belajar murid.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200">
                  Reguler
                </Badge>
                <div className="flex items-center text-sm font-medium text-muted-foreground gap-1">
                  <Clock className="h-4 w-4" /> 60 Menit
                </div>
              </div>
              <CardTitle className="text-xl mt-4">Kelas Reguler</CardTitle>
              <CardDescription>
                Format pembelajaran standar dengan penguatan konsep terstruktur dan latihan intensif berkelanjutan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Kapasitas kelompok fleksibel</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Pelaporan materi per pertemuan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Foto absensi siswa & tutor</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-primary/50">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg">
              POPULER
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200">
                  Intensif
                </Badge>
                <div className="flex items-center text-sm font-medium text-muted-foreground gap-1">
                  <Clock className="h-4 w-4" /> 75 Menit
                </div>
              </div>
              <CardTitle className="text-xl mt-4">Kelas Intensif</CardTitle>
              <CardDescription>
                Dirancang untuk persiapan ujian, pendalaman materi berat, dan akselerasi capaian akademik murid.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Durasi optimal 75 menit</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Pencatatan PR dan pekerjaan rumah</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Dukungan penjadwalan ulang jika izin</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200">
                  Private
                </Badge>
                <div className="flex items-center text-sm font-medium text-muted-foreground gap-1">
                  <Clock className="h-4 w-4" /> 90 Menit
                </div>
              </div>
              <CardTitle className="text-xl mt-4">Kelas Private</CardTitle>
              <CardDescription>
                Bimbingan 1-on-1 eksklusif dengan personalisasi penuh sesuai kecepatan belajar murid secara mendalam.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Fokus total 90 menit per sesi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Catatan perkembangan individual</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Honor tutor disesuaikan per jenis</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-3">Fitur Lengkap</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading">
            Didesain Khusus untuk Operasional Bimbel
          </h2>
          <p className="text-muted-foreground mt-2">
            Dari absensi instan di tempat bimbingan hingga pelaporan honor manajemen yang akurat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="flex flex-col gap-3 p-6 rounded-2xl border bg-card shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Camera className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Absensi Bukti Foto Langsung</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tutor dapat mengambil foto absensi langsung dari browser kamera gadget dan menyimpannya aman di Supabase Storage.
            </p>
          </div>

          <div className="flex flex-col gap-3 p-6 rounded-2xl border bg-card shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Pemisahan Jadwal vs Sesi Nyata</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sistem membedakan jadwal rutin dengan sesi aktual. Murid yang izin (permission) tidak mengurangi paket dan dapat di-reschedule rapi.
            </p>
          </div>

          <div className="flex flex-col gap-3 p-6 rounded-2xl border bg-card shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Coins className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Kalkulasi Honor Transparan</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Honor dihitung berdasarkan tarif per jenis bimbel dan jumlah murid yang hadir, dengan integritas tarif historis yang terlindungi.
            </p>
          </div>

          <div className="flex flex-col gap-3 p-6 rounded-2xl border bg-card shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Relasi Tutor & Murid Fleksibel</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mendukung skenario satu murid diajar beberapa tutor bergantian tanpa mengacaukan riwayat capaian materi siswa.
            </p>
          </div>

          <div className="flex flex-col gap-3 p-6 rounded-2xl border bg-card shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Pencatatan Materi & Evaluasi</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Setiap kehadiran dilengkapi catatan materi yang dipelajari dan evaluasi belajar untuk memantau kemajuan murid dari waktu ke waktu.
            </p>
          </div>

          <div className="flex flex-col gap-3 p-6 rounded-2xl border bg-card shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Audit Log & Otorisasi Server</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Seluruh perubahan kehadiran dan honor diaudit di database, menjamin tidak ada manipulasi data di sisi client browser.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Bottom Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 md:p-14 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground font-heading">
            Siap Mengoptimalkan Operasional Bimbel Anda?
          </h2>
          <p className="max-w-xl mx-auto text-muted-foreground mt-4 text-base md:text-lg">
            Masuk dengan akun Tutor atau Manajemen untuk mulai mengelola jadwal, absensi murid, dan laporan sesi pembelajaran hari ini.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/login" className={buttonVariants({ size: 'lg', className: 'h-12 px-8 shadow-sm' })}>
              Masuk ke Aplikasi
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
