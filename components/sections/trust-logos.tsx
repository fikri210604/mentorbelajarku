import { Marquee } from '@/components/shared/marquee';
import { GraduationCap } from 'lucide-react';

export function TrustLogos() {
  // TODO_CONTENT: sesuaikan dengan data riil sekolah asal siswa Mentor Belajarku di Bandar Lampung
  const schools = [
    'SMAN 1 Bandar Lampung',
    'SMAN 2 Bandar Lampung',
    'SMAN 9 Bandar Lampung',
    'SMPN 1 Bandar Lampung',
    'SMPN 2 Bandar Lampung',
    'SD & SMP Al-Kautsar Lampung',
    'SMP Labschool Kemiling',
  ];

  return (
    <section className="border-y border-border/60 bg-muted/40 py-7">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Dipercaya oleh Siswa & Orang Tua dari Berbagai Sekolah Unggulan di Bandar Lampung
        </p>

        <Marquee speed={28} className="py-1">
          {schools.map((school, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-full border border-border/80 bg-background px-5 py-2 text-xs font-medium text-foreground/80 shadow-2xs transition-colors hover:border-primary/40 hover:text-primary"
            >
              <GraduationCap className="h-3.5 w-3.5 text-primary/70" />
              {school}
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
