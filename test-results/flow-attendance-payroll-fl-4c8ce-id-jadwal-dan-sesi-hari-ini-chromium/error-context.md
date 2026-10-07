# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flow\attendance-payroll-flow.spec.ts >> Flow: Jadwal → Absensi → Rekap → Honor (E2E isolasi) >> 1. owner: baca konfigurasi + buat murid, jadwal, dan sesi hari ini
- Location: tests\e2e\flow\attendance-payroll-flow.spec.ts:77:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/management\/dashboard/
Received string:  "http://localhost:3000/login"
Timeout: 60000ms

Call log:
  - Expect "toHaveURL" with timeout 60000ms
    98 × locator resolved to <html lang="id" class="h-full antialiased inter_fd091ad6-module__giF-bG__variable plus_jakarta_sans_705351a3-module__AnW7zG__variable font-sans">…</html>
       - unexpected value "http://localhost:3000/login"
    - waiting for "http://localhost:3000/dashboard" navigation to finish...

```

```yaml
- link "Click to Chat WA ! 👆":
  - /url: https://api.whatsapp.com/send?phone=6281234567890&text=Halo%20Admin%20Mentor%20Belajarku%2C%20saya%20ingin%20konsultasi%20mengenai%20promo-100k.
- text: Dapatkan Diskon Pendaftaran 100,000,- PROMO HEMAT
- banner:
  - link "Mentor Belajarku Logo Mentor Belajarku Bimbel & Les Privat Lampung":
    - /url: /
    - img "Mentor Belajarku Logo"
    - text: Mentor Belajarku Bimbel & Les Privat Lampung
  - navigation:
    - link "Home":
      - /url: /
    - link "Tentang Kami":
      - /url: "#tentang"
    - link "Program":
      - /url: "#program"
    - link "Metode Belajar":
      - /url: "#metode"
    - link "Testimoni":
      - /url: "#testimoni"
    - link "Aktivitas":
      - /url: "#gallery"
    - link "FAQ":
      - /url: "#faq"
  - link "KONSULTASI":
    - /url: https://api.whatsapp.com/send?phone=6281234567890&text=Halo%20Admin%20Mentor%20Belajarku%2C%20saya%20ingin%20konsultasi%20mengenai%20navbar.
- main:
  - img "Mentor Belajarku Logo"
  - text: Mentor Belajarku Portal Manajemen & Sistem Presensi Bimbingan Belajar Email Terdaftar
  - textbox "Email Terdaftar" [disabled]:
    - /placeholder: nama@email.com
    - text: admin@mentorbelajarku.com
  - text: Kata Sandi
  - textbox "Kata Sandi" [disabled]:
    - /placeholder: ••••••••
    - text: manajemen123
  - button "Tampilkan kata sandi"
  - button "Memverifikasi..." [disabled]
- contentinfo:
  - img "Mentor Belajarku"
  - text: Mentor Belajarku
  - paragraph: Lembaga bimbingan belajar dan les privat terpercaya di Kemiling, Bandar Lampung. Menanamkan konsep dasar yang kokoh, disiplin belajar terarah, dan laporan presensi berfoto setiap sesi.
  - heading "Program Belajar" [level=4]
  - list:
    - listitem:
      - link "Kelas Reguler (60 Menit)":
        - /url: "#program"
    - listitem:
      - link "Kelas Intensif (75 Menit)":
        - /url: "#program"
    - listitem:
      - link "Kelas Private 1-on-1 (90 Menit)":
        - /url: "#program"
    - listitem:
      - link "Persiapan UTBK-SNBT":
        - /url: "#program"
    - listitem:
      - link "Pendampingan Home Visit":
        - /url: "#program"
  - heading "Navigasi" [level=4]
  - list:
    - listitem:
      - link "Kebutuhan Belajar Anak":
        - /url: "#tentang"
    - listitem:
      - link "Keunggulan Mentor Belajarku":
        - /url: "#keunggulan"
    - listitem:
      - link "Kisah Sukses Siswa":
        - /url: "#testimoni"
    - listitem:
      - link "Galeri Pembelajaran":
        - /url: "#gallery"
    - listitem:
      - link "Tanya Jawab (FAQ)":
        - /url: "#faq"
  - heading "Hubungi Kami" [level=4]
  - text: "Kemiling, Bandar Lampung, Lampung, Indonesia +6281234567890 Senin - Sabtu: 08.00 - 20.00 WIB"
  - paragraph: © 2026 Mentor Belajarku. Hak Cipta Dilindungi.
  - paragraph: Bimbel & Les Privat Kemiling, Bandar Lampung.
