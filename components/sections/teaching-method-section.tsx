import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { buildWaLink } from "@/lib/whatsapp";
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  Compass,
  Lightbulb,
  MessageCircle,
  Target,
} from "lucide-react";

const learningSteps = [
  {
    number: "01",
    icon: Compass,
    title: "Kenali cara belajarnya",
    description:
      "Kami memahami titik mulai, kebiasaan, dan target setiap siswa sebelum menentukan ritme belajar.",
  },
  {
    number: "02",
    icon: BrainCircuit,
    title: "Bangun konsep dari dasar",
    description:
      "Materi dijelaskan dengan bahasa yang dekat dengan siswa agar mereka benar-benar paham, bukan sekadar menghafal.",
  },
  {
    number: "03",
    icon: Target,
    title: "Latih sampai percaya diri",
    description:
      "Pemahaman dilatih lewat soal bertahap, diskusi, dan evaluasi yang membuat siswa siap menghadapi tantangan berikutnya.",
  },
];

export function TeachingMethodSection() {
  const waUrl = buildWaLink("metode-belajar");

  return (
    <section
      id="metode"
      className="relative overflow-hidden border-t border-border/60 bg-[#f4fbf7] py-16 md:py-24"
    >
      <div className="absolute -right-24 top-12 h-72 w-72 rounded-full bg-secondary/15 blur-3xl" />
      <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <Reveal direction="right" distance={32}>
              <Badge
                variant="outline"
                className="mb-4 gap-1.5 border-primary/20 bg-accent px-3.5 py-1 text-xs font-semibold text-primary"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                Cara Kami Mendampingi
              </Badge>
              <h2 className="font-heading text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
                Belajar bukan tentang siapa yang paling cepat.
                <span className="mt-1 block text-primary">
                  Tapi siapa yang terus bertumbuh.
                </span>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-foreground/75 sm:text-lg">
                Mentor Belajarku hadir sebagai teman tumbuh bagi siswa. Kami
                membantu mereka menemukan cara belajar yang cocok, memahami
                pelajaran dengan utuh, dan berani mencoba lagi saat menemui
                kesulitan.
              </p>
              <Link
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  size: "lg",
                  className:
                    "mt-7 h-11 gap-2 rounded-full bg-cta px-7 text-sm font-bold text-cta-foreground shadow-md hover:bg-cta/90",
                })}
              >
                Konsultasikan Kebutuhan Anak{" "}
                <MessageCircle className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>

          <div className="relative lg:col-span-7">
            <div className="absolute left-8 right-8 top-12 hidden h-px bg-primary/20 md:block" />
            <div className="grid gap-4 md:grid-cols-3">
              {learningSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Reveal key={step.number} delay={index * 120} direction="up">
                    <article className="relative h-full rounded-3xl border border-primary/15 bg-white p-5 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
                      <div className="relative z-10 mb-6 flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="font-mono text-3xl font-black text-primary/15">
                          {step.number}
                        </span>
                      </div>
                      <h3 className="font-heading text-base font-bold text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </article>
                  </Reveal>
                );
              })}
            </div>
            <Reveal delay={420} direction="up">
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-secondary/25 bg-secondary/10 p-4 text-sm text-foreground/80">
                <BookOpenCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p>
                  <strong className="text-foreground">
                    Hasil yang kami cari:
                  </strong>{" "}
                  siswa tidak hanya mendapat nilai lebih baik, tetapi juga tahu
                  bagaimana cara belajar yang efektif untuk dirinya.
                </p>
                <ArrowRight className="mt-0.5 hidden h-4 w-4 shrink-0 text-primary sm:block" />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
