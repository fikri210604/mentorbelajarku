import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { buildWaLink } from '@/lib/whatsapp';
import { MessageCircle, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export function FinalCTASection() {
  const waUrl = buildWaLink('final-cta');

  return (
    <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-accent/70 via-background to-accent/40 p-8 md:p-16 text-center shadow-xl">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary border border-primary/20">
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            <span>Mulai Langkah Menuju Prestasi Hebat</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground font-heading leading-tight">
            Berikan Pendampingan Belajar Terbaik untuk Anak Anda Hari Ini
          </h2>

          <p className="text-base sm:text-lg text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Jangan tunggu hingga nilai rapor menurun atau ujian semakin dekat. Konsultasikan jadwal dan kebutuhan belajar siswa bersama tim akademik Mentor Belajarku di Kemiling, Bandar Lampung.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                size: 'lg',
                className: 'bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-4 text-sm sm:text-base font-bold shadow-lg gap-2.5',
              })}
            >
              <MessageCircle className="h-5 w-5" />
              Konsultasi WhatsApp Sekarang
            </Link>

            <Link
              href="#program"
              className={buttonVariants({
                variant: 'outline',
                size: 'lg',
                className: 'border-2 border-primary text-primary hover:bg-primary/5 rounded-full px-8 py-4 text-sm sm:text-base font-bold',
              })}
            >
              Pilihan Kelas & Paket
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Konsultasi 100% Gratis</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Tatap Muka & Home Visit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Garansi Reschedule Ramah</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
