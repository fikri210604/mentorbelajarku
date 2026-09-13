import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

export function AnnouncementBar() {
  return (
    <div className="relative isolate flex items-center justify-center gap-x-3 overflow-hidden bg-primary px-4 py-2.5 text-primary-foreground text-xs sm:text-sm font-medium">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
          <Sparkles className="h-3 w-3" /> Gelombang Baru
        </span>
        <span className="truncate">
          Penerimaan Siswa Baru: Klaim <strong>Tes Diagnostik & Konsultasi Belajar Gratis</strong> Sekarang!
        </span>
      </div>
      <Link
        href="#konsultasi"
        className="hidden md:inline-flex items-center gap-1 font-semibold underline underline-offset-4 hover:opacity-90 transition-opacity"
      >
        Daftar Sekarang <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
