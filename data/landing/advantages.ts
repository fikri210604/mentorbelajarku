export interface LandingAdvantage {
  id: string;
  title: string;
  description: string;
  iconName: 'GraduationCap' | 'Target' | 'Camera' | 'MapPin' | 'Home' | 'RefreshCw';
}

export const LANDING_ADVANTAGES: LandingAdvantage[] = [
  {
    id: 'tutor-terkurasi',
    title: 'Mentor Terkurasi & Berpengalaman',
    description: 'Pengajar lulusan dan mahasiswa berprestasi dari universitas unggulan yang komunikatif, sabar, dan menguasai materi.',
    iconName: 'GraduationCap',
  },
  {
    id: 'konsep-dasar',
    title: 'Pendalaman Konsep dari Dasar',
    description: 'Kami tidak mengajarkan hafalan rumus cepat sesaat, melainkan menanamkan pemahaman logika berpikir yang kokoh.',
    iconName: 'Target',
  },
  {
    id: 'laporan-presensi',
    title: 'Orang Tua Tetap Terlibat',
    description: 'Orang tua mendapat gambaran perkembangan belajar anak secara jelas, tanpa mengganggu fokus anak saat belajar bersama mentor.',
    iconName: 'Camera',
  },
  {
    id: 'lokasi-kemiling',
    title: 'Lokasi Strategis di Kemiling',
    description: 'Akses mudah dan nyaman untuk siswa di area Kemiling dan sekitarnya di Bandar Lampung untuk belajar tatap muka yang kondusif.',
    iconName: 'MapPin',
  },
  {
    id: 'mode-belajar',
    title: 'Pilihan di Tempat atau Home Visit',
    description: 'Fleksibel memilih belajar langsung di tempat bimbel atau mentor datang langsung ke rumah siswa di Bandar Lampung.',
    iconName: 'Home',
  },
  {
    id: 'reschedule-ramah',
    title: 'Pendampingan yang Fleksibel',
    description: 'Siswa berhalangan hadir karena sakit atau agenda sekolah? Kami membantu mengatur ulang sesi dengan tetap menghargai proses belajar anak.',
    iconName: 'RefreshCw',
  },
];
