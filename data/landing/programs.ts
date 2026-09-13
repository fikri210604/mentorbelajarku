export interface LandingProgram {
  id: 'reguler' | 'intensif' | 'private';
  name: string;
  durationMinutes: number;
  durationLabel: string;
  badge: string;
  isPopular?: boolean;
  targetAudience: string;
  description: string;
  grades: Array<'SD' | 'SMP' | 'SMA' | 'UTBK'>;
  features: string[];
}

export const LANDING_PROGRAMS: LandingProgram[] = [
  {
    id: 'reguler',
    name: 'Kelas Reguler',
    durationMinutes: 60,
    durationLabel: '60 Menit / Pertemuan',
    badge: 'Pendampingan Harian',
    targetAudience: 'Siswa SD, SMP, SMA yang ingin konsisten memahami pelajaran sekolah dan menuntaskan PR.',
    description: 'Format pembelajaran terstruktur dengan pendalaman konsep dasar dan penguatan tugas sekolah secara teratur.',
    grades: ['SD', 'SMP', 'SMA'],
    features: [
      'Durasi fokus 60 menit per sesi',
      'Kelompok kecil kondusif (maks. 5 siswa)',
      'Bimbingan tuntas PR & materi kurikulum sekolah',
      'Laporan presensi & bukti foto setiap selesai sesi',
      'Jadwal fleksibel & dukungan reschedule jika izin',
    ],
  },
  {
    id: 'intensif',
    name: 'Kelas Intensif',
    durationMinutes: 75,
    durationLabel: '75 Menit / Pertemuan',
    badge: 'Rekomendasi Ujian & SNBT',
    isPopular: true,
    targetAudience: 'Persiapan Penilaian Tengah/Akhir Semester (PTS/PAS), Ujian Sekolah, dan UTBK-SNBT.',
    description: 'Akselerasi pemahaman materi berat dan pembiasaan latihan soal bertingkat (HOTS) dengan bimbingan intensif.',
    grades: ['SMP', 'SMA', 'UTBK'],
    features: [
      'Durasi optimal 75 menit untuk drill soal mendalam',
      'Bedah konsep tuntas & strategi pemecahan soal HOTS',
      'Kuis berkala dan evaluasi kesiapan ujian',
      'Laporan presensi berfoto & catatan capaian tiap sesi',
      'Konsultasi strategi target sekolah & jurusan kampus',
    ],
  },
  {
    id: 'private',
    name: 'Kelas Private 1-on-1',
    durationMinutes: 90,
    durationLabel: '90 Menit / Pertemuan',
    badge: 'Eksklusif & Personal',
    targetAudience: 'Siswa yang membutuhkan perhatian khusus 1-on-1, penuntasan materi spesifik, atau les di rumah.',
    description: 'Bimbingan privat eksklusif dengan kurikulum dan ritme belajar yang 100% disesuaikan dengan kebutuhan anak.',
    grades: ['SD', 'SMP', 'SMA', 'UTBK'],
    features: [
      'Fokus penuh 90 menit (1 Siswa 1 Mentor)',
      'Materi dan kecepatan belajar 100% kustom',
      'Pilihan belajar di tempat (Kemiling) atau Home Visit',
      'Laporan evaluasi perkembangan individual detail',
      'Fleksibilitas waktu dan pemilihan mentor favorit',
    ],
  },
];
