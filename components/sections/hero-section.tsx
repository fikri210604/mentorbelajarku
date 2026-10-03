import Link from 'next/link';
import Image from 'next/image';
import { buildWaLink } from '@/lib/whatsapp';
import { StatCounter } from './stat-counter';
import { Reveal } from '@/components/shared/reveal';
import { GraduationCap, Users, Award, Play, CheckCheck, Camera, BellRing } from 'lucide-react';

export function HeroSection() {
  const waHeroUrl = buildWaLink('hero');

  return (
    <section className="relative overflow-hidden bg-background pt-2 sm:pt-4 md:pt-6">
      {/* Signature dot pattern lembut di area hero */}
      <div className="absolute inset-0 bg-dot-pattern opacity-50 pointer-events-none [mask-image:radial-gradient(ellipse_75%_65%_at_60%_35%,black,transparent)]" />
      {/* Blob gradasi dekoratif */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      {/* Container Utama Atas: 2 Kolom (Teks Kiri, Visual Gambar Kanan) */}
      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:items-end lg:gap-6">
          {/* Kolom Kiri: Copywriting & Tombol DAFTAR SEKARANG */}
          <div className="z-10 flex flex-col items-start space-y-4 pb-4 text-left sm:space-y-5 sm:pb-6 lg:col-span-7 lg:pb-10">
            {/* Badge jenjang — mempertahankan keyword SEO tanpa membebani headline */}
            <Reveal direction="down" distance={16} duration={600}>
              <div className="flex flex-wrap items-center gap-2">
                {['TK', 'SD', 'SMP', 'SMA', 'OSN', 'UTBK-SNBT'].map((grade) => (
                  <span
                    key={grade}
                    className="rounded-full border border-primary/25 bg-accent px-3 py-1 text-[11px] font-bold text-primary shadow-2xs"
                  >
                    {grade}
                  </span>
                ))}
                <span className="rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-bold text-secondary-foreground">
                  Tatap Muka & Home Visit
                </span>
              </div>
            </Reveal>

            <Reveal delay={120} duration={700}>
              <h1 className="font-heading text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl sm:leading-snug md:text-[42px]">
                Anak Paham Konsep,{' '}
                <span className="relative inline-block text-primary">
                  Orang Tua Pegang Buktinya.
                  <svg
                    className="absolute -bottom-1.5 left-0 w-full"
                    viewBox="0 0 300 12"
                    fill="none"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 9C60 3 180 3 298 8"
                      stroke="#7DBA28"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
            </Reveal>

            <Reveal delay={240} duration={700}>
              <p className="max-w-2xl text-xs leading-relaxed text-foreground/80 sm:text-sm md:text-base">
                Bimbingan belajar dan les privat di <strong>Kemiling, Bandar Lampung</strong> yang
                membantu siswa memahami pelajaran dari dasar, menemukan ritme belajar, dan tumbuh
                lebih percaya diri. Didampingi mentor berpengalaman dengan suasana belajar yang
                sabar, dekat, dan terarah.
              </p>
            </Reveal>

            <Reveal delay={360} duration={700}>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href={waHeroUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex transform items-center justify-center gap-2 rounded-full bg-cta px-9 py-4 text-sm font-black uppercase tracking-wider text-cta-foreground shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-cta/90 hover:shadow-xl sm:text-base"
                >
                  <span>DAFTAR SEKARANG !</span>
                </Link>
                <Link
                  href="#metode"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary/60 px-6 py-[14px] text-xs font-bold text-primary transition-colors hover:bg-accent sm:text-sm"
                >
                  <Camera className="h-4 w-4" />
                  Kenali Metode Kami
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Kolom Kanan: Foto Siswa + Kartu Melayang Interaktif */}
          <div className="relative z-10 flex items-end justify-center pt-0 pb-0 lg:col-span-5">
            <Reveal direction="left" distance={40} duration={900} className="w-full">
              <div className="relative -mb-4 flex w-full max-w-[360px] items-end justify-center sm:-mb-7 sm:max-w-[440px] lg:-mb-8 lg:max-w-[490px] mx-auto">
                {/* Shape Segitiga Rounded di Belakang Foto */}
                <div className="pointer-events-none absolute inset-x-4 top-1/2 z-0 flex h-[68%] -translate-y-1/2 items-center justify-center sm:inset-x-6 sm:h-[72%]">
                  <svg
                    viewBox="0 0 240 210"
                    className="h-full w-full"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M 32 18 C 18 10 10 16 10 32 L 10 178 C 10 194 18 200 32 192 L 218 113 C 232 105 232 95 218 87 Z"
                      fill="url(#hero-triangle-grad)"
                    />
                    <defs>
                      <linearGradient id="hero-triangle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF7A00" />
                        <stop offset="100%" stopColor="#FF5500" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Foto Siswa */}
                <Image
                  src="/siswa.png"
                  alt="Siswa Bimbingan Belajar Mentor Belajarku"
                  width={1080}
                  height={1080}
                  unoptimized
                  priority
                  className="relative z-10 block h-auto w-full object-contain"
                />

                {/* Kartu melayang 1: pengalaman belajar yang personal */}
                <div className="absolute -left-2 top-[16%] z-20 hidden w-56 animate-float-soft rounded-2xl border border-border/70 bg-card/95 p-3 shadow-xl backdrop-blur-sm sm:block">
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md animate-pulse-ring">
                      <Camera className="h-4.5 w-4.5" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-[11px] font-bold text-foreground">
                        Belajar terasa lebih dekat ✓
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Mentor memahami kebutuhan setiap siswa
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-primary">
                        Sesi personal <CheckCheck className="h-3 w-3 text-sky-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kartu melayang 2: progres siswa */}
                <div className="absolute -right-3 bottom-[26%] z-20 hidden w-52 animate-float-soft-delayed rounded-2xl border border-border/70 bg-card/95 p-3 shadow-xl backdrop-blur-sm md:block">
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/20 text-secondary-foreground">
                      <BellRing className="h-4.5 w-4.5 text-secondary" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-[11px] font-bold text-foreground">
                        Progres Kecil, Berarti
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        &quot;Mulai berani bertanya dan mencoba 🎯&quot;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Bagian Bawah: Container Gelombang Stats */}
      <div className="relative z-20 mt-0 w-full">
        <div className="rounded-t-[2.5rem] bg-primary px-4 pt-10 pb-12 text-white shadow-2xl sm:rounded-t-[3.5rem] sm:px-6 sm:pb-14">
          <div className="container mx-auto max-w-5xl">
            {/* 3 Kolom Stats Berjejer Rapi di Tengah */}
            <div className="grid grid-cols-1 items-center justify-center gap-8 text-center sm:grid-cols-3 sm:gap-6">
              {/* Stat 1: Guru / Mentor */}
              <div className="flex flex-col items-center justify-center space-y-2.5">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 text-primary shadow-md sm:h-20 sm:w-20">
                    <GraduationCap className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-cta p-1 text-cta-foreground shadow-xs">
                    <Play className="h-3 w-3 fill-current" />
                  </div>
                </div>
                <StatCounter
                  target={25}
                  suffix="+ Mentor"
                  label="Lulusan PTN Unggulan & Berpengalaman"
                />
              </div>

              {/* Stat 2: Siswa Aktif Terbantu */}
              <div className="flex flex-col items-center justify-center space-y-2.5 border-y border-white/20 px-2 py-4 sm:border-y-0 sm:border-x sm:py-0">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 text-secondary shadow-md sm:h-20 sm:w-20">
                    <Users className="h-8 w-8 text-[#7DBA28] sm:h-10 sm:w-10" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-cta p-1 text-cta-foreground shadow-xs">
                    <Play className="h-3 w-3 fill-current" />
                  </div>
                </div>
                <StatCounter
                  target={350}
                  suffix="+ Siswa"
                  label="SD, SMP, SMA di Bandar Lampung"
                />
              </div>

              {/* Stat 3: Tingkat Kepuasan & Kenaikan Nilai */}
              <div className="flex flex-col items-center justify-center space-y-2.5">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 text-[#FBBF24] shadow-md sm:h-20 sm:w-20">
                    <Award className="h-8 w-8 text-[#F59E0B] sm:h-10 sm:w-10" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-cta p-1 text-cta-foreground shadow-xs">
                    <Play className="h-3 w-3 fill-current" />
                  </div>
                </div>
                <StatCounter
                  target={98}
                  suffix="% Kepuasan"
                  label="Peningkatan Nilai Rapor & Ujian"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
