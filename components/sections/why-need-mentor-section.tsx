import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, HelpCircle, Frown, Clock, CheckCircle } from 'lucide-react';

export function WhyNeedMentorSection() {
  const painPoints = [
    {
      icon: Frown,
      title: 'Anak Kesulitan Memahami Pelajaran di Sekolah',
      description:
        'Guru di sekolah harus mengajar puluhan murid sekaligus, sehingga tidak semua anak mendapat perhatian cukup saat belum mengerti materi dasar.',
    },
    {
      icon: Clock,
      title: 'PR & Tugas Menumpuk, Bingung Tanya Siapa',
      description:
        'Waktu malam tersita berjam-jam untuk tugas sekolah tanpa pemahaman yang tuntas, berujung pada rasa frustrasi dan menurunnya motivasi belajar.',
    },
    {
      icon: HelpCircle,
      title: 'Orang Tua Sibuk & Kurikulum Sudah Berbeda',
      description:
        'Orang tua ingin membantu belajar anak di rumah, namun terbatas waktu luang dan materi kurikulum sekolah saat ini sudah jauh lebih kompleks.',
    },
    {
      icon: AlertCircle,
      title: 'Nilai Turun & Cemas Menghadapi Ujian / SNBT',
      description:
        'Ujian semester atau seleksi masuk sekolah/kampus impian semakin dekat, sementara penguasaan konsep materi belum siap.',
    },
  ];

  return (
    <section id="tentang" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <Badge variant="outline" className="mb-3 px-3.5 py-1 text-xs font-semibold border-primary/20 bg-accent text-primary">
          Kenali Kebutuhan Belajar Anak
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
          Kapan Anak Anda Membutuhkan Mentor Pendamping Belajar?
        </h2>
        <p className="text-foreground/75 mt-3 text-base sm:text-lg leading-relaxed">
          Belajar mandiri tidak selalu mudah. Jika tanda-tanda ini dialami putra-putri Anda, pendampingan belajar yang intensif dan sabar adalah solusi terbaik.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {painPoints.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx} className="border border-border/80 bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-foreground font-heading">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bridge to Solution */}
      <div className="mt-10 rounded-2xl border border-primary/30 bg-accent/40 p-6 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 text-primary font-bold text-sm mb-1.5">
          <CheckCircle className="h-4 w-4 text-secondary" />
          <span>Solusi Bersama Mentor Belajarku</span>
        </div>
        <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed">
          Kami hadir di Kemiling untuk mendampingi anak Anda secara sabar, membedah konsep dari akar, dan membangun kembali rasa percaya diri mereka dalam menghadapi pelajaran sekolah.
        </p>
      </div>
    </section>
  );
}
