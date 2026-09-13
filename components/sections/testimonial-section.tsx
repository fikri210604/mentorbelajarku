import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LANDING_TESTIMONIALS } from '@/data/landing/testimonials';
import { Star, Quote } from 'lucide-react';

export function TestimonialSection() {
  return (
    <section id="testimoni" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-border/60 bg-muted/20">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <Badge variant="outline" className="mb-3 px-3.5 py-1 text-xs font-semibold border-primary/20 bg-accent text-primary">
          Kisah Sukses
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
          Apa Kata Orang Tua & Siswa Kami?
        </h2>
        <p className="text-foreground/75 mt-3 text-base sm:text-lg">
          Pengalaman nyata dari para siswa dan wali murid yang telah mempercayakan bimbingan belajarnya bersama Mentor Belajarku di Bandar Lampung.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {LANDING_TESTIMONIALS.map((item) => (
          <Card
            key={item.id}
            className="flex flex-col justify-between border border-border/80 bg-card rounded-3xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
          >
            <CardContent className="p-6 sm:p-7 flex flex-col justify-between h-full space-y-4">
              <div>
                {/* Rating stars */}
                <div className="flex items-center gap-1 text-amber-500 mb-3">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed italic relative">
                  <Quote className="h-5 w-5 text-primary/20 mb-1" />
                  "{item.quote}"
                </p>
              </div>

              {/* Author Details */}
              <div className="pt-4 border-t border-border/60 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent text-primary font-bold text-xs flex items-center justify-center shrink-0">
                  {item.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-foreground truncate">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {item.schoolOrArea}
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
