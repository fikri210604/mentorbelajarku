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
    <section className="border-y border-border/60 bg-muted/40 py-6">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Dipercaya oleh Siswa & Orang Tua dari Berbagai Sekolah Unggulan di Bandar Lampung
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
          {schools.map((school, idx) => (
            <div
              key={idx}
              className="rounded-full border border-border/80 bg-background px-4 py-1.5 text-xs font-medium text-foreground/80 shadow-2xs hover:border-primary/40 hover:text-primary transition-colors"
            >
              {school}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
