import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { buildWaLink } from '@/lib/whatsapp';
import { Sparkles, MessageCircle } from 'lucide-react';

export function MidPageCTA() {
  const waUrl = buildWaLink('mid-page');

  return (
    <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-emerald-600 to-secondary p-8 sm:p-12 text-center text-white shadow-xl">
        {/* Glow circle overlay */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-black/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Pendampingan Belajar Terbaik di Bandar Lampung</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading tracking-tight leading-tight">
            Ingin Nilai Anak Meningkat dan Percaya Diri di Sekolah?
          </h2>

          <p className="text-white/90 text-sm sm:text-base leading-relaxed">
            Konsultasikan kebutuhan belajar putra-putri Anda sekarang dengan tim akademik kami. Gratis tanpa biaya pendaftaran awal!
          </p>

          <div className="pt-2">
            <Link
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                size: 'lg',
                className: 'bg-white hover:bg-white/90 text-primary rounded-full px-8 py-4 font-bold text-sm sm:text-base shadow-lg gap-2',
              })}
            >
              <MessageCircle className="h-5 w-5 text-primary" />
              Hubungi Kami via WhatsApp
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
