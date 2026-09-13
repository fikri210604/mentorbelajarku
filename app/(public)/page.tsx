import { Metadata } from 'next';
import { LandingPageView } from '@/features/landing/components/LandingPageView';

export const metadata: Metadata = {
  title: 'Mentor Belajarku - Bimbingan Belajar & Les Privat di Kemiling, Bandar Lampung',
  description:
    'Lembaga bimbingan belajar dan les privat terpercaya di Kemiling, Bandar Lampung. Dari pondasi kuat menuju prestasi hebat dengan pendampingan intensif, guru berpengalaman, dan laporan presensi berfoto.',
  keywords: [
    'bimbel kemiling',
    'les privat bandar lampung',
    'bimbel bandar lampung',
    'guru datang ke rumah lampung',
    'les privat sd smp sma lampung',
    'persiapan utbk snbt lampung',
    'mentor belajarku',
  ],
  openGraph: {
    title: 'Mentor Belajarku - Bimbel & Les Privat Kemiling, Bandar Lampung',
    description:
      'Dari Pondasi Kuat Menuju Prestasi Hebat. Bimbingan belajar di tempat & home visit di Bandar Lampung.',
    url: 'https://mentorbelajarku.com',
    siteName: 'Mentor Belajarku',
    locale: 'id_ID',
    type: 'website',
  },
};

export default function LandingPage() {
  // TODO_CONTENT: lengkapi data alamat detail nomor jalan, kode pos, dan koordinat maps
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Mentor Belajarku',
    description:
      'Lembaga bimbingan belajar dan les privat tatap muka & home visit di Kemiling, Bandar Lampung.',
    url: 'https://mentorbelajarku.com',
    logo: 'https://mentorbelajarku.com/logo.jpg',
    telephone: '+6281234567890',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Kemiling',
      addressRegion: 'Bandar Lampung',
      addressCountry: 'ID',
    },
    areaServed: 'Bandar Lampung',
    openingHours: 'Mo-Sa 08:00-20:00',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageView />
    </>
  );
}
