import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Clock } from 'lucide-react';
import { WHATSAPP_PHONE_NUMBER } from '@/lib/whatsapp';

export function Footer() {
  return (
    <footer className="bg-foreground text-white/90 pt-16 pb-12 border-t border-white/10">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white p-1.5 flex items-center justify-center overflow-hidden shrink-0">
                <Image
                  src="/logo.jpg"
                  alt="Mentor Belajarku"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <span className="font-extrabold text-xl text-white font-heading">
                Mentor Belajarku
              </span>
            </div>

            <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
              Lembaga bimbingan belajar dan les privat terpercaya di Kemiling, Bandar Lampung. Menanamkan konsep dasar yang kokoh, disiplin belajar terarah, dan laporan presensi berfoto setiap sesi.
            </p>
          </div>

          {/* Column 2: Program Bimbingan */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Program Belajar
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li>
                <Link href="#program" className="hover:text-secondary transition-colors">
                  Kelas Reguler (60 Menit)
                </Link>
              </li>
              <li>
                <Link href="#program" className="hover:text-secondary transition-colors">
                  Kelas Intensif (75 Menit)
                </Link>
              </li>
              <li>
                <Link href="#program" className="hover:text-secondary transition-colors">
                  Kelas Private 1-on-1 (90 Menit)
                </Link>
              </li>
              <li>
                <Link href="#program" className="hover:text-secondary transition-colors">
                  Persiapan UTBK-SNBT
                </Link>
              </li>
              <li>
                <Link href="#program" className="hover:text-secondary transition-colors">
                  Pendampingan Home Visit
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Navigasi Cepat */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Navigasi
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li>
                <Link href="#tentang" className="hover:text-secondary transition-colors">
                  Kebutuhan Belajar Anak
                </Link>
              </li>
              <li>
                <Link href="#keunggulan" className="hover:text-secondary transition-colors">
                  Keunggulan Mentor Belajarku
                </Link>
              </li>
              <li>
                <Link href="#testimoni" className="hover:text-secondary transition-colors">
                  Kisah Sukses Siswa
                </Link>
              </li>
              <li>
                <Link href="#gallery" className="hover:text-secondary transition-colors">
                  Galeri Pembelajaran
                </Link>
              </li>
              <li>
                <Link href="#faq" className="hover:text-secondary transition-colors">
                  Tanya Jawab (FAQ)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Kontak & Informasi */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Hubungi Kami
            </h4>
            <div className="space-y-2.5 text-xs text-white/70">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                <span>Kemiling, Bandar Lampung, Lampung, Indonesia</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-secondary shrink-0" />
                <span>+{WHATSAPP_PHONE_NUMBER}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-secondary shrink-0" />
                <span>Senin - Sabtu: 08.00 - 20.00 WIB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-white/60">
          <p>&copy; {new Date().getFullYear()} Mentor Belajarku. Hak Cipta Dilindungi.</p>
          <p className="text-[11px]">
            Bimbel & Les Privat Kemiling, Bandar Lampung.
          </p>
        </div>
      </div>
    </footer>
  );
}
