import { test, expect } from '@playwright/test';
import { loginAs, expectHealthyPage } from '../../support/auth';
import { cleanupE2EFlow, closeE2EPool } from '../../support/e2e-db';

/**
 * FLOW UTUH: jadwal → sesi → absensi tutor (UI) → rekap → honor vs konfigurasi.
 *
 * Isolasi: memakai murid khusus berkode E2E-* (dibuat + dihapus dalam test ini).
 * Tidak menyentuh murid riil. Payroll yang dibuat hanya DRAFT lalu dihapus.
 * Foto memakai fixture kecil tests/fixtures/e2e-photo.png via "Pilih dari Galeri".
 *
 * Prasyarat: akun seed (admin + fara) + master data seed (program, bimbel_types, tutor_rates).
 */

const RUN = `E2E-${Date.now().toString(36).toUpperCase()}`;
const STUDENT_CODE = RUN.slice(0, 20);
const STUDENT_NAME = `Murid ${RUN}`;
const PHOTO_FIXTURE = 'tests/fixtures/e2e-photo.png';
const ANY_LEVEL = 'Semua Jenjang';

// ---- WIB helpers (server memakai konvensi WIB) ----
function wibParts(d = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getDay(),
  };
}

function plusMinutes(h: number, m: number, add: number) {
  const t = h * 60 + m + add;
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

interface FlowState {
  programId: string;
  programName: string;
  programLevel: string;
  regulerTypeId: string;
  tutorId: string;
  tutorName: string;
  expectedRate: number;
  studentId: string;
  scheduleId: string;
  sessionId: string;
  startHM: string;
  today: string;
  paymentId?: string;
}

const S: Partial<FlowState> = {};

function unwrap(body: unknown): any {
  if (Array.isArray(body)) return body;
  const b = body as { data?: unknown };
  return b?.data ?? body;
}

test.describe.serial('Flow: Jadwal → Absensi → Rekap → Honor (E2E isolasi)', () => {
  test.afterAll(async () => {
    const res = await cleanupE2EFlow(RUN);
    console.log(`[e2e-cleanup ${RUN}]`, JSON.stringify(res));
    await closeE2EPool();
  });

  test('1. owner: baca konfigurasi + buat murid, jadwal, dan sesi hari ini', async ({ page }) => {
    test.setTimeout(180_000);
    await loginAs(page, 'owner');
    const api = page.request;

    // --- Konfigurasi: program Matematika + jenis Reguler ---
    const programs = unwrap(await (await api.get('/api/v1/management/programs')).json());
    const program = programs.find((p: any) => p.name === 'Matematika' && p.status !== 'inactive');
    expect(program, 'program Matematika harus ada di seed').toBeTruthy();

    const types = unwrap(await (await api.get('/api/v1/management/bimbel-types')).json());
    const reguler = types.find((t: any) => t.name === 'Reguler');
    expect(reguler, 'bimbel_types Reguler harus ada').toBeTruthy();

    // --- Tutor Umi Fara + tarif konfigurasinya ---
    const tutors = unwrap(await (await api.get('/api/v1/management/tutors')).json());
    const tutor = tutors.find((t: any) => t.profiles?.full_name === 'Umi Fara' && t.status === 'active');
    expect(tutor, 'tutor Umi Fara (seed) harus aktif').toBeTruthy();

    const today = wibParts().date;
    const programLevel = program.level || ANY_LEVEL;
    const rateOf = (rates: any[]) =>
      rates
        .filter(
          (r: any) =>
            (r.bimbel_types?.name === 'Reguler' || r.bimbel_type_id === reguler.id) &&
            (r.level === programLevel || r.level === ANY_LEVEL) &&
            r.effective_from <= today &&
            (!r.effective_until || r.effective_until >= today)
        )
        .sort((a: any, b: any) => {
          if (a.level !== b.level) return a.level === programLevel ? -1 : 1;
          return a.effective_from < b.effective_from ? 1 : -1;
        })[0];

    let expected = rateOf(tutor.tutor_rates ?? []);
    if (!expected) {
      const allRates = unwrap(await (await api.get('/api/v1/management/tutor-rates')).json());
      expected = rateOf((allRates ?? []).filter((r: any) => !r.tutor_id));
    }
    expect(expected, 'tarif Reguler untuk tutor harus terkonfigurasi').toBeTruthy();
    const expectedRate = Number(expected.rate_per_student);
    expect(expectedRate).toBeGreaterThan(0);

    // --- Murid E2E (otomatis membuat enrollment Reguler aktif, max 12) ---
    const stuRes = await api.post('/api/v1/management/students', {
      data: {
        studentCode: STUDENT_CODE,
        name: STUDENT_NAME,
        level: 'SD',
        grade: '4',
        bimbelType: 'Reguler',
        programId: program.id,
        status: 'active',
      },
    });
    const stuBody = await stuRes.json();
    expect(stuRes.status(), `buat murid gagal: ${JSON.stringify(stuBody)}`).toBe(201);
    const studentId: string = unwrap(stuBody).id;
    expect(studentId).toBeTruthy();

    // --- Jadwal hari ini, mulai +12 mnt (lolos tolak-slot-lewat & jendela absensi) ---
    const now = wibParts();
    test.skip(now.hour === 23 && now.minute > 40, 'terlalu dekat tengah malam WIB untuk slot hari ini');
    const startHM = plusMinutes(now.hour, now.minute, 12);
    const schedRes = await api.post('/api/v1/management/schedules', {
      data: {
        tutorId: tutor.id,
        programId: program.id,
        studentIds: [studentId],
        dayOfWeek: now.weekday,
        startTime: startHM,
        endTime: plusMinutes(now.hour, now.minute, 12 + 60),
        location: 'Ruang E2E',
        notes: `E2E flow ${RUN}`,
        status: 'active',
        targetMaterial: `E2E Materi ${RUN}`,
      },
    });
    const schedBody = await schedRes.json();
    expect(schedRes.status(), `buat jadwal gagal: ${JSON.stringify(schedBody)}`).toBe(201);
    const scheduleId: string = unwrap(schedBody).id ?? unwrap(schedBody).schedule?.id;
    expect(scheduleId).toBeTruthy();

    // --- Generate sesi hari ini untuk jadwal tersebut ---
    const genRes = await api.post('/api/v1/management/sessions/generate', {
      data: { targetDate: today, scheduleId },
    });
    const genBody = await genRes.json();
    expect(genRes.ok(), `generate sesi gagal: ${JSON.stringify(genBody)}`).toBe(true);

    const sessRes = await api.get(`/api/v1/management/schedules/${scheduleId}/sessions`);
    const sessList = unwrap(await sessRes.json());
    const session = (Array.isArray(sessList) ? sessList : []).find(
      (s: any) => s.session_date === today && s.status !== 'cancelled'
    );
    expect(session, 'sesi hari ini harus terbentuk dari jadwal').toBeTruthy();

    Object.assign(S, {
      programId: program.id,
      programName: program.name,
      programLevel,
      regulerTypeId: reguler.id,
      tutorId: tutor.id,
      tutorName: 'Umi Fara',
      expectedRate,
      studentId,
      scheduleId,
      sessionId: session.id,
      startHM,
      today,
    } satisfies FlowState);
  });

  test('2. tutor: absensi via UI (foto galeri + tandai hadir + submit)', async ({ page }) => {
    test.setTimeout(180_000);
    expect(S.sessionId, 'prasyarat sesi E2E').toBeTruthy();
    await loginAs(page, 'tutor');
    await page.goto('/tutor/attendance');
    await expectHealthyPage(page);

    // Generate dari UI bila sesi belum tampil (tombol ada saat tidak ada sesi).
    const generateBtn = page.getByRole('button', { name: /Muat Sesi Hari Ini dari Jadwal/i });
    if (await generateBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await generateBtn.click();
      await expect(page.getByText(/Sesi berhasil dimuat|Berhasil membuat/i).first()).toBeVisible({
        timeout: 30_000,
      }).catch(() => undefined);
    }

    // Pilih kartu sesi E2E (jam mulai + nama program).
    const card = page
      .locator('button', { hasText: S.programName! })
      .filter({ hasText: S.startHM! })
      .first();
    await expect(card, 'kartu sesi E2E harus tampil di halaman tutor').toBeVisible({ timeout: 30_000 });
    await card.click();

    // Step 1 → Step 2 foto.
    await page.getByRole('button', { name: /Lanjut: Foto Sesi/i }).click();
    await page.setInputFiles('#photoUploadInput', PHOTO_FIXTURE);
    // Tunggu kompresi client selesai (dropzone hilang).
    await expect(page.locator('#photoUploadInput')).toBeHidden({ timeout: 30_000 });

    // Step 2 → Step 3 presensi.
    await page.getByRole('button', { name: /Lanjut: Presensi/i }).click();
    await expect(page.getByText(STUDENT_NAME).first()).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /Tandai Semua Hadir/i }).click();

    // Submit + konfirmasi.
    await page.getByRole('button', { name: /Simpan Presensi Sesi/i }).click();
    await expect(page.getByText('Konfirmasi Simpan Presensi Sesi').first()).toBeVisible({
      timeout: 10_000,
    });
    // Dialog merangkum 1 Hadir + foto terlampir.
    await expect(page.getByText(/1 Hadir/i).first()).toBeVisible();
    await expect(page.getByText(/1 Foto Sesi Terlampir/i).first()).toBeVisible();
    await page.getByRole('button', { name: /Ya, Simpan Presensi Sesi/i }).click();

    await expect(page.getByText(/Presensi .* berhasil disimpan/i).first()).toBeVisible({
      timeout: 60_000,
    });
  });

  test('3. management: rekap absensi + honor sesuai tarif konfigurasi', async ({ page }) => {
    test.setTimeout(180_000);
    expect(S.sessionId, 'prasyarat sesi E2E').toBeTruthy();
    await loginAs(page, 'owner');
    const api = page.request;

    // --- Rekap 1: histori murid mencatat P1 present ---
    const hist = unwrap(await (await api.get(`/api/v1/management/students/${S.studentId}/history`)).json());
    const histRow = (Array.isArray(hist) ? hist : []).find(
      (h: any) => h.session_id === S.sessionId || h.id === S.sessionId
    );
    expect(histRow, 'histori murid harus memuat sesi E2E').toBeTruthy();
    expect(histRow.status ?? histRow.attendance_status).toMatch(/present|late/);
    const meetingCode = histRow.meeting_code ?? (histRow.meeting_number ? `P${histRow.meeting_number}` : undefined);
    expect(meetingCode, 'pertemuan pertama paket harus P1').toBe('P1');

    // --- Rekap 2: daftar absensi memuat murid E2E ---
    const atts = unwrap(await (await api.get('/api/v1/management/attendance')).json());
    const attRow = (Array.isArray(atts) ? atts : []).find(
      (a: any) => a.session_id === S.sessionId && a.student_id === S.studentId
    );
    expect(attRow, 'attendance sesi E2E harus tercatat').toBeTruthy();
    expect(attRow.status).toMatch(/present|late/);
    expect(attRow.photo_path, 'foto presensi wajib tersimpan sebagai path').toBeTruthy();

    // --- Rekap 3: laporan kehadiran via UI memuat murid E2E ---
    await page.goto('/management/reports/attendance');
    await expectHealthyPage(page);
    await expect(page.getByText(STUDENT_NAME).first()).toBeVisible({ timeout: 30_000 });

    // --- Honor: generate DRAFT periode hari ini & cocokkan tarif ---
    const payRes = await api.post('/api/v1/management/payroll/generate', {
      data: { tutorId: S.tutorId, periodStart: S.today, periodEnd: S.today },
    });
    const payBody = await payRes.json();
    expect(payRes.status(), `generate payroll gagal: ${JSON.stringify(payBody)}`).toBe(201);
    const paymentId: string = unwrap(payBody).id;
    expect(paymentId).toBeTruthy();
    S.paymentId = paymentId;

    const det = unwrap(
      await (await api.get(`/api/v1/management/payroll/${paymentId}`)).json()
    );
    const items: any[] = det.items ?? det.tutor_payment_items ?? [];
    const ours = items.find((i: any) => i.session_id === S.sessionId);
    expect(ours, 'payroll harus memuat item sesi E2E').toBeTruthy();
    expect(Number(ours.rate_applied ?? ours.rate), 'rate item = tarif konfigurasi').toBe(S.expectedRate);
    expect(Number(ours.amount ?? ours.subtotal), 'amount = rate × 1 murid').toBe(S.expectedRate!);
    const gross = Number(det.gross_amount);
    const sum = items.reduce((a: number, i: any) => a + Number(i.amount ?? i.subtotal ?? 0), 0);
    expect(gross, 'gross = jumlah seluruh item').toBe(sum);
    expect(Number(det.net_amount), 'net = gross tanpa bonus/potongan').toBe(gross);
    expect(det.status, 'payroll test tetap draft').toBe('draft');

    // --- UI payroll menampilkan draft untuk tutor ---
    await page.goto('/management/payroll');
    await expectHealthyPage(page);
    await expect(page.getByText(S.tutorName!).first()).toBeVisible({ timeout: 30_000 });
  });
});
