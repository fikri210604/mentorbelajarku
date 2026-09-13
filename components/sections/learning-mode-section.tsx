import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { buildWaLink } from '@/lib/whatsapp';
import { MapPin, Home, CheckCircle2, ArrowRight } from 'lucide-react';

export function LearningModeSection() {
  const waKemilingUrl = buildWaLink('kemiling');
  const waHomeVisitUrl = buildWaLink('home-visit');

  return (
    <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-border/60 bg-muted/20">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <Badge variant="outline" className="mb-3 px-3.5 py-1 text-xs font-semibold border-primary/20 bg-accent text-primary">
          Pilihan Fleksibel
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
          Dua Mode Pembelajaran yang Nyaman
        </h2>
        <p className="text-foreground/75 mt-3 text-base sm:text-lg">
          Sesuaikan metode bimbingan dengan kenyamanan dan rutinitas putra-putri Anda di Bandar Lampung.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Mode 1: Belajar di Tempat (Kemiling) */}
        <Card className="flex flex-col justify-between border-2 border-border/80 hover:border-primary/50 transition-all rounded-3xl shadow-sm hover:shadow-lg bg-card overflow-hidden">
          <CardHeader className="p-6 sm:p-8 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <MapPin className="h-6 w-6" />
            </div>
            <Badge variant="secondary" className="w-fit mb-2 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/15 border-0">
              Lokasi Kemiling
            </Badge>
            <CardTitle className="text-2xl font-bold text-foreground font-heading">
              Tatap Muka di Tempat
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
              Siswa datang langsung ke ruang bimbingan Mentor Belajarku di Kemiling, Bandar Lampung dengan atmosfer belajar yang tenang dan kondusif.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 sm:px-8 pb-6 space-y-3">
            <div className="text-xs font-bold text-foreground uppercase tracking-wider">
              Keuntungan:
            </div>
            <div className="space-y-2 text-xs sm:text-sm text-foreground/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>Ruang belajar ber-AC, nyaman & bebas distraksi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>Interaksi tutor dan kelompok kecil yang suportif</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>Akses buku referensi & modul latihan lengkap</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6 sm:p-8 pt-0">
            <Link
              href={waKemilingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                className: 'w-full bg-primary hover:bg-primary/90 text-white rounded-full font-semibold text-xs sm:text-sm h-11 gap-2 shadow-xs',
              })}
            >
              Tanya Lokasi & Jadwal Kemiling <ArrowRight className="h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>

        {/* Mode 2: Home Visit (Guru Datang ke Rumah) */}
        <Card className="flex flex-col justify-between border-2 border-border/80 hover:border-primary/50 transition-all rounded-3xl shadow-sm hover:shadow-lg bg-card overflow-hidden">
          <CardHeader className="p-6 sm:p-8 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/15 text-secondary mb-4">
              <Home className="h-6 w-6" />
            </div>
            <Badge variant="secondary" className="w-fit mb-2 text-xs font-semibold bg-secondary/15 text-secondary-foreground hover:bg-secondary/20 border-0">
              Home Visit
            </Badge>
            <CardTitle className="text-2xl font-bold text-foreground font-heading">
              Guru Datang ke Rumah
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
              Mentor profesional kami hadir langsung ke rumah Anda di area Kemiling dan seluruh penjuru Bandar Lampung. Praktis tanpa perlu repot antar-jemput.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 sm:px-8 pb-6 space-y-3">
            <div className="text-xs font-bold text-foreground uppercase tracking-wider">
              Keuntungan:
            </div>
            <div className="space-y-2 text-xs sm:text-sm text-foreground/80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />
                <span>Hemat waktu & energi anak (tidak terkena macet)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />
                <span>Orang tua dapat memantau langsung proses belajar</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />
                <span>Waktu dan jadwal belajar sangat fleksibel</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6 sm:p-8 pt-0">
            <Link
              href={waHomeVisitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: 'outline',
                className: 'w-full border-2 border-primary text-primary hover:bg-primary/5 rounded-full font-semibold text-xs sm:text-sm h-11 gap-2',
              })}
            >
              Pesan Guru ke Rumah <ArrowRight className="h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
