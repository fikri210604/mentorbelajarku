# AUTOMATION.md — Arah Pengembangan: Absensi Otomatis via n8n × Telegram × LLM × Spreadsheets

> Status: Dokumen desain (belum diimplementasikan).
> Terikat pada: `AGENTS.md`, `BUSINESS_RULES.md`, `PRD.md`.
> Prinsip utama: **Sistem ini (PostgreSQL) tetap source of truth.**

---

## 1. Konteks & Masalah

Workflow absensi saat ini (web):

```text
Tutor buka browser → login → pilih sesi → ambil foto →
pilih status semua murid → isi materi → konfirmasi → simpan
```

Untuk tutor yang mengajar sore/malam di lokasi bimbel, langkah-langkah itu
menghasilkan friction: laptop/HP belum login, form panjang, jaringan lambat.
Akibatnya presensi sering telat atau terlewat, padahal presensi adalah dasar
untuk: histori murid, session numbering, dan honor tutor.

**Tujuan automation:** membuat tutor bisa melakukan presensi hanya dengan
interaksi yang paling alami — chat Telegram + 1 foto — dalam waktu < 30 detik,
tanpa mengubah satu pun aturan bisnis yang sudah ditetapkan.

---

## 2. Prinsip Desain (Non-negotiable)

1. **Sistem ini adalah satu-satunya source of truth.**
   Telegram, n8n, LLM, dan Spreadsheets hanyalah *antarmuka input* dan
   *kanal output*. Tidak boleh ada keputusan bisnis yang diambil di luar
   sistem ini.
2. **Semua validasi bisnis tetap di server sistem ini.**
   Jendela waktu absensi (`attendance window`), status kehadiran yang sah,
   aturan payable (present/late), dan izin menulis absensi divalidasi di
   endpoint sistem, bukan di workflow n8n atau di prompt LLM.
3. **LLM hanya "parser bahasa", bukan "penentu fakta".**
   LLM mengubah kalimat bebas tutor menjadi JSON terstruktur (Zod schema).
   Setelah itu JSON tadi diperlakukan *sama persis* dengan payload web form.
   LLM tidak boleh men-status-kan murid, mengubah tanggal, atau membuat
   session — semua ID/session yang sah ditentukan sistem.
4. **Foto tetap wajib tunduk pada validasi server.**
   (MIME, ukuran, kompresi, path storage `attendance/{tahun}/{bulan}/...`)
   tidak berubah karena sumbernya dari Telegram.
5. **Audit log wajib** untuk setiap penulisan absensi yang berasal dari
   automation, dengan metadata historis yang membedakan sumbernya.
6. **Spreadsheets = read-only mirror.** Ekspor satu arah. Jangan pernah
   dua arah — spreadsheet tidak boleh menulis balik ke database.

---

## 3. Arsitektur Target

```text
                              ┌────────────────────┐
                              │   Tutor (HP)       │
                              └─────┬────────┬─────┘
                              chat text │        │ foto (JPG)
                                     ▼        ▼
                              ┌────────────────────┐
                              │   Telegram Bot     │
                              └─────┬──────────────┘
                                     │ webhook
                                     ▼
                            ┌─────────────────────┐
                            │        n8n          │   (orchestrator, self-host)
                            │  ── pairing flow    │
                            │  ── LLM parse text  │
                            │  ── retry & dedupe  │
                            │  ── reply template  │
                            └─────┬───────────────┘
                                  │ HTTPS + API Key
                                  ▼
                ┌───────────────────────────────────────────┐
                │  SISTEM INI (Next.js App Router)          │
                │  /api/v1/automation/tutor/*               │
                │  ── auth API key (service account)        │
                │  ── Zod validation (schema sama dgn web)  │
                │  ── window check (attendance-window)      │
                │  ── idempotency + audit log               │
                │  ── Supabase Storage (foto)               │
                │  ── PostgreSQL (session/attendance)       │
                └─────┬────────────────────┬────────────────┘
                      │ (read/export)      │ (query rekap)
                      ▼                    ▼
              ┌──────────────┐      ┌──────────────────────┐
              │ Spreadsheets │      │ Management Telegram/ │
              │ (mirror unoerah)    │ UI web (dashboard)   │
              └──────────────┘      └──────────────────────┘
```

