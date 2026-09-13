# PRD — Landing Page Mentor Belajarku

## 1. Ringkasan Proyek

| Item | Detail |
|---|---|
| Nama produk | Landing Page Mentor Belajarku |
| Jenis | Rewrite total (bukan halaman baru) atas project Next.js yang sudah ada |
| Lokasi bisnis | Kemiling, Bandar Lampung |
| Tujuan utama | Konversi pengunjung (siswa/orang tua) menjadi lead via WhatsApp/konsultasi |
| Stack yang sudah terpasang | Next.js, Tailwind CSS, shadcn/ui, react-icons, Zustand, Zod |
| Referensi kompetitor | alfaprivat.com (les privat Bandar Lampung) |
| Referensi identitas visual | Logo dual-tone hijau "mb" (Mentor Emerald + Vibrant Lime) |

## 2. Latar Belakang & Insight dari Analisis Kompetitor

Halaman `alfaprivat.com/les-privat-di-lampung/bandar-lampung` dianalisis sebagai acuan pola landing page bimbel/les privat yang sudah terbukti (proven pattern) di pasar Indonesia. Pola strukturalnya konsisten dengan landing page jasa pendidikan pada umumnya:

- Sticky floating CTA WhatsApp (selalu terlihat, tidak hilang saat scroll) + badge promo diskon.
- Hero section dengan headline value proposition, CTA utama, dan **counter statistik** (jumlah guru, jumlah siswa, tingkat kepuasan) yang beranimasi saat masuk viewport.
- Logo strip "asal sekolah siswa" sebagai social proof pasif.
- Blok edukatif "kapan butuh les privat" — konten persuasif berbasis pain point orang tua, ditutup dengan penjelasan solusi.
- Perbandingan mode belajar (online vs datang ke rumah / offline).
- CTA banner tengah halaman (mid-page reminder) sebelum pembaca lelah scroll.
- Logo kampus asal tutor (kredibilitas pengajar).
- Grid program/kelas dalam bentuk card berlink (SD, SMP, SMA, UTBK, dst).
- Grid "keunggulan" (feature list, biasanya 6–9 item, icon + judul + deskripsi singkat).
- Blok kurikulum yang didukung (Nasional, Cambridge, IB, dsb) — relevan jika Mentor Belajarku juga menyasar sekolah swasta/internasional; jika tidak, blok ini disederhanakan jadi daftar mapel/jenjang.
- Daftar mata pelajaran lengkap.
- Testimonial carousel + Success story gallery (bukti hasil, foto).
- Langkah pendaftaran (3 step): konsultasi → pemilihan guru/mentor → penjadwalan.
- Gallery kegiatan belajar.
- FAQ accordion.
- Footer dengan info kontak, alamat, dan CTA WhatsApp per admin.

**Insight kunci:** halaman ini didesain penuh untuk *lead generation via WhatsApp*, bukan checkout online — semua CTA mengarah ke `wa.me`/`api.whatsapp.com` dengan pesan pre-filled. Pola ini cocok direplikasi untuk Mentor Belajarku karena target audiens (orang tua siswa Bandar Lampung) memiliki perilaku digital yang sama.

## 3. Tujuan (Goals)

1. Menyampaikan identitas brand Mentor Belajarku (pondasi kuat + pertumbuhan) secara visual dan naratif.
2. Membangun kepercayaan orang tua murid di area Kemiling & Bandar Lampung dalam < 10 detik pertama (hero section).
3. Mendorong konversi ke WhatsApp/konsultasi sebagai CTA utama di setiap section penting.
4. Menyajikan program bimbel (Reguler, Intensif, Private — selaras dengan sistem bimbel_type yang sudah ada di backend) secara jelas.
5. Landing page harus cepat (Core Web Vitals baik), mobile-first, dan mudah di-maintain (component-based, data terpisah dari UI).

## 4. Target Pengguna

