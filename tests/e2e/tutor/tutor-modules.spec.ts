import { test, expect } from '@playwright/test';
import { loginAs, expectHealthyPage } from '../../support/auth';

/**
 * Modul Tutor (role tutor fara@mentorbelajarku.com) — read-only.
 * Memastikan portal tutor render + data terisolasi per tutor
 * (tidak ada kebocoran nav management) tanpa mutasi attendance/payroll.
 */
test.describe('Feature: Tutor Modules (tutor)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'tutor');
  });

  const modules: Array<{ route: string; title: RegExp }> = [
    { route: '/tutor/dashboard', title: /Jadwal Mengajar Saya|Selamat (pagi|siang|sore|malam)/i },
    { route: '/tutor/students', title: /Murid Binaan/i },
    { route: '/tutor/schedules', title: /Jadwal Mengajar Saya/i },
    { route: '/tutor/attendance', title: /Presensi|Attendance|Daftar Presensi/i },
    { route: '/tutor/payroll', title: /Rincian Honor per Sesi|Honor|Payroll/i },
    { route: '/tutor/profile', title: /Profil & Keamanan Akun/i },
  ];

  for (const { route, title } of modules) {
    test(`renders ${route}`, async ({ page }) => {
      await page.goto(route);
      await expectHealthyPage(page);
      await expect(page.getByText(title).first()).toBeVisible({ timeout: 20_000 });
    });
  }

  test('tutor nav does not expose management links', async ({ page }) => {
    await page.goto('/tutor/dashboard');
    await expectHealthyPage(page);
    // Sidebar tutor tidak boleh menautkan ke portal management.
    await expect(page.locator('a[href^="/management"]').first()).toHaveCount(0);
  });
});