Peran masing-masing komponen:

| Komponen | Peran | TIDAK boleh |
|---|---|---|
| Telegram | Kanal input tutor + notifikasi | Menyimpan data bisnis |
| n8n | Orkestrasi: pairing, LLM node, retry, dedupe, reply | Validasi bisnis yang mengikat |
| LLM (di node n8n) | Ekstraksi teks bebas → JSON (Zod) | Menentukan status/tanggal/session |
| Spreadsheets | Rekap/mirror untuk management | Menulis balik ke DB |
| Sistem ini | Auth, validasi, bisnis, storage, audit, payroll | — |

---

## 4. Desain Integrasi API (di sisi sistem ini)

### 4.1 Masalah: auth machine-to-machine

Auth saat ini Better Auth (session browser). n8n tidak memiliki browser.
**Jangan** menyalin cookie session ke n8n. Solusi: **Service Account API Key.**

```text
tabel: api_keys
├── id
├── name                ("n8n-automation")
├── key_hash            (bcrypt/argon2 — simpan hash, bukan key asli)
├── key_prefix          (untuk identifikasi yang ditampilkan, mis. "n8n_…4f2")
├── scopes              (["attendance:write", "attendance:read", "session:read"])
├── created_by          (userId management)
├── created_at
├── last_used_at
├── expires_at
└── revoked_at
```

Middleware auth untuk path automation:

```text
Request n8n
  ↓ Header: Authorization: Bearer <api-key>
  ↓ Cari key → hash match → cek revoke/expiry
  ↓ Cek scope sesuai endpoint
  ↓ Filter role action sesuai scope
  ↓ Audit log (api_key_id sebagai "who")
```

Ini konsisten dengan AGENTS.md §3 — automation tetap melewati
authentication → authorization → validation yang sama dengan user biasa,
hanya mekanisme identitasnya berbeda.

### 4.2 Endpoint baru (Route Handlers, bukan Server Action)

```text
POST /api/v1/automation/tutor/attendance/snapshot
    → Balik daftar sesi hari ini untuk 1 tutor (id, jam, program, murid,
      pertemuan ke-N, status presensi). Tutor "bertanya" ke bot → bot
      menjawab dari snapshot ini.

POST /api/v1/automation/tutor/attendance/submit
    → Body yang SAMA dengan submitSessionAttendance web today:
      { sessionId, sessionPhotoBase64, items: [{ studentId, status,
        material, notes }], sourceIdempotency }
    → Semua aturan (window, foto wajib, status payable, dst.) dijalankan
      ≥ sama seperti jalur web.

POST /api/v1/automation/tutor/photo
    → Upload foto (multipart dari file Telegram yang diunduh n8n).

GET /api/v1/automation/management/recap
    → Rekap harian/mingguan untuk disiapkan di chat management atau
      dipush ke Spreadsheets.
```

**Idempotency:** setiap submit dari automation membawa
`sourceIdempotency` (mis. `:{sessionId}:2026-10-02`). Endpoint menolak
(sukses already-recorded) jika presensi session yang sama sudah tersimpan —
mencegah double-entry antara web dan Telegram.

### 4.3 Perubahan skema kecil yang diperlukan

```text
tabel: tutors (tambahan kolom)
├── telegram_chat_id        (nullable — hasil pairing)
└── telegram_linked_at      (nullable)

tabel: audit_logs (tambahan kolom metadata)
└── source                  ("web" | "automation" | "n8n" | "system")
└── api_key_id              (nullable)
```