- **Orang tua siswa** (SD/SMP/SMA) di Bandar Lampung, khususnya area Kemiling — pengambil keputusan utama, sensitif terhadap kepercayaan (legalitas, testimoni, harga).
- **Siswa** (SMP/SMA) yang mencari bimbel UTBK/SNBT atau pendalaman mapel — mencari kecocokan gaya belajar, harga terjangkau.
- Traffic sumber: pencarian Google lokal ("bimbel Kemiling", "les privat Bandar Lampung"), share WhatsApp, media sosial.

## 5. Non-Goals (Out of Scope untuk fase ini)

- Sistem login siswa/orang tua (itu domain sistem attendance internal, bukan landing page publik).
- Pembayaran online / e-commerce.
- CMS penuh — konten boleh berupa data statis (`.ts`/`.json`) di awal, dengan struktur yang mudah dipindah ke CMS/DB nanti.
- Multi-bahasa (fase ini Bahasa Indonesia saja).

## 6. Struktur Halaman (Sitemap Single Page)

Landing page berbentuk **satu halaman scroll (one-page)** dengan anchor navigation, mengikuti pola kompetitor:

1. `Navbar` — sticky, logo, anchor menu (Tentang, Program, Testimoni, FAQ), tombol CTA "Konsultasi Gratis".
2. `HeroSection` — headline, subheadline (tagline: *"Dari Pondasi Kuat Menuju Prestasi Hebat"*), CTA ganda (Primary: WhatsApp, Secondary: Lihat Program), gambar/ilustrasi, dan **StatCounter** (jumlah tutor, jumlah siswa aktif, tingkat kepuasan).
3. `TrustLogos` (opsional, jika ada data sekolah asal siswa) — logo/nama sekolah asal siswa Mentor Belajarku di Bandar Lampung.
4. `WhyNeedMentorSection` — konten edukatif "kapan butuh mentor pendamping belajar" (pain point list) → jembatan ke solusi Mentor Belajarku.
5. `LearningModeSection` — dua kartu: Belajar di Tempat (lokasi Kemiling) vs Home Visit/Online (sesuaikan dengan model bisnis real Mentor Belajarku).
6. `MidPageCTA` — banner ajakan daftar dengan gradient hijau (emerald→lime), 1 tombol besar.
7. `ProgramSection` — grid card program mengikuti `bimbel_type` yang sudah ada di sistem: **Reguler (60 menit)**, **Intensif (75 menit)**, **Private (90 menit)** — plus opsi jenjang (SD/SMP/SMA/UTBK) sebagai filter/tag pada card.
8. `AdvantagesSection` ("Keunggulan Mentor Belajarku") — grid 6–9 item icon+judul+deskripsi (tutor terkurasi, pendampingan berkelanjutan, laporan progres ke orang tua, lokasi strategis Kemiling, dll).
9. `SubjectsSection` — daftar mata pelajaran yang dilayani (chip/badge list).
10. `TestimonialSection` — carousel testimoni orang tua/siswa (foto + nama + kutipan singkat + sekolah asal).
11. `HowToJoinSection` — 3 langkah pendaftaran (Konsultasi → Penjadwalan → Mulai Belajar), selaras alur di atas.
12. `GallerySection` — foto kegiatan belajar di Mentor Belajarku.
13. `FAQSection` — accordion pertanyaan umum (lokasi, jadwal, biaya, ganti mentor, dll).
14. `FinalCTASection` — CTA penutup sebelum footer.
15. `Footer` — logo, deskripsi singkat, alamat Kemiling, nomor WA admin, jam operasional, link sosial media, copyright.
16. `FloatingWhatsAppButton` — persistent, muncul di semua section (mobile & desktop).

## 7. Functional Requirements

