import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { MessageCircle, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export function CtaBanner() {
  return (
    <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 md:p-14 text-center shadow-xl">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary border border-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            Ambil Langkah Pertama Menuju Prestasi Juara
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground font-heading leading-tight">
            Saatnya Memberikan Pendampingan Terbaik untuk Masa Depan Anak Anda
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Jangan tunggu hingga nilai menurun atau ujian semakin dekat. Konsultasikan kendala belajar putra-putri Anda sekarang dan dapatkan pemetaan materi gratis.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="https://wa.me/6281234567890?text=Halo%20Admin%20Mentor%20Belajarku,%20saya%20ingin%20konsultasi%20belajar%20dan%20tes%20diagnostik%20gratis"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                size: 'lg',
                className: 'h-12 px-8 text-sm sm:text-base font-bold shadow-lg gap-2.5',
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
                className: 'h-12 px-8 text-sm sm:text-base font-bold',
              })}
            >
              Lihat Biaya & Paket Belajar
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Konsultasi 100% Bebas Biaya</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Jadwal & Tutor Fleksibel</span>
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
