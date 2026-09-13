import { Users, TrendingUp, Camera, RefreshCw } from 'lucide-react';

export function TrustMetrics() {
  const metrics = [
    {
      icon: TrendingUp,
      value: '96.4%',
      label: 'Kenaikan Nilai & Capaian',
      description: 'Siswa mengalami peningkatan nilai rapor dan kesiapan ujian',
    },
    {
      icon: Users,
      value: '1 : 1 s/d 1 : 5',
      label: 'Rasio Kelas Kondusif',
      description: 'Perhatian tutor fokus penuh pada pemahaman setiap siswa',
    },
    {
      icon: Camera,
      value: '100%',
      label: 'Laporan Foto Terverifikasi',
      description: 'Absensi berfoto & catatan capaian materi langsung per sesi',
    },
    {
      icon: RefreshCw,
      value: 'Bebas Hangus',
      label: 'Kebijakan Reschedule Ramah',
      description: 'Sesi izin sakit/urusan sekolah tidak hilang dan dijadwal ulang',
    },
  ];

  return (
    <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 rounded-2xl border bg-card/95 backdrop-blur-md shadow-lg">
        {metrics.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-start gap-4 p-2 sm:p-3 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-extrabold text-foreground font-heading">
                  {item.value}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-foreground mt-0.5">
                  {item.label}
                </span>
                <span className="text-xs text-muted-foreground mt-1 leading-snug">
                  {item.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