| ID | Requirement | Prioritas |
|---|---|---|
| FR-1 | Semua CTA utama membuka WhatsApp dengan pesan pre-filled berbeda per section (konteks-aware, mis. dari section Program → sudah menyebut nama program) | Must |
| FR-2 | `StatCounter` di hero beranimasi count-up saat elemen masuk viewport (pakai IntersectionObserver / lib ringan) | Should |
| FR-3 | `ProgramSection` menampilkan 3 tipe bimbel dengan durasi eksplisit (60/75/90 menit) sesuai data bisnis backend, bukan hardcode di banyak tempat — taruh di satu file data/konfigurasi | Must |
| FR-4 | `TestimonialSection` dan `GallerySection` dapat menerima data dinamis (array of object) agar mudah ditambah tanpa ubah komponen | Must |
| FR-5 | `FAQSection` accordion dapat expand/collapse, hanya 1 atau multiple item terbuka (pakai shadcn `Accordion`) | Must |
| FR-6 | Navbar sticky, berubah style (shadow/background solid) saat discroll | Should |
| FR-7 | Semua form/interaksi tervalidasi dengan Zod bila ada input form (mis. form konsultasi singkat, opsional pengganti WA) | Could |
| FR-8 | State UI ringan (mis. accordion aktif, mobile menu open) dikelola lewat local state React; Zustand dipakai hanya jika ada state lintas komponen yang nyata (mis. modal global, filter program) | Must |
| FR-9 | SEO dasar: metadata per halaman, OpenGraph image, JSON-LD `LocalBusiness`/`EducationalOrganization` untuk Kemiling, Bandar Lampung | Should |
| FR-10 | Semua gambar pakai `next/image` dengan lazy loading, alt text deskriptif untuk SEO lokal | Must |

## 8. Non-Functional Requirements

- **Performance**: Lighthouse mobile score ≥ 90 di Performance & Accessibility.
- **Responsiveness**: Mobile-first (mayoritas traffic orang tua via HP), breakpoint standar Tailwind (sm/md/lg/xl).
- **Aksesibilitas**: kontras warna teks memenuhi WCAG AA (gunakan Slate Charcoal `#0F172A` di atas putih, bukan hijau muda untuk body text panjang).
- **Maintainability**: konten (teks program, testimoni, FAQ, galeri) dipisah ke folder `data/` atau `content/` sebagai TypeScript object/array bertipe, bukan hardcode di JSX.
- **Konsistensi desain**: seluruh komponen mengikuti design token di `DESIGN.md` (warna, radius, spacing, tipografi).

## 9. Pemetaan ke shadcn/ui Components

| Section | Komponen shadcn yang relevan |
|---|---|
| Navbar | `NavigationMenu` / custom + `Sheet` (mobile menu) |
| Hero | `Button`, custom stat card |
| Program | `Card`, `Badge`, `Tabs` (filter jenjang) |
| Advantages | `Card` (grid) |
| Testimonial | `Carousel` (shadcn/ui carousel berbasis Embla) |
| FAQ | `Accordion` |
| Gallery | `Dialog` (lightbox), `AspectRatio` |
| Floating WA | custom `Button` fixed position, icon dari `react-icons/fa` (`FaWhatsapp`) |
| Toast/notif (jika form) | `Sonner`/`Toast` |

## 10. Metrik Keberhasilan (Success Metrics)

- Rasio klik CTA WhatsApp / total pengunjung unik.
- Bounce rate hero section (target turun dibanding versi lama).
- Waktu load (LCP) < 2.5s di koneksi 4G.
- Jumlah lead WhatsApp per minggu setelah rilis.

## 11. Risiko & Catatan

- Jika Mentor Belajarku belum memiliki data riil (jumlah siswa, testimoni, foto galeri), gunakan struktur data siap-isi (placeholder eksplisit ditandai `TODO_CONTENT`) — jangan mengarang angka/testimoni palsu di produk final.
- Konten kurikulum internasional (Cambridge/IB) pada kompetitor kemungkinan tidak relevan untuk Mentor Belajarku (skala lokal Bandar Lampung) — sesuaikan `SubjectsSection`/`ProgramSection` dengan jenjang dan kurikulum yang benar-benar dilayani (kemungkinan Kurikulum Merdeka/K13 + UTBK SNBT).