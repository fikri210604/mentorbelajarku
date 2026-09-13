# Prompt Build — Landing Page Mentor Belajarku (Next.js)

Gunakan prompt di bawah ini pada AI coding assistant (Claude Code, Cursor, dll) di dalam project Next.js yang sudah ada. Tempelkan bersama file `PRD-mentor-belajarku-landing.md` dan `DESIGN-mentor-belajarku-landing.md` sebagai referensi/context (attach kedua file itu, atau paste isinya sebelum prompt ini).

---

## PROMPT UTAMA (rewrite project)

```
Kamu bertindak sebagai senior frontend engineer yang melakukan REWRITE landing page
untuk bimbel "Mentor Belajarku" (Kemiling, Bandar Lampung) di dalam project Next.js
yang sudah ada ini.

Stack yang SUDAH terpasang di project — jangan install ulang, jangan ganti library lain:
- Next.js (App Router)
- Tailwind CSS
- shadcn/ui
- react-icons
- Zustand
- Zod

Ikuti PRD dan Design System yang saya lampirkan (PRD-mentor-belajarku-landing.md dan
DESIGN-mentor-belajarku-landing.md) sebagai satu-satunya sumber kebenaran untuk struktur
section, copywriting arah, dan token desain (warna, radius, tipografi, spacing).

Instruksi kerja:

1. Setup token desain
   - Update `globals.css` dengan CSS variable warna sesuai section "Design Tokens"
     di DESIGN.md (primary = Mentor Emerald #00A86B, secondary = Vibrant Lime #7DBA28,
     accent = Mint Glow #E6F7F0, foreground = Slate Charcoal #0F172A).
   - Update `tailwind.config` bila perlu menambahkan font family `Plus Jakarta Sans`
     (heading) dan `Inter` (body) via `next/font/google`.
   - Jangan ubah token shadcn lain (radius default boleh disesuaikan ke 1rem sesuai DESIGN.md).

2. Struktur folder
   - Buat komponen per section di `components/sections/` (mis. `hero-section.tsx`,
     `program-section.tsx`, `testimonial-section.tsx`, dst) — satu file per section,
     jangan satu file raksasa.
   - Buat folder `data/` (atau `content/`) berisi file TypeScript bertipe untuk:
     - `programs.ts` (Reguler 60 menit, Intensif 75 menit, Private 90 menit — sesuaikan
       nama & deskripsi dengan bimbel_type yang sudah ada di sistem backend)
     - `testimonials.ts`
     - `faq.ts`
     - `advantages.ts`
     - `gallery.ts`
     Semua data placeholder yang belum ada isinya nyata, tandai jelas dengan
     `// TODO_CONTENT: isi dari klien` — JANGAN mengarang angka statistik atau
     testimoni yang terlihat seperti data asli.

3. Bangun ulang halaman `app/page.tsx` sebagai komposisi section, urutan PERSIS
   sesuai bagian "Struktur Halaman" di PRD:
   Navbar → Hero → (TrustLogos jika ada data) → WhyNeedMentor → LearningMode →
   MidPageCTA → Program → Advantages → Subjects → Testimonial → HowToJoin →
   Gallery → FAQ → FinalCTA → Footer → FloatingWhatsAppButton (fixed, render
   di root layout, bukan di dalam page section manapun).

4. Komponen wajib pakai shadcn/ui sesuai tabel pemetaan di PRD:
   `Card`, `Badge`, `Accordion`, `Carousel`, `Sheet` (mobile nav), `AspectRatio`,
   `Dialog` (lightbox galeri). Jika komponen shadcn tersebut belum ada di
   `components/ui/`, generate dengan `npx shadcn@latest add <nama>` (jalankan
   sebagai instruksi, saya yang akan run manual — tulis command-nya).

