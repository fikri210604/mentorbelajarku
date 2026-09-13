'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { CheckCircle2, Clock, Users, BookOpen, Sparkles, ArrowRight } from 'lucide-react';

export function ProgramGrid() {
  const [selectedGrade, setSelectedGrade] = useState<'all' | 'sd' | 'smp' | 'sma'>('all');

  const programs = [
    {
      id: 'reguler',
      name: 'Kelas Reguler',
      duration: '60 Menit / Sesi',
      badge: 'Pendampingan Harian',
      popular: false,
      grades: ['sd', 'smp', 'sma'],
      target: 'Siswa yang ingin menjaga stabilitas nilai sekolah dan memahami materi harian dengan teratur.',
      features: [
        'Durasi efektif 60 menit per pertemuan',
        'Kelompok belajar kecil & kondusif (maks. 5 siswa)',
        'Bimbingan penuntasan PR & tugas harian sekolah',
        'Laporan presensi & bukti foto setiap selesai sesi',
        'Catatan evaluasi materi berkala',
        'Dukungan penjadwalan ulang (reschedule)',
      ],
      ctaText: 'Pilih Kelas Reguler',
    },
    {
      id: 'intensif',
      name: 'Kelas Intensif',
      duration: '75 Menit / Sesi',
      badge: 'Rekomendasi Ujian & SNBT',
      popular: true,
      grades: ['smp', 'sma'],
      target: 'Persiapan matang menghadapi Penilaian Tengah/Akhir Semester (PTS/PAS), Ujian Sekolah, dan UTBK-SNBT.',
      features: [
        'Durasi optimal 75 menit untuk drill soal mendalam',
        'Bedah konsep materi berat & soal HOTS',
        'Simulasi kuis harian & prediksi soal ujian',
        'Analisis strategi pemilihan jurusan & kampus (SMA)',
        'Laporan absensi berfoto real-time ke orang tua',
        'Sesi konsultasi klinik PR ekstra',
      ],
      ctaText: 'Daftar Kelas Intensif',
    },
    {
      id: 'private',
      name: 'Kelas Private 1-on-1',
      duration: '90 Menit / Sesi',
      badge: 'Eksklusif & Personalisasi Penuh',
      popular: false,
      grades: ['sd', 'smp', 'sma'],
      target: 'Siswa yang membutuhkan perhatian khusus 1-on-1, akselerasi materi olimpiade, atau perbaikan konsep mendalam.',
      features: [
        'Fokus total 90 menit (1 Siswa 1 Mentor)',
        'Kurikulum & kecepatan belajar 100% disesuaikan',
        'Bebas request materi sekolah / tugas spesifik',
        'Fleksibilitas jadwal belajar & pemilihan tutor',
        'Laporan perkembangan individual terperinci',
        'Konsultasi langsung antara orang tua dan tutor',
      ],
      ctaText: 'Konsultasi Kelas Private',
    },
  ];

  const filteredPrograms = programs.filter((p) => {
    if (selectedGrade === 'all') return true;
    return p.grades.includes(selectedGrade);
  });

  return (
    <section id="program" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <Badge variant="outline" className="mb-3 px-3 py-1 font-semibold border-primary/30 bg-primary/5 text-primary">
          Format Belajar Terkonfigurasi
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
          Pilihan Program Belajar di Mentor Belajarku
        </h2>
        <p className="text-muted-foreground mt-3 text-base sm:text-lg">
          Tiga format bimbingan dirancang adaptif untuk memenuhi kebutuhan capaian belajar murid, mulai dari pendampingan harian hingga persiapan ujian prestisius.
        </p>

        {/* Grade Filter Pills (Ala GO) */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
          <Button
            variant={selectedGrade === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedGrade('all')}
            className="rounded-full text-xs font-semibold px-4"
          >
            Semua Jenjang
          </Button>
          <Button
            variant={selectedGrade === 'sd' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedGrade('sd')}
            className="rounded-full text-xs font-semibold px-4"
          >
            SD (Kelas 4-6)
          </Button>
          <Button
            variant={selectedGrade === 'smp' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedGrade('smp')}
            className="rounded-full text-xs font-semibold px-4"
          >
            SMP (Kelas 7-9)
          </Button>
          <Button
            variant={selectedGrade === 'sma' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedGrade('sma')}
            className="rounded-full text-xs font-semibold px-4"
          >
            SMA & UTBK (Kelas 10-12)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {filteredPrograms.map((program) => (
          <Card
            key={program.id}
            className={`flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
              program.popular
                ? 'border-2 border-primary shadow-lg ring-1 ring-primary/20 scale-[1.02] bg-card'
                : 'border shadow-sm hover:border-primary/40 bg-card'
            }`}
          >
            {program.popular && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[11px] font-extrabold px-3.5 py-1 rounded-bl-xl shadow-xs flex items-center gap-1 tracking-wider uppercase">
                <Sparkles className="h-3 w-3" /> Paling Populer
              </div>
            )}

            <div>
              <CardHeader className="pb-4 pt-6">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="text-xs font-bold px-2.5 py-0.5 border-primary/30 text-primary bg-primary/5"
                  >
                    {program.badge}
                  </Badge>
                  <div className="flex items-center text-xs font-semibold text-muted-foreground gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    {program.duration}
                  </div>
                </div>

                <CardTitle className="text-2xl font-black text-foreground mt-3 font-heading">
                  {program.name}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed min-h-[44px]">
                  {program.target}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-2 pb-6 space-y-3">
                <div className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Fasilitas & Keunggulan:
                </div>
                {program.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </CardContent>
            </div>

            <CardFooter className="pt-2 pb-6 border-t bg-muted/20">
              <Link
                href="#konsultasi"
                className={buttonVariants({
                  variant: program.popular ? 'default' : 'outline',
                  className: 'w-full font-bold text-xs sm:text-sm h-10 shadow-xs gap-2',
                })}
              >
                {program.ctaText}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
