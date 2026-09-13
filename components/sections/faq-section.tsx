'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { LANDING_FAQS } from '@/data/landing/faq';
import { buildWaLink } from '@/lib/whatsapp';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';

export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const waFaqUrl = buildWaLink('faq');

  return (
    <section id="faq" className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-border/60">
      <div className="text-center mb-14">
        <Badge variant="outline" className="mb-3 px-3.5 py-1 text-xs font-semibold border-primary/20 bg-accent text-primary gap-1.5">
          <HelpCircle className="h-3.5 w-3.5" />
          Pertanyaan Umum
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
          Frequently Asked Questions (FAQ)
        </h2>
        <p className="text-foreground/75 mt-3 text-base sm:text-lg">
          Jawaban atas pertanyaan yang paling sering ditanyakan oleh orang tua murid di Kemiling & Bandar Lampung.
        </p>
      </div>

      <div className="space-y-3.5">
        {LANDING_FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-card ${
                isOpen ? 'border-primary/50 shadow-sm' : 'border-border/80 hover:border-border'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-5 sm:p-6 text-left font-bold text-sm sm:text-base text-foreground gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-expanded={isOpen}
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-primary' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-foreground/80 leading-relaxed border-t border-border/40 bg-accent/20">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Extra Question Help */}
      <div className="mt-10 text-center p-6 rounded-2xl bg-muted/40 border border-border/60">
        <p className="text-xs sm:text-sm text-foreground/80 font-medium mb-3">
          Punya pertanyaan lain yang belum terjawab di sini?
        </p>
        <Link
          href={waFaqUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-primary hover:underline"
        >
          <MessageCircle className="h-4 w-4" />
          Tanya Langsung ke Admin via WhatsApp →
        </Link>
      </div>
    </section>
  );
}
