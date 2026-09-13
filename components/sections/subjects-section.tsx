import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LANDING_SUBJECTS } from '@/data/landing/subjects';
import { BookOpen, Check } from 'lucide-react';

export function SubjectsSection() {
  return (
    <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <Badge variant="outline" className="mb-3 px-3.5 py-1 text-xs font-semibold border-primary/20 bg-accent text-primary">
          Cakupan Kurikulum
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
          Mata Pelajaran yang Dilayani
        </h2>
        <p className="text-foreground/75 mt-3 text-base sm:text-lg">
          Diselaraskan dengan Kurikulum Merdeka dan Kurikulum Nasional untuk semua jenjang pendidikan di sekolah.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {LANDING_SUBJECTS.map((group, idx) => (
          <Card key={idx} className="border border-border/80 bg-card rounded-3xl shadow-sm hover:border-primary/40 transition-colors">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <BookOpen className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground font-heading">
                  {group.level}
                </h3>
              </div>

              <ul className="space-y-2">
                {group.subjects.map((sub, sIdx) => (
                  <li key={sIdx} className="flex items-center gap-2 text-xs text-foreground/80 font-medium">
                    <Check className="h-3.5 w-3.5 text-secondary shrink-0" />
                    <span>{sub}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
