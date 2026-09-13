/**
 * WhatsApp Link Helper for Mentor Belajarku Landing Page
 * Generates context-aware WhatsApp links for different CTA sections.
 */

// TODO_CONTENT: ganti nomor WA asli (format internasional tanpa tanda +, misal 628xxxxxxxxxx)
export const WHATSAPP_PHONE_NUMBER = '6281234567890';

export function buildWaLink(context: string): string {
  let message = 'Halo Admin Mentor Belajarku, ';

  switch (context.toLowerCase()) {
    case 'hero':
      message += 'saya tertarik untuk konsultasi program belajar dan tanya jadwal untuk anak saya.';
      break;
    case 'reguler':
      message += 'saya tertarik mendaftar program Kelas Reguler (60 menit). Boleh minta info biaya dan jadwal yang tersedia?';
      break;
    case 'intensif':
      message += 'saya tertarik mendaftar program Kelas Intensif (75 menit) untuk persiapan ujian. Boleh minta info selengkapnya?';
      break;
    case 'private':
      message += 'saya tertarik mendaftar program Kelas Private 1-on-1 (90 menit). Boleh konsultasi kebutuhan tutor dan biayanya?';
      break;
    case 'kemiling':
    case 'offline':
      message += 'saya ingin konsultasi mengenai bimbingan belajar tatap muka di lokasi Kemiling, Bandar Lampung.';
      break;
    case 'home-visit':
      message += 'saya ingin tanya mengenai layanan guru datang ke rumah (Home Visit) di area Bandar Lampung.';
      break;
    case 'floating':
      message += 'saya ingin bertanya seputar bimbingan belajar di Mentor Belajarku.';
      break;
    case 'faq':
      message += 'saya punya pertanyaan yang belum tercantum di website seputar bimbingan belajar Mentor Belajarku.';
      break;
    default:
      message += `saya ingin konsultasi mengenai ${context}.`;
      break;
  }

  return `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE_NUMBER}&text=${encodeURIComponent(message)}`;
}