5. CTA & WhatsApp
   - Buat helper `lib/whatsapp.ts` dengan fungsi `buildWaLink(context: string)` yang
     menghasilkan URL `https://api.whatsapp.com/send?phone=<NOMOR_WA_MENTOR_BELAJARKU>&text=<pesan>`.
     Nomor WA taruh sebagai constant terpisah dengan komentar `// TODO_CONTENT: ganti nomor WA asli`.
   - Setiap CTA button di section berbeda memanggil `buildWaLink()` dengan pesan
     pre-filled kontekstual (mis. dari Program section sebutkan nama program yang diklik).

6. Statistik hero (StatCounter)
   - Buat komponen `StatCounter` client-side yang animasi count-up dari 0 ke nilai
     akhir menggunakan IntersectionObserver, trigger sekali saja. Jangan pakai
     library berat — implementasi manual dengan `useState`/`useEffect` cukup.

7. Aksesibilitas & performa
   - Semua `<img>` ganti `next/image` dengan `alt` deskriptif menyebut lokasi
     (Kemiling, Bandar Lampung) untuk SEO lokal.
   - Body text selalu pakai `text-foreground`, JANGAN warna hijau/lime untuk
     paragraf panjang (kontras).
   - Tambahkan `focus-visible:ring-2 ring-primary` pada semua elemen interaktif custom.

8. SEO dasar
   - Isi `metadata` di `app/layout.tsx` atau `app/page.tsx` (title, description
     menyebut "Bimbel Kemiling Bandar Lampung", OpenGraph image placeholder).
   - Tambahkan JSON-LD schema `EducationalOrganization` dengan alamat Kemiling
     (data alamat detail tandai `TODO_CONTENT`).

Setelah selesai, jalankan `tsc --noEmit` dan pastikan tidak ada type error, lalu
tunjukkan struktur file akhir yang kamu buat/ubah.
```

---

## PROMPT TAMBAHAN (per-section, jika ingin dikerjakan bertahap)

Gunakan salah satu blok ini kalau mau membangun satu section dulu untuk direview sebelum lanjut:

```
Buatkan komponen `components/sections/hero-section.tsx` untuk landing page Mentor
Belajarku. Referensi: PRD section 6 poin 2 (HeroSection) dan DESIGN.md section 4
(Latar & Ornamen) + section 6 (tabel komponen: Stat Counter).

Requirement:
- Headline: variasi dari tagline "Dari Pondasi Kuat Menuju Prestasi Hebat"
- CTA ganda: primary (WhatsApp) pakai bg-primary rounded-full, secondary (scroll
  ke #program) pakai outline
- Background radial gradient mint (accent) blur, bukan solid
- 3 StatCounter (Jumlah Mentor, Jumlah Siswa Aktif, Tingkat Kepuasan) dengan
  animasi count-up saat masuk viewport
- Mobile-first: stack vertical di mobile, dua kolom di desktop (teks kiri, visual kanan)
- Gunakan next/image untuk gambar hero, font heading Plus Jakarta Sans
```

```
Buatkan `components/sections/program-section.tsx`. Data ambil dari `data/programs.ts`
berisi 3 tipe: Reguler (60 menit), Intensif (75 menit), Private (90 menit) — selaras
dengan bimbel_type di sistem backend Mentor Belajarku. Tampilkan sebagai grid Card
shadcn, badge durasi di pojok kanan atas tiap card, tombol CTA per card membuka
WhatsApp dengan pesan menyebut nama program yang diklik.
```

```
Buatkan `components/floating-whatsapp-button.tsx` — tombol fixed bottom-right,
warna WhatsApp asli (#25D366, BUKAN warna brand Mentor Belajarku), icon FaWhatsapp
dari react-icons/fa, muncul di semua halaman via root layout, dengan aria-label
yang jelas untuk aksesibilitas.
```

---

## Catatan Pemakaian

- Selalu sertakan PRD + DESIGN.md sebagai attachment/context setiap kali membuka sesi baru dengan AI assistant, supaya konsistensi token warna dan struktur section terjaga antar section yang dikerjakan terpisah.
- Jika backend sudah mengekspos data program/tutor secara nyata (bukan statis), minta AI assistant mengganti `data/programs.ts` dengan fetch ke API/Supabase — tapi itu di luar scope landing page murni dan sebaiknya jadi task terpisah.