Jika ingin lebih future-proof, gunakan tabel `identity_links` (tabel
`identity_links: user_id, provider, external_id, verified_at`) — memudahkan
wa/WhatsApp/klien lain di masa depan tanpa kolom per-provider.

### 4.4 Pairing tutor ↔ Telegram

```text
1. Tutor klik "Hubungkan Telegram" di halaman profil web →
   sistem membuat pairing_code (6 digit, aktif 10 menit, 1x pakai).
2. Tutor kirim /start <kode> ke bot.
3. n8n POST /api/v1/automation/tutor/link
      { pairing_code, telegram_chat_id }
   → sistem memverifikasi kode → menyimpan chat_id (1 chat = 1 tutor,
   unique constraint) → bot membalas "Akun Abi Hanif terhubung ✅".
```

Pemegang kode adalah satu-satunya yang dapat memverifikasi identitas —
tanpa ini siapa pun bisa mengklaim akun tutor di bot.

---

## 5. Workflow n8n (tidak surut — sebagian besar bisa dibuat dari node siap pakai)

### 5.1 Presensi harian

```text
Trigger: Telegram Trigger
└─ Filter: pesan teks/photo/kotak suara
   └─ Resolve tutor: chat_id → tutor_id (cache node)
      ├─ (belum terverifikasi) → pembalasan "akun belum dipairing"
      ├─ teks → LLM Node:
      │     prompt: ekstrak JSON {action?, sessionIdHint?, statuses?:
      │     [{nama_siswa, status}], materi?} — STATIS, tidak mengubah
      │     keputusan
      │   ├──{"action":"status"} → 1. snapshot sesi hari ini
      │   ├──{"action":"lapor"} → 2. map nama → studentId
      │   │   (disambiguasi manual oleh sistem jika ambigu: "<nama Sub 2> =?",
      │   │    jangan ditebak)
      │   ├──{"aksi":"foto"} → 3. unduh file Telegram (max 20MB)
      │   │   → 4. kompresi/validasi server → storage
      │   └──{"aksi":"kirim"} → 5. POST submit (idempotent)
      └─ pembalasan ke tutor: ringkasan penyimpanan yang valid + "sisa sesi
          hari ini" atau peringatan window/duplikasi
```

Catatan `n8n AI-Agent`/`AI-Chain`: gunakan LLM untuk *parsing* saja —
jangan izinkan tools yang memanggil API tulisan kecuali lewat lokasi
"netral" dengan Zod final di sistem (HttpHookNode → /submit).

### 5.2 Notifikasi & rekap

```text
Schedule Trigger (n8n)
├─ 06:00 → kirim pengingat jadwal hari ini ke setiap tutor yang
│          memiliki sesi
├─ 22:00 → rekap presensi (siapa belum absen) → ke chat management
└─ Mingguan → export rcap presensi/payroll → Spreadsheets (satu arah)
```

---

## 6. Pola Komunikasi Bot (Draf copy)

```text
Tutor:  /status
Bot:    📅 Senin, 2 Okt — 2 sesi:
        1. 16:00–17:00 Reguler · Alghazy (P3/8) — ⏳ belum absen
        2. 17:15–18:15 Privat · Najwa (P5/8) — ✅ tersimpan 18:20

Tutor:  alghazy hadir, materi: bangun datar sisi kubus
Bot:    ✅ Sesi 1 tersimpan.
        Alghazy — Hadir (P3/8) · Materi: bangun datar sisi kubus
        📎 Foto belum ada — kirim agar presensi menempel sempurna.

Tutor:  [mengirim foto]
Bot:    📸 Foto sesi 1 tersimpan. Presensi lengkap ✅
```

Aturan penting di reply: selalu balas dengan **ucapan yang menanyakan apa
yang belum lengkap** (foto wajib, murid yang belum dispesifikasi), dan
tolak dengan pesan yang berarti — bukan error mentah DB
(AGENTS.md §27).

