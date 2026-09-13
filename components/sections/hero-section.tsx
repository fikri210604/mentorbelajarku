import Link from 'next/link';
import Image from 'next/image';
import { buildWaLink } from '@/lib/whatsapp';
import { StatCounter } from './stat-counter';
import { GraduationCap, Users, Award, Play } from 'lucide-react';

export function HeroSection() {
  const waHeroUrl = buildWaLink('hero');

  return (
    <section className="relative overflow-hidden pt-2 sm:pt-4 md:pt-6 bg-background">
      {/* Container Utama Atas: 2 Kolom (Teks Kiri, Visual Gambar Kanan) */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center lg:items-end">
          {/* Kolom Kiri: Copywriting & Tombol DAFTAR SEKARANG */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-4 sm:space-y-5 z-10 pb-4 sm:pb-6 lg:pb-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-black text-foreground font-heading leading-tight sm:leading-snug tracking-tight">
              Les Privat di Bandar Lampung | TK, SD, SMP, SMA, OSN, UTBK, SNBT | Tatap Muka & Guru Datang ke Rumah
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-foreground/80 leading-relaxed max-w-2xl">
              Bimbingan belajar dan les privat untuk TK, SD, SMP, SMA, OSN, hingga persiapan UTBK SNBT di Bandar Lampung. Kualitas pengajar terjamin dan berpengalaman di bidangnya. Pendalaman konsep dari dasar, laporan presensi berfoto setiap sesi, dan kamu juga bisa atur kebutuhan serta jadwal belajarmu.
            </p>

            <div className="pt-1">
              <Link
                href={waHeroUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-[#FF6B00] hover:bg-[#E55F00] text-white font-black text-sm sm:text-base px-9 py-4 shadow-lg hover:shadow-xl transition-all duration-200 tracking-wider uppercase gap-2 transform hover:-translate-y-0.5"
              >
                <span>DAFTAR SEKARANG !</span>
              </Link>
            </div>
          </div>

          {/* Kolom Kanan: Foto Siswa yang Masuk ke Belakang Stats (Dinaikkan Sedikit) */}
          <div className="lg:col-span-5 relative flex items-end justify-center pt-0 pb-0 z-10">
            <div className="relative w-full max-w-[360px] sm:max-w-[440px] lg:max-w-[490px] flex items-end justify-center -mb-4 sm:-mb-7 lg:-mb-8">
              {/* Shape Segitiga Rounded di Belakang Foto */}
              <div className="absolute inset-x-4 sm:inset-x-6 top-1/2 -translate-y-1/2 h-[68%] sm:h-[72%] flex items-center justify-center pointer-events-none z-0">
                <svg
                  viewBox="0 0 240 210"
                  className="w-full h-full"
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

              {/* Foto Siswa (unoptimized agar menggunakan file PNG asli 1080x1080 tanpa pecah/buram karena kompresi Next.js) */}
              <Image
                src="/siswa.png"
                alt="Siswa Bimbingan Belajar Mentor Belajarku"
                width={1080}
                height={1080}
                unoptimized
                priority
                className="relative z-10 w-full h-auto object-contain block"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bagian Bawah: Container Gelombang Warna Solid di Depan Ujung Bawah Foto (z-20) */}
      <div className="w-full relative z-20 mt-0">
        <div className="bg-primary text-white rounded-t-[2.5rem] sm:rounded-t-[3.5rem] shadow-2xl pt-10 pb-12 sm:pb-14 px-4 sm:px-6">
          <div className="container mx-auto max-w-5xl">
            {/* 3 Kolom Stats Berjejer Rapi di Tengah */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 items-center justify-center text-center">
              {/* Stat 1: Guru / Mentor */}
              <div className="flex flex-col items-center justify-center space-y-2.5">
                <div className="relative">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white text-primary p-1 shadow-md flex items-center justify-center overflow-hidden">
                    <GraduationCap className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-[#FF6B00] text-white p-1 rounded-full shadow-xs">
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
              <div className="flex flex-col items-center justify-center space-y-2.5 border-y sm:border-y-0 sm:border-x border-white/20 py-4 sm:py-0 px-2">
                <div className="relative">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white text-secondary p-1 shadow-md flex items-center justify-center overflow-hidden">
                    <Users className="h-8 w-8 sm:h-10 sm:w-10 text-[#7DBA28]" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-[#FF6B00] text-white p-1 rounded-full shadow-xs">
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
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white text-[#FBBF24] p-1 shadow-md flex items-center justify-center overflow-hidden">
                    <Award className="h-8 w-8 sm:h-10 sm:w-10 text-[#F59E0B]" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-[#FF6B00] text-white p-1 rounded-full shadow-xs">
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
