import { test, expect } from '@playwright/test';
import { loginAs, logout, expectHealthyPage } from '../../support/auth';

/**
 * Authenticated login memakai akun seeder supabase/seed-auth.ts.
 * - owner (admin@mentorbelajarku.com) -> /management/dashboard
 * - tutor (fara@mentorbelajarku.com) -> /tutor/dashboard
 * Read-only selain login/logout; tidak menyentuh data bisnis.
 */
test.describe('Feature: Authenticated Login (seed accounts)', () => {
  test('owner login lands on management dashboard', async ({ page }) => {
    await loginAs(page, 'owner');

    await expectHealthyPage(page);
    await expect(page.getByText('Dashboard Management').first()).toBeVisible({ timeout: 20_000 });
  });

  test('tutor login lands on tutor dashboard', async ({ page }) => {
    await loginAs(page, 'tutor');

    await expectHealthyPage(page);
    // TutorDashboardPage greeting + jadwal mengajar
    await expect(page.getByText(/Jadwal Mengajar Saya|Selamat (pagi|siang|sore|malam)/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('logout returns to login with logged_out notice', async ({ page }) => {
    await loginAs(page, 'owner');
    await logout(page);

    await expect(page.getByText(/anda telah keluar.*logout/i)).toBeVisible({ timeout: 20_000 });
  });

  test('tutor cannot open management portal (cross-portal guard)', async ({ page }) => {
    await loginAs(page, 'tutor');

    await page.goto('/management/dashboard');
    // requireRoleUser() redirect ke /dashboard?error=forbidden lalu ke portal tutor
    await expect(page).toHaveURL(/\/(dashboard|tutor\/dashboard)(\?error=forbidden)?/, { timeout: 20_000 });
    await expect(page).not.toHaveURL(/\/management\/dashboard/);
  });

  test('management can open tutor portal (dual-role by design)', async ({ page }) => {
    await loginAs(page, 'owner');

    // app/(private)/(tutor)/layout.tsx: role management & admin diizinkan (Dual-Role).
    await page.goto('/tutor/dashboard');
    await expect(page).toHaveURL(/\/tutor\/dashboard/, {
      timeout: 20_000,
    });
    await expectHealthyPage(page);
  });
});
