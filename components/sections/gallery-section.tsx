import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LANDING_GALLERY } from '@/data/landing/gallery';
import { Camera, Sparkles } from 'lucide-react';

export function GallerySection() {
  return (
    <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-border/60 bg-muted/20">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <Badge variant="outline" className="mb-3 px-3.5 py-1 text-xs font-semibold border-primary/20 bg-accent text-primary">
          Aktivitas Belajar
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
          Suasana Belajar di Mentor Belajarku
        </h2>
        <p className="text-foreground/75 mt-3 text-base sm:text-lg">
          Dokumentasi riil proses pendampingan siswa di Kemiling dan kegiatan Home Visit di berbagai wilayah Bandar Lampung.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {LANDING_GALLERY.map((item) => (
          <Card key={item.id} className="overflow-hidden border border-border/80 bg-card rounded-3xl shadow-sm hover:shadow-md transition-shadow group">
            {/* Visual Photo Card / Placeholder with Gradient & Icon */}
            <div className={`relative h-48 w-full bg-gradient-to-br ${item.imagePlaceholderColor} flex flex-col items-center justify-center text-center p-4 overflow-hidden`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 dark:bg-black/50 text-primary backdrop-blur-xs mb-2 shadow-xs group-hover:scale-110 transition-transform">
                <Camera className="h-6 w-6" />
              </div>
              <Badge variant="secondary" className="text-[10px] font-bold bg-white/90 text-foreground shadow-2xs">
                {item.category}
              </Badge>
            </div>

            <CardContent className="p-5 space-y-1.5">
              <h3 className="text-sm font-bold text-foreground font-heading leading-snug">
                {item.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
