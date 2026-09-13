# Design System — Mentor Belajarku Landing Page

Diturunkan langsung dari filosofi logo (dual-tone green monogram "mb") yang sudah didefinisikan sebelumnya. Dokumen ini menerjemahkannya menjadi token siap pakai di Tailwind + shadcn/ui.

## 1. Design Tokens (Tailwind CSS Variables)

Tambahkan ke `globals.css` (format shadcn — HSL tanpa fungsi `hsl()`, agar kompatibel dengan opacity modifier Tailwind):

```css
:root {
  --background: 0 0% 100%;              /* Pure White */
  --foreground: 222 47% 11%;            /* Slate Charcoal #0F172A */

  --primary: 158 100% 33%;              /* Mentor Emerald #00A86B */
  --primary-foreground: 0 0% 100%;

  --secondary: 85 65% 44%;              /* Vibrant Lime #7DBA28 */
  --secondary-foreground: 222 47% 11%;

  --accent: 155 54% 94%;                /* Mint Glow #E6F7F0 */
  --accent-foreground: 158 100% 33%;

  --muted: 150 20% 97%;                 /* Soft off-white #F8FAF9 */
  --muted-foreground: 222 20% 40%;

  --border: 150 15% 90%;
  --radius: 1rem;                       /* dasar rounded-2xl */
}
```

| Token | Hex | Peran |
|---|---|---|
| `primary` (Mentor Emerald) | `#00A86B` | Navbar, CTA utama, border card aktif, headline aksen |
| `secondary` (Vibrant Lime) | `#7DBA28` | Badge, statistik, indikator status, grafik pertumbuhan |
| `accent` (Mint Glow) | `#E6F7F0` | Background hero radial gradient, hover state card |
| `background` (Pure White) | `#FFFFFF` | Card background, konten utama |
| `foreground` (Slate Charcoal) | `#0F172A` | Semua teks heading & body (kontras aksesibilitas) |
| Netral 60% | `#F8FAF9` | Section background bergantian dengan putih |

**Aturan 60-30-10** wajib dipatuhi setiap section: 60% putih/`#F8FAF9`, 30% Mentor Emerald, 10% Vibrant Lime (dipakai hemat — jangan sampai lime jadi warna dominan card besar).

## 2. Tipografi

- **Heading** (`h1`–`h3`, judul section): `Plus Jakarta Sans` — tegas, geometric, ramah, selaras stroke membulat logo.
- **Body/paragraf panjang**: `Inter` — kenyamanan baca tinggi untuk orang tua.
- Skala saran (Tailwind): `h1` → `text-4xl md:text-6xl font-bold`, `h2` → `text-3xl md:text-4xl font-bold`, body → `text-base md:text-lg leading-relaxed text-foreground/80`.
- Import via `next/font/google` (self-hosted, tidak pakai `<link>` CDN) supaya tidak ada layout shift.

## 3. Bentuk & Radius (Form Language)

- Radius standar komponen: `rounded-2xl` (card, image), `rounded-3xl` (hero image / CTA banner besar), `rounded-full` (button pill, badge, avatar).
- **Tidak ada** sudut tajam (`rounded-none`) di komponen utama — selaras kurva logo.
- Shadow lembut: `shadow-[0_8px_30px_rgba(0,168,107,0.08)]` untuk card agar terasa "mengambang" tanpa berat.

## 4. Latar & Ornamen

- Hero section & CTA penutup: radial gradient lembut dari `accent` (`#E6F7F0`) memudar ke putih, posisi blob di kanan-atas dan kiri-bawah (`blur-3xl`, opacity rendah) — efek glassmorphism ringan, bukan gradient solid mencolok.
- Divider antar-section boleh memakai kurva SVG horizon (mengikuti filosofi "kontur gelombang" logo) sebagai separator dekoratif — opsional, gunakan pada 1–2 titik saja (mis. antara Hero dan section berikutnya) agar tidak berlebihan.

