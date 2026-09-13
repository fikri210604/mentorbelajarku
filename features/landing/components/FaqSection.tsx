'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, HelpCircle } from 'lucide-react';

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Bagaimana jika anak berhalangan hadir saat jadwal les (izin/sakit)?',
      answer:
        'Di Mentor Belajarku, jatah pertemuan siswa TIDAK HANGUS jika siswa izin sakit atau ada keperluan mendesak sekolah dengan konfirmasi sebelumnya. Sesi tersebut dapat dijadwalkan ulang (reschedule) tanpa mengurangi kuota paket belajar ananda.',
    },
    {
      question: 'Bagaimana kualifikasi dan standar seleksi tutor pengajar?',
      answer:
        'Seluruh tutor kami merupakan lulusan atau mahasiswa berprestasi dari universitas terkemuka (UI, ITB, UGM, Unpad, dll.) yang telah melewati tahapan seleksi ketat: uji penguasaan materi akademik, microteaching kemampuan komunikasi, serta pelatihan pedagogi ramah siswa.',
    },
    {
      question: 'Apakah kurikulum bimbingan disesuaikan dengan kurikulum sekolah anak?',
      answer:
        'Sangat disesuaikan. Kami memadukan Kurikulum Merdeka dan Kurikulum Nasional dengan fokus pada buku teks dan silabus yang dipakai di sekolah masing-masing murid, termasuk membantu penuntasan PR harian dan kisi-kisi ujian sekolah.',
    },
    {
      question: 'Bagaimana orang tua memantau kehadiran dan capaian materi anak?',
      answer:
        'Setiap selesai sesi bimbingan, sistem kami mencatat presensi berbasis foto langsung yang diambil oleh tutor serta ringkasan evaluasi materi pembelajaran yang tuntas dibahas hari tersebut, memberikan transparansi 100% kepada orang tua.',
    },
    {
      question: 'Apakah bisa mencoba kelas atau tes diagnostik terlebih dahulu?',
      answer:
        'Ya! Kami menyediakan sesi Tes Diagnostik dan Konsultasi Kebutuhan Belajar secara GRATIS tanpa komitmen. Tim akademik kami akan memetakan kelemahan materi siswa dan memberikan saran program bimbingan yang paling efektif.',
    },
  ];

  return (
    <section id="faq" className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t">
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-3 px-3 py-1 font-semibold border-primary/30 bg-primary/5 text-primary gap-1.5">
          <HelpCircle className="h-3.5 w-3.5" />
          Tanya Jawab Populer
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
          Pertanyaan yang Sering Diajukan (FAQ)
        </h2>
        <p className="text-muted-foreground mt-3 text-base sm:text-lg">
          Semua hal yang perlu Anda ketahui sebelum mendaftarkan putra-putri tercinta di Mentor Belajarku.
        </p>
      </div>

      <div className="space-y-3.5">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-card ${
                isOpen ? 'border-primary/40 shadow-sm' : 'hover:border-border'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-sm sm:text-base text-foreground gap-4"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-primary' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t bg-muted/10">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