---

## 7. Rencana Implementasi Bertahap

### Fase 0 — Fondasi (prasyarat, kecil)
1. Tabel `api_keys` + auth middleware untuk jalur automation.
2. Endpoint `snapshot` + `submit` automation (reuse service yang sama dengan web).
3. Tabel `audit_logs` kolom `source`.
4. Feature flag env: `AUTOMATION_ENABLED` (matikan cepat jika ada masalah).

### Fase 1 — MVP Text-First (tanpa LLM!)
1. Pairing chat (tabel identity_links atau kolom tutors).
2. Bot memplot preset-sakti: `/absen 1 semua hadir` — mapping berbasis
   nomor urut sesi hari ini (deterministik, LLM diabaikan dulu).
3. Reply rekap. Foto dipaksa tetap via web (tahap MVP).
4. Ukur: % presensi yang bisa selesai lewat bot, kecepatan rekam.

### Fase 2 — LLM & Foto
1. LLM node untuk bahasa bebas (parse → JSON → payload web sama).
2. Foto: unduh Telegram → upload via endpoint automation.
3. Idempotency submit + guard duplikasi web vs bot.

### Fase 3 — Sinkronisasi Manajemen & Spreadsheets
1. Schedule rekap (harian/mingguan) ke grup chat management (bila ada).
2. Ekspor Spreadsheets satu arah (pilihan: Apps Script menarik dari API,
   atau Apps Script menulis bak ke sheet).
3. Peringatan bila ada sesi yang belum diabsen menjelang `window` tutup.

### Fase 4 — Pola lanjutan (opsional, tawarkan yap risiko dulu)
1. Voice note → transkrip (Whisper) → LLM parse.
2. Workflow "Mint a Koreksi di Telegram" (tutor menyatakan kesalahan →
   manajeman menerima notifikasi → koreksi tetap di UI web dengan audit).
3. Laporan harian LLM-summarized per murid (progress report draft) —
   masih draft, finalisasi tetap manual.

---

## 8. Risiko & Mitigasi

| # | Risiko | Dampak | Mitigation |
|---|---|---|---|
| R1 | Double-entry presensi (web vs bot) session sama | Histori & honor salah | Idempotency key + uniqueness (1 attendance per student per session) + reply "sudah tercatat" |
| R2 | LLM menebak nama/id murid salah | Presensi salah orang | Nama → ID mapping oleh sistem; ambigu → minta klarifikasi, tidak auto-map |
| R3 | Rp honor di bot tidak sinkron | Tutor keliru menuntut | Honor tidak dihitung di n8n/LLM; hanya baca hasil server |
| R4 | Foto Telegram turun mutu/kualitas | Bukti absensi buruk | n8n unduh `telegram file` full-res; kompresi di server (bukan client) |
| R5 | Key API bocor / dibocorkan | Penulisan data tidak sah | hash+prefix, scopes, rotasi, `last_used_at`, revoke, audit source |
| R6 | Bot di-share grup/pindah chat_id | Penulisan oleh pengguna yang salah | 1 chat_id = 1 tutor (unique), re-pairing wajib, verifikasi kode |
| R7 | Spreadsheet menjadi "dua besaran" | Data management membingungkan | Timestamp & footer "sumber: sistem" + link ke sistem |
| R8 | n8n turun | Fitur automation mati | Web fallback tetap fungsional; alert uptime ke management |

---

## 9. Keputusan Terbuka (Minta keputusan sebelum implementasi)

1. **Apakah foto melalui Telegram boleh menggantikan wajib foto web saat ini?**
   (opini: ya, setara — tapi aturan `foto wajib` tetap, salurannya bebas.)
2. **Group chat per manajemen?** Butuh izin grup + chat management ≥ 2;
  atau cukup 1:1 dulu? (opini awal: 1:1 dulu, grup = Fase 3.)