## 5. Ikonografi

- Gunakan `react-icons` — set utama: `react-icons/fa6` atau `react-icons/lu` (Lucide, sudah default di shadcn) agar konsisten stroke-based.
- Warna icon default: `text-primary` di atas background `accent` berbentuk lingkaran (`bg-accent rounded-full p-3`) — merefleksikan bentuk lingkaran huruf "b" pada logo.
- Icon WhatsApp (`FaWhatsapp` dari `react-icons/fa`) khusus memakai warna brand WhatsApp asli (`#25D366`) agar tetap dikenali sebagai tombol WA, bukan warna brand Mentor Belajarku.

## 6. Komponen & Pemetaan Visual

| Komponen | Style Note |
|---|---|
| **Navbar** | Background putih transparan → solid + shadow tipis saat scroll (`backdrop-blur`), logo kiri, menu tengah/kanan, CTA button `bg-primary text-white rounded-full` |
| **Button Primary** | `bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3 font-semibold` |
| **Button Secondary/Outline** | `border-2 border-primary text-primary rounded-full` |
| **Badge "Rekomendasi"/Promo** | `bg-secondary text-white rounded-full text-xs px-3 py-1` (Vibrant Lime — dipakai hemat sesuai aturan 10%) |
| **Card Program** | `bg-white rounded-2xl border border-border hover:border-primary transition-colors p-6`, badge durasi (60/75/90 menit) di pojok |
| **Stat Counter (Hero)** | Angka besar `text-secondary font-bold text-4xl`, label kecil `text-foreground/70` di bawahnya |
| **Feature/Advantage Card** | Icon lingkaran mint + judul bold + deskripsi 1-2 kalimat, grid `grid-cols-1 md:grid-cols-3` |
| **Testimonial Carousel** | Card putih dengan quote, avatar bulat, nama + sekolah asal, kontrol carousel pakai warna primary |
| **FAQ Accordion** | shadcn `Accordion`, garis pemisah tipis `border-border`, chevron icon berputar saat expand |
| **Floating WhatsApp Button** | `fixed bottom-6 right-6 z-50 bg-[#25D366] rounded-full shadow-lg animate-none` (hindari animasi bounce berlebihan yang mengganggu) |
| **Footer** | Background `bg-foreground text-white` (Slate Charcoal) sebagai kontras penutup, link dan ikon sosial dengan hover `text-secondary` |

## 7. Motion / Interaksi

- Gunakan animasi halus dan fungsional saja: fade-in + slide-up ringan (`8–16px`) saat elemen masuk viewport untuk section header dan card grid.
- Count-up animation pada `StatCounter` — durasi 1.5–2s, easing `ease-out`, trigger sekali saat masuk viewport (jangan re-trigger tiap scroll).
- Hover card: `scale-[1.02]` + shadow bertambah, transisi `duration-200`.
- Hindari animasi berat (parallax kompleks, particle effect) — prioritas performa mobile.

## 8. Aksesibilitas & Kontras

- Body text **selalu** `text-foreground` (`#0F172A`) di atas background terang — jangan pernah body text panjang berwarna hijau/lime (kontras rendah).
- Warna hijau/lime dipakai untuk elemen non-esensial-baca: badge, ikon, border, angka statistik pendek — bukan paragraf.
- Pastikan focus-visible ring (`focus-visible:ring-2 ring-primary`) tetap aktif di semua elemen interaktif untuk keyboard navigation.

## 9. Tagline & Voice

> "Dari Pondasi Kuat Menuju Prestasi Hebat: Belajar Terarah, Tumbuh Percaya Diri."

Gunakan sebagai headline hero atau sub-tagline konsisten di footer/meta description. Tone komunikasi: hangat, memotivasi, tidak kaku — selaras filosofi warna lime (energi muda) dikombinasikan kepercayaan emerald (kredibilitas akademik).