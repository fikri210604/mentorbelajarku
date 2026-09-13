import { Badge } from '@/components/ui/badge';
import {
  SearchCheck,
  BrainCircuit,
  FileCheck2,
  HelpCircle,
  CheckCircle,
  GraduationCap,
} from 'lucide-react';

export function MethodFormula() {
  const steps = [
    {
      number: '01',
      title: 'Tes Diagnostik & Pemetaan Awal',
      tagline: 'Membedah akar kelemahan spesifik',
      description:
        'Sebelum mulai belajar, siswa menjalani asesmen singkat untuk memetakan sub-bab mana yang belum tuntas di sekolah. Pendampingan dimulai dari titik lemah siswa.',
      icon: SearchCheck,
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200',
    },
    {
      number: '02',
      title: 'Pendalaman Konsep Dasar',
      tagline: 'Logika berpikir, bukan sekadar hafalan rumus',
      description:
        'Mengadopsi filosofi belajar intensif: konsep dibedah tuntas dari prinsip dasarnya sehingga siswa mampu menyelesaikan berbagai variasi tipe soal sesulit apapun.',
      icon: BrainCircuit,
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200',
    },
    {
      number: '03',
      title: 'Kuis Harian & Progress Test',
      tagline: 'Evaluasi berkala yang terukur',
      description:
        'Setiap selesai materi, siswa mengerjakan kuis harian untuk melatih ketelitian, kecepatan berpikir, dan kesiapan mental menghadapi ujian sesungguhnya.',
      icon: FileCheck2,
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200',
    },
    {
      number: '04',
      title: 'Klinik PR & Tutorial Tuntas',
      tagline: 'Bebas bertanya tanpa rasa malu',
      description:
        'Ada soal sulit atau tugas sekolah yang menumpuk? Tutor siap membimbing penyelesaiannya langkah demi langkah sampai siswa benar-benar mengerti.',
      icon: HelpCircle,
      badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200',
    },
  ];

  return (
    <section id="metode" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <Badge variant="outline" className="mb-3 px-3 py-1 font-semibold border-primary/30 bg-primary/5 text-primary">
          Metode Pembelajaran Teruji
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
          Formula Belajar Terstruktur Ala Prosus Inten
        </h2>
        <p className="text-muted-foreground mt-3 text-base sm:text-lg leading-relaxed">
          Kami tidak percaya pada keajaiban semalam. Prestasi akademik yang konsisten dibangun melalui disiplin belajar harian, penguasaan konsep dasar yang kokoh, serta bimbingan terarah.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="relative flex flex-col p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group"
            >
              {/* Step Number Watermark */}
              <span className="text-4xl font-black text-muted/60 absolute top-4 right-5 font-mono select-none group-hover:text-primary/20 transition-colors">
                {step.number}
              </span>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 shrink-0">
                <Icon className="h-6 w-6" />
              </div>

              <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                {step.tagline}
              </span>

              <h3 className="text-lg font-bold text-foreground mb-2.5 leading-snug">
                {step.title}
              </h3>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
