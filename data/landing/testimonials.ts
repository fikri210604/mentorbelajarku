export interface LandingTestimonial {
  id: string;
  name: string;
  role: string;
  schoolOrArea: string;
  quote: string;
  rating: number;
}

// TODO_CONTENT: isi dari klien (sesuaikan dengan data testimoni riil siswa/wali murid Mentor Belajarku)
export const LANDING_TESTIMONIALS: LandingTestimonial[] = [
  {
    id: 'testi-1',
    name: 'Ibu Ratna Dewi',
    role: 'Wali Murid Kelas 8',
    schoolOrArea: 'SMPN 1 Bandar Lampung (Kemiling)',
    quote:
      'Sangat terbantu les di sini. Nilai matematika anak saya meningkat drastis dari 65 menjadi 88. Yang paling menenangkan, setiap selesai les tutornya selalu mengirim laporan foto dan catatan materi.',
    rating: 5,
  },
  {
    id: 'testi-2',
    name: 'Ahmad Fadhil',
    role: 'Siswa Kelas 12',
    schoolOrArea: 'SMAN 2 Bandar Lampung',
    quote:
      'Tutornya asik dan sabar banget jelasin konsep Fisika yang awalnya bikin pusing. Belajarnya dari logika dasar, bukan cuma ngafalin rumus. Persiapan UTBK jadi jauh lebih mantap!',
    rating: 5,
  },
  {
    id: 'testi-3',
    name: 'Bapak Hendra Gunawan',
    role: 'Wali Murid Kelas 5 SD',
    schoolOrArea: 'Kemiling, Bandar Lampung',
    quote:
      'Anak saya tadinya malas dan gampang bosan kalau belajar sendiri di rumah. Sejak didampingi mentor di sini, jadi lebih disiplin dan antusias setiap ada PR sekolah.',
    rating: 5,
  },
  {
    id: 'testi-4',
    name: 'Nabila Safitri',
    role: 'Alumni / Mahasiswa Baru',
    schoolOrArea: 'Lolos SNBT Universitas Lampung (Unila)',
    quote:
      'Program intensifnya bener-bener ngebantu buat drill soal penalaran kuantitatif. Penjelasan mentor to-the-point dan klinik PR-nya bisa tanya kapan saja kalau ada yang belum paham.',
    rating: 5,
  },
];
