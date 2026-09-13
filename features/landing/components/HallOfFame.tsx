import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Award, GraduationCap, Trophy, Star, CheckCircle } from 'lucide-react';

export function HallOfFame() {
  const champions = [
    {
      name: 'Ahmad Rayhan Al-Fatih',
      school: 'SMAN 8 Jakarta',
      achievement: 'Lolos Pendidikan Dokter (FK)',
      institution: 'Universitas Indonesia (UI) - SNBT',
      quote:
        'Pendalaman konsep di Mentor Belajarku beda banget. Tutornya nggak cuma kasih kunci jawaban, tapi ngajarin logika berpikir penalaran analitis sampai tuntas.',
      score: 'Skor UTBK: 738.5',
    },
    {
      name: 'Nabila Zahra Putri',
      school: 'SMPN 1 Surabaya',
      achievement: 'Diterima Jalur Prestasi',
      institution: 'SMA Taruna Nusantara Magelang',
      quote:
        'Kuis harian dan pembahasannya ngebantu banget ningkatin disiplin belajar aku. Yang paling berkesan, klinik PR-nya selalu siap bantu soal-soal olimpiade.',
      score: 'Juara 1 Paralel Kelas 9',
    },
    {
      name: 'Farhan Maulana Pratama',
      school: 'SMAN 3 Bandung',
      achievement: 'Lolos Sekolah Teknik Elektro & Informatika',
      institution: 'Institut Teknologi Bandung (STEI ITB)',
      quote:
        'Fisika dan Matematika yang tadinya jadi momok menakutkan berubah jadi mapel penyumbang nilai tertinggi. Mentornya sabar dan cara ngajarnya asik banget!',
      score: 'Nilai TKA Matematika: 94.0',
    },
    {
      name: 'Kezia Amanda Sihombing',
      school: 'SMP Labschool Jakarta',
      achievement: 'Peningkatan Nilai Rapor Drastis',
      institution: 'Kenaikan Rata-rata dari 71 ke 92',
      quote:
        'Mama selalu senang karena setiap selesai les langsung ada laporan foto dan evaluasi materi. Jadi belajarnya terpantau dan nggak bikin was-was.',
      score: 'Top 3 Besar Sekolah',
    },
  ];

  return (
    <section id="prestasi" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <Badge variant="outline" className="mb-3 px-3 py-1 font-semibold border-primary/30 bg-primary/5 text-primary gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          Hall of Fame & Jejak Prestasi
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
          Bukti Nyata Lulusan & Prestasi Siswa Kami
        </h2>
        <p className="text-muted-foreground mt-3 text-base sm:text-lg">
          Hasil tidak pernah mengkhianati proses yang disiplin. Inilah sebagian dari ratusan cerita sukses siswa Mentor Belajarku menembus sekolah dan perguruan tinggi impian.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {champions.map((champ, idx) => (
          <Card
            key={idx}
            className="flex flex-col justify-between border shadow-sm hover:shadow-md transition-all hover:-translate-y-1 bg-card"
          >
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary">
                    {champ.score}
                  </Badge>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-amber-400" />
                    ))}
                  </div>
                </div>

                {/* Achievement Highlight */}
                <div className="mb-4">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    {champ.achievement}
                  </span>
                  <h4 className="text-base font-extrabold text-foreground font-heading mt-0.5 leading-snug">
                    {champ.institution}
                  </h4>
                </div>

                {/* Quote */}
                <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-3 my-4">
                  "{champ.quote}"
                </p>
              </div>

              {/* Student Details */}
              <div className="pt-4 border-t mt-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                  {champ.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <h5 className="text-xs font-bold text-foreground truncate">
                    {champ.name}
                  </h5>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {champ.school}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
