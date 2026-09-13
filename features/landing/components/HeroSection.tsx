import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { LeadCaptureForm } from './LeadCaptureForm';
import {
  GraduationCap,
  Target,
  CheckCircle2,
  Sparkles,
  Award,
  BookCheck,
  Star,
  ArrowRight,
} from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 md:pt-12 md:pb-24 border-b bg-radial-[at_20%_20%] from-primary/5 via-background to-background">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Inten Style Copywriting & Values */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="px-3.5 py-1 text-xs sm:text-sm font-semibold gap-1.5 border-primary/30 bg-primary/10 text-primary">
                <Target className="h-4 w-4" />
                Bimbingan Belajar Berorientasi Target & Konsep Dasar
              </Badge>
              <Badge variant="secondary" className="text-xs px-2.5 py-1 font-medium">
                SD • SMP • SMA • UTBK-SNBT
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight text-foreground font-heading leading-tight">
              Kuasai Konsep Dasar, Bentuk Disiplin Belajar,{' '}
              <span className="text-primary underline decoration-primary/30 underline-offset-8">
                Raih PTN & Sekolah Impian
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Bukan sekadar bimbel biasa. <strong>Mentor Belajarku</strong> mendidik siswa melalui pemahaman materi dari akarnya, drill soal bertahap, serta <strong>laporan kehadiran berfoto dan evaluasi riil langsung ke orang tua</strong> setiap sesi.
            </p>

            {/* Micro Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center gap-2.5 text-sm text-foreground font-medium">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span>Pendalaman Konsep (Tanpa Rumus Cepat Semu)</span>
              </div>

              <div className="flex items-center gap-2.5 text-sm text-foreground font-medium">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span>Kuis Harian & Progress Test Terukur</span>
              </div>

              <div className="flex items-center gap-2.5 text-sm text-foreground font-medium">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span>Laporan Foto & Materi Tiap Selesai Les</span>
              </div>

              <div className="flex items-center gap-2.5 text-sm text-foreground font-medium">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span>Jadwal Fleksibel & Bebas Reschedule</span>
              </div>
            </div>

            {/* CTAs & Social Proof Avatar */}
            <div className="flex flex-wrap items-center gap-4 pt-3">
              <Link
                href="#program"
                className={buttonVariants({
                  size: 'lg',
                  className: 'h-11 px-6 text-sm sm:text-base font-semibold shadow-md gap-2',
                })}
              >
                Jelajahi Pilihan Kelas <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#metode"
                className={buttonVariants({
                  variant: 'outline',
                  size: 'lg',
                  className: 'h-11 px-6 text-sm sm:text-base font-semibold',
                })}
              >
                Metode Bimbingan
              </Link>
            </div>

            {/* Trust Rating Bar */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <div className="flex -space-x-2 overflow-hidden">
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  AR
                </div>
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                  NP
                </div>
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center">
                  FP
                </div>
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center">
                  KA
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                  ))}
                  <span className="text-xs font-bold text-foreground ml-1">4.9/5.0</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Dipercaya 500+ orang tua murid & siswa berprestasi
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: GO-Style Fast Lead Capture Form */}
          <div className="lg:col-span-5">
            <LeadCaptureForm />
          </div>
        </div>
      </div>
    </section>
  );
}