3. **Spreadsheet apa tujuan yang sebenarnya?** Bila tujuan "laporan mudah
   dibaca", mungkin cukup UI Reports + export CSV dari sistem (tanpa
   spreadsheet langsung) — pot less moving parts.
4. **LLM provider mana & biaya?** Ganti ke model pas (papernya besar dari
   chat; gunakan model kecil/local untuk parser JSON sederhana).
5. **Apakah bot harus punya kemampuan membuka iste yang ditolak untuk
   menulis absen (dispensasi), atau false-safe?** (rekomendasi: false-safe —
   dispensasi tetap manual oleh manajemen.)

---

## 10. Ringkasan

Automation ini bukan "menggantikan sistem" — dia "memperluas cara jalan masuk
(data entry)" sambil menjaga sistem ini sebagai otak bisnis. Urutan kerja
terbaik: **Fondasi API-key dulu, MVP text deterministic dulu, LLM & foto
kemudian, manajemen/spreadsheet terakhir.** Dengan begitu setiap lenguaje
baru yang ditambahkan selalu tunduk pada satu set aturan yang sama
(validasi, window, audit, payroll) dengan jalur web yang telah diproven.


---

## 11. Kebutuhan Infrastruktur

| # | Komponen | Kebutuhan | Catatan / Estimasi biaya |
|---|---|---|---|
| 1 | Sistem existing (Next.js) | Vercel/Fly + Supabase | Sudah ada; tambah route '/api/v1/automation/*', tidak butuh infra baru |
| 2 | n8n | Self-host VPS 2GB RAM (Hetzner/DigitalOcean ≈ USD12–18/bulan) atau n8n Cloud (≈ EUR24/bulan) | Self-host lebih murah & data tetap di kontrol; wajib volume persisten (workflow/state) — bisa memakai Postgres Supabase project terpisah |
| 3 | Domain + HTTPS (reverse proxy) | 1 subdomain, mis. automation.<domain>, Caddy/Nginx via Docker | Wajib HTTPS: webhook Telegram & API key dikirim via header |
| 4 | Telegram Bot | Gratis — token dari @BotFather | Tanpa server khusus; webhook menunjuk ke n8n |
| 5 | LLM Provider | API key OpenAI/Gemini/DeepSeek | Untuk parsing text→JSON; model kecil cukup (≈ USD1–5/bulan pada volume ini); hemat bila pakai model kecil/local (Ollama) |
| 6 | Google Cloud Project + service account (Sheets) | Gratis; OAuth atau service account key | Untuk mirror export ke Google Sheets (Fase 3) |
| 7 | Object storage foto Telegram | Tetap Supabase Storage (sudah ada) | n8n hanya membawa file, tidak menyimpan permanen |
| 8 | Monitoring/uptime | UptimeRobot/Better Stack free tier + health endpoint '/healthz' di n8n | Alert uptime ke management bila workflow mati |
| 9 | Secret management | Env vars / credentials store bawaan n8n — TIDAK di-hardcode dalam workflow JSON | Key API sistem, BotFather token, LLM key |
| 10 | Backup | Supabase otomatis; n8n: ekspor workflow JSON ke repo/Supabase Storage mingguan | n8n self-host memiliki SQLite/volume yang wajib di-backup |

### 11.1 Yang TIDAK dibutuhkan

- Redis/queue tambahan (volume transaksi kecil).
- Kubernetes/Docker swarm (single VPS cukup).
- Server 'automation' di dalam Next.js — semua orkestrasi berada di n8n.

### 11.2 Estimasi biaya bulanan

- Fase 0–1 (tanpa LLM): ≈ USD15–20/bulan (VPS saja).
- Fase 2+ (dengan LLM): ≈ USD18–30/bulan (VPS + model kecil).
- Alternatif n8n Cloud: mulai ≈ EUR24/bulan tanpa perawatan VPS.
