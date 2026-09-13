import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { LANDING_PROGRAMS } from '@/data/landing/programs';
import { buildWaLink } from '@/lib/whatsapp';
import { Clock, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

export function ProgramSection() {
  return (
    <section id="program" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <Badge variant="outline" className="mb-3 px-3.5 py-1 text-xs font-semibold border-primary/20 bg-accent text-primary">
          Format Bimbingan
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
          Pilihan Program Belajar di Mentor Belajarku
        </h2>
        <p className="text-foreground/75 mt-3 text-base sm:text-lg">
          Diselaraskan dengan sistem bimbingan belajar kami. Tiga format fleksibel dengan durasi terukur untuk hasil belajar optimal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {LANDING_PROGRAMS.map((program) => {
          const waUrl = buildWaLink(program.id);

          return (
            <Card
              key={program.id}
              className={`flex flex-col justify-between relative overflow-hidden transition-all duration-300 rounded-3xl ${
                program.isPopular
                  ? 'border-2 border-primary shadow-lg ring-2 ring-primary/20 scale-[1.02] bg-card'
                  : 'border border-border/80 shadow-sm hover:border-primary/40 bg-card'
              }`}
            >
              {program.isPopular && (
                <div className="absolute top-0 right-0 bg-secondary text-white text-[11px] font-extrabold px-3.5 py-1 rounded-bl-xl shadow-xs flex items-center gap-1 uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" /> Rekomendasi
                </div>
              )}

              <div>
                <CardHeader className="p-6 sm:p-7 pb-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-primary/30 text-primary bg-accent/60 text-xs font-bold">
                      {program.badge}
                    </Badge>
                    <div className="flex items-center text-xs font-bold text-muted-foreground gap-1">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span>{program.durationLabel}</span>
                    </div>
                  </div>

                  <CardTitle className="text-2xl font-black text-foreground font-heading mt-4">
                    {program.name}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed min-h-[44px]">
                    {program.description}
                  </CardDescription>

                  {/* Target Grades Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-3">
                    {program.grades.map((grade, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground/75"
                      >
                        {grade}
                      </span>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="px-6 sm:px-7 pb-6 space-y-3">
                  <div className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Fasilitas & Keunggulan:
                  </div>
                  <div className="space-y-2 text-xs sm:text-sm text-foreground/85">
                    {program.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </div>

              <CardFooter className="p-6 sm:p-7 pt-2 border-t border-border/60 bg-muted/20">
                <Link
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({
                    variant: program.isPopular ? 'default' : 'outline',
                    className: `w-full rounded-full font-bold text-xs sm:text-sm h-11 shadow-xs gap-2 ${
                      program.isPopular
                        ? 'bg-primary hover:bg-primary/90 text-white'
                        : 'border-2 border-primary text-primary hover:bg-primary/5'
                    }`,
                  })}
                >
                  <span>Daftar {program.name} via WA</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
