export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  imagePlaceholderColor: string;
  description: string;
}

// TODO_CONTENT: isi dari klien (ganti dengan foto kegiatan riil sesi belajar di Kemiling, Bandar Lampung)
export const LANDING_GALLERY: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Sesi Belajar Privat 1-on-1',
    category: 'Private Class',
    imagePlaceholderColor: 'from-emerald-600/20 to-emerald-800/30',
    description: 'Fokus intensif membedah konsep matematika dasar dan persiapan ulangan harian.',
  },
  {
    id: 'gal-2',
    title: 'Diskusi Kelompok Kelas Reguler',
    category: 'Regular Class',
    imagePlaceholderColor: 'from-lime-600/20 to-lime-800/30',
    description: 'Suasana belajar aktif dengan interaksi kelompok kecil maksimal 5 siswa.',
  },
  {
    id: 'gal-3',
    title: 'Drill Soal Persiapan UTBK-SNBT',
    category: 'Intensive Class',
    imagePlaceholderColor: 'from-teal-600/20 to-teal-800/30',
    description: 'Latihan soal penalaran analitis dan pembekalan strategi manajemen waktu ujian.',
  },
  {
    id: 'gal-4',
    title: 'Pendampingan Home Visit',
    category: 'Home Visit',
    imagePlaceholderColor: 'from-emerald-700/20 to-teal-900/30',
    description: 'Mentor hadir langsung ke rumah siswa di Bandar Lampung dengan pembelajaran nyaman.',
  },
];
