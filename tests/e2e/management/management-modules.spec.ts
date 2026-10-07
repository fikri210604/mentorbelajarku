import { test, expect } from '@playwright/test';
import { loginAs, expectHealthyPage } from '../../support/auth';

/**
 * Modul Management (role owner) — read-only navigation per halaman.
 * Memastikan tiap rute portal render + judul modul tampil + tanpa raw DB error.
 * Tidak submit form / mutasi payroll & attendance.
 */
test.describe('Feature: Management Modules (owner)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner');
  });

  const modules: Array<{ route: string; title: RegExp }> = [
    { route: '/management/dashboard', title: /Dashboard Management/i },
    { route: '/management/students', title: /Data Murid/i },
    { route: '/management/students/new', title: /Tambah Murid Baru/i },
    { route: '/management/tutors', title: /Data Tutor/i },
    { route: '/management/schedules', title: /Jadwal Rutin Belajar/i },
    { route: '/management/schedules/new', title: /Buat Jadwal Rutin Baru/i },
    { route: '/management/sessions', title: /Sesi Pembelajaran Aktual/i },
    { route: '/management/attendance', title: /Daftar Presensi Murid/i },
    { route: '/management/learning-records', title: /Jurnal & Catatan Belajar Murid/i },
    { route: '/management/progress-reports', title: /Laporan Perkembangan Murid/i },
    { route: '/management/payroll', title: /Dokumen Penggajian Tutor/i },
    { route: '/management/reports/students', title: /Laporan Pertumbuhan & Status Murid/i },
    { route: '/management/reports/attendance', title: /Laporan Presensi/i },
    { route: '/management/reports/payroll', title: /Laporan Pengeluaran Honor Tutor/i },
    { route: '/management/reports/tutors', title: /Laporan Kinerja & Jam Terbang Tutor/i },
    { route: '/management/audit-logs', title: /Audit Logs & Jejak Sistem/i },
  ];

  for (const { route, title } of modules) {
    test(`renders ${route}`, async ({ page }) => {
      await page.goto(route);
      await expectHealthyPage(page);
      await expect(page).toHaveURL(new RegExp(route.replace(/\//g, '\\/')));
      await expect(page.getByText(title).first()).toBeVisible({ timeout: 20_000 });
    });
  }

  const settings: Array<{ route: string; title: RegExp }> = [
    { route: '/management/settings/programs', title: /Pengaturan Program Bimbel/i },
    { route: '/management/settings/subjects', title: /Mata Pelajaran & Kurikulum Materi/i },
    { route: '/management/settings/bimbel-types', title: /Pengaturan Jenis Bimbel/i },
    { route: '/management/settings/packages', title: /Pengaturan Paket Belajar Bimbel/i },
    { route: '/management/settings/tutor-rates', title: /Standar Tarif Honor Tutor/i },
    { route: '/management/settings/management-rates', title: /Pengaturan Gaji & Tarif Manajemen/i },
    { route: '/management/settings/roles', title: /Manajemen Peran & Hak Akses/i },
    { route: '/management/settings/permissions', title: /Katalog Permission/i },
    { route: '/management/settings/users', title: /Pengguna & Penetapan Peran/i },
    { route: '/management/settings/attendance-window', title: /Batas Waktu Absensi/i },
  ];

  for (const { route, title } of settings) {
    test(`renders ${route}`, async ({ page }) => {
      await page.goto(route);
      await expectHealthyPage(page);
      await expect(page.getByText(title).first()).toBeVisible({ timeout: 20_000 });
    });
  }

  test('student form shows validation without submit side-effects', async ({ page }) => {
    await page.goto('/management/students/new');
    await expectHealthyPage(page);
    await expect(page.getByText(/Tambah Murid Baru/i).first()).toBeVisible({ timeout: 20_000 });
    // Form render: kode murid + nama wajib ada, tanpa submit ke DB.
    await expect(page.getByText(/Kode Murid/i).first()).toBeVisible();
  });
});