- complementary "Bantuan WhatsApp":
  - link "Hubungi Admin Mentor Belajarku melalui WhatsApp":
    - /url: https://api.whatsapp.com/send?phone=6281234567890&text=Halo%20Admin%20Mentor%20Belajarku%2C%20saya%20ingin%20bertanya%20seputar%20bimbingan%20belajar%20di%20Mentor%20Belajarku.
    - text: Klik Untuk Konsultasi
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  1  | import { expect, type Page } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Kredensial seed dari supabase/seed-auth.ts (jangan diubah di test).
  5  |  * - owner: admin@mentorbelajarku.com / manajemen123
  6  |  * - tutor: fara@mentorbelajarku.com / mentor123
  7  |  * Override via env E2E_OWNER_EMAIL / E2E_TUTOR_EMAIL bila perlu.
  8  |  */
  9  | export const TEST_USERS = {
  10 |   owner: {
  11 |     email: process.env.E2E_OWNER_EMAIL || 'admin@mentorbelajarku.com',
  12 |     password: process.env.E2E_OWNER_PASSWORD || 'manajemen123',
  13 |     expectedPortal: '/management/dashboard' as const,
  14 |   },
  15 |   tutor: {
  16 |     email: process.env.E2E_TUTOR_EMAIL || 'fara@mentorbelajarku.com',
  17 |     password: process.env.E2E_TUTOR_PASSWORD || 'mentor123',
  18 |     expectedPortal: '/tutor/dashboard' as const,
  19 |   },
  20 | } as const;
  21 | 
  22 | export type TestRole = keyof typeof TEST_USERS;
  23 | 
  24 | /** Login via UI (/login) lalu tunggu redirect portal sesuai role. */
  25 | export async function loginAs(page: Page, role: TestRole) {
  26 |   const user = TEST_USERS[role];
  27 |   await page.context().clearCookies();
  28 |   await page.goto('/login');
  29 |   await page.locator('#email').waitFor({ state: 'visible', timeout: 20_000 });
  30 |   await page.locator('#email').fill(user.email);
  31 |   await page.locator('#password').fill(user.password);
  32 |   await page.getByRole('button', { name: /masuk|memverifikasi/i }).click();
  33 |   // LoginPage.tsx: sukses -> window.location.href = callbackUrl || '/dashboard',
  34 |   // lalu (private)/dashboard/page.tsx redirect ke portal per role.
  35 |   // Timeout longgar: kompilasi Turbopack dingin bisa >30 dtk untuk 2 redirect berantai.
> 36 |   await expect(page).toHaveURL(new RegExp(user.expectedPortal.replace(/\//g, '\\/')), {
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  37 |     timeout: 60_000,
  38 |   });
  39 |   await page.waitForLoadState('domcontentloaded');
  40 | }
  41 | 
  42 | /** Logout via API route lalu pastikan mendarat di /login?logged_out=true. */
  43 | export async function logout(page: Page) {
  44 |   await page.goto('/api/v1/auth/logout');
  45 |   await expect(page).toHaveURL(/\/login\?logged_out=true/, { timeout: 20_000 });
  46 | }
  47 | 
  48 | /** Guard halaman terautentikasi: main tampil + tidak ada raw DB error. */
  49 | export async function expectHealthyPage(page: Page) {
  50 |   await page.waitForLoadState('domcontentloaded');
  51 |   await expect(page.locator('main').first()).toBeVisible({ timeout: 20_000 });
  52 |   await expect(page.getByText(/PostgresError|duplicate key|violates unique|FATAL|panic/i)).toHaveCount(0);
  53 | }
  54 | 
```