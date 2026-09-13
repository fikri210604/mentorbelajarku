import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LANDING_ADVANTAGES } from '@/data/landing/advantages';
import {
  GraduationCap,
  Target,
  Camera,
  MapPin,
  Home,
  RefreshCw,
} from 'lucide-react';

const iconMap = {
  GraduationCap,
  Target,
  Camera,
  MapPin,
  Home,
  RefreshCw,
};

export function AdvantagesSection() {
  return (
    <section id="keunggulan" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-border/60 bg-muted/30">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <Badge variant="outline" className="mb-3 px-3.5 py-1 text-xs font-semibold border-primary/20 bg-accent text-primary">
          Nilai Lebih Kami
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
          Keunggulan Mentor Belajarku
        </h2>
        <p className="text-foreground/75 mt-3 text-base sm:text-lg">
          Komitmen kami memberikan pengalaman belajar terbaik dengan profesionalisme, kenyamanan, dan transparansi penuh.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {LANDING_ADVANTAGES.map((item) => {
          const Icon = iconMap[item.iconName] || Target;

          return (
            <Card
              key={item.id}
              className="border border-border/80 bg-card rounded-3xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
            >
              <CardContent className="p-6 sm:p-7 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground font-heading">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
