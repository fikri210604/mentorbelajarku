import { HeroSection } from '@/components/sections/hero-section';
import { TrustLogos } from '@/components/sections/trust-logos';
import { WhyNeedMentorSection } from '@/components/sections/why-need-mentor-section';
import { LearningModeSection } from '@/components/sections/learning-mode-section';
import { MidPageCTA } from '@/components/sections/mid-page-cta';
import { ProgramSection } from '@/components/sections/program-section';
import { AdvantagesSection } from '@/components/sections/advantages-section';
import { SubjectsSection } from '@/components/sections/subjects-section';
import { TestimonialSection } from '@/components/sections/testimonial-section';
import { HowToJoinSection } from '@/components/sections/how-to-join-section';
import { GallerySection } from '@/components/sections/gallery-section';
import { FAQSection } from '@/components/sections/faq-section';
import { FinalCTASection } from '@/components/sections/final-cta-section';

export function LandingPageView() {
  return (
    <div className="flex flex-col">
      {/* 2. Hero Section */}
      <HeroSection />

      {/* 3. Trust Logos */}
      <TrustLogos />

      {/* 4. Why Need Mentor Section (Pain points & bridge to solution) */}
      <WhyNeedMentorSection />

      {/* 5. Learning Mode (Tatap Muka Kemiling vs Home Visit) */}
      <LearningModeSection />

      {/* 6. Mid-Page CTA */}
      <MidPageCTA />

      {/* 7. Program Section (Reguler, Intensif, Private) */}
      <ProgramSection />

      {/* 8. Advantages Section (Keunggulan) */}
      <AdvantagesSection />

      {/* 9. Subjects Section (Mata Pelajaran yang Dilayani) */}
      <SubjectsSection />

      {/* 10. Testimonials */}
      <TestimonialSection />

      {/* 11. How to Join (3 Langkah Pendaftaran) */}
      <HowToJoinSection />

      {/* 12. Gallery Section */}
      <GallerySection />

      {/* 13. FAQ Section */}
      <FAQSection />

      {/* 14. Final CTA Section */}
      <FinalCTASection />
    </div>
  );
}
