import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { buildWaLink } from '@/lib/whatsapp';
import { MessageSquare, CalendarCheck, BookOpenCheck, ArrowRight } from 'lucide-react';

export function HowToJoinSection() {
  const waUrl = buildWaLink('cara-daftar');

  const steps = [
    {
      step: '01',
      icon: MessageSquare,
      title: 'Konsultasi Kebutuhan Belajar',
      description:
        'Hubungi kami via WhatsApp. Sampaikan mata pelajaran yang butuh bantuan, kelas anak, dan pilihan belajar di tempat (Kemiling) atau guru datang ke rumah.',
    },
    {
      step: '02',
      icon: CalendarCheck,
      title: 'Penjadwalan & Pemilihan Mentor',
      description:
        'Tim akademik kami mencocokkan jadwal belajar anak dan memilihkan mentor terbaik yang sesuai dengan karakter belajar putra-putri Anda.',
    },
    {
      step: '03',
      icon: BookOpenCheck,
      title: 'Mulai Belajar & Pantau Laporan',
      description:
        'Sesi belajar pertama dimulai! Orang tua menerima bukti foto kehadiran dan catatan evaluasi materi setiap sesi langsung melalui sistem kami.',
    },
  ];

  return (
    <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <Badge variant="outline" className="mb-3 px-3.5 py-1 text-xs font-semibold border-primary/20 bg-accent text-primary">
          Alur Mudah
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
          3 Langkah Mudah Memulai Belajar
        </h2>
        <p className="text-foreground/75 mt-3 text-base sm:text-lg">
          Tanpa proses administrasi yang rumit. Cukup konsultasikan kebutuhan belajar anak dan kami siapkan mentor terbaiknya.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {steps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="relative flex flex-col items-center text-center p-8 rounded-3xl border border-border/80 bg-card shadow-sm hover:shadow-md transition-shadow group"
            >
              <span className="text-5xl font-black text-muted/80 absolute top-4 right-6 font-mono select-none group-hover:text-primary/20 transition-colors">
                {item.step}
              </span>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary mb-6 shadow-2xs">
                <Icon className="h-7 w-7" />
              </div>

              <h3 className="text-lg font-bold text-foreground font-heading mb-3">
                {item.title}
              </h3>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-12">
        <Link
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({
            size: 'lg',
            className: 'bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-3.5 font-bold text-sm sm:text-base shadow-md gap-2',
          })}
        >
          Konsultasi & Mulai Belajar Sekarang <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
