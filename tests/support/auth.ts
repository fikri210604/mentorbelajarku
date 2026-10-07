import { expect, type Page } from '@playwright/test';

/**
 * Kredensial seed dari supabase/seed-auth.ts (jangan diubah di test).
 * - owner: admin@mentorbelajarku.com / manajemen123
 * - tutor: fara@mentorbelajarku.com / mentor123
 * Override via env E2E_OWNER_EMAIL / E2E_TUTOR_EMAIL bila perlu.
 */
export const TEST_USERS = {
  owner: {
    email: process.env.E2E_OWNER_EMAIL || 'admin@mentorbelajarku.com',
    password: process.env.E2E_OWNER_PASSWORD || 'manajemen123',
    expectedPortal: '/management/dashboard' as const,
  },
  tutor: {
    email: process.env.E2E_TUTOR_EMAIL || 'fara@mentorbelajarku.com',
    password: process.env.E2E_TUTOR_PASSWORD || 'mentor123',
    expectedPortal: '/tutor/dashboard' as const,
  },
} as const;

export type TestRole = keyof typeof TEST_USERS;

/** Login via UI (/login) lalu tunggu redirect portal sesuai role. */
export async function loginAs(page: Page, role: TestRole) {
  const user = TEST_USERS[role];
  await page.context().clearCookies();
  await page.goto('/login');
  await page.locator('#email').waitFor({ state: 'visible', timeout: 20_000 });
  await page.locator('#email').fill(user.email);
  await page.locator('#password').fill(user.password);
  await page.getByRole('button', { name: /masuk|memverifikasi/i }).click();
  // LoginPage.tsx: sukses -> window.location.href = callbackUrl || '/dashboard',
  // lalu (private)/dashboard/page.tsx redirect ke portal per role.
  // Timeout longgar: kompilasi Turbopack dingin bisa >30 dtk untuk 2 redirect berantai.
  await expect(page).toHaveURL(new RegExp(user.expectedPortal.replace(/\//g, '\\/')), {
    timeout: 120_000,
  });
  await page.waitForLoadState('domcontentloaded');
}

/** Logout via API route lalu pastikan mendarat di /login?logged_out=true. */
export async function logout(page: Page) {
  await page.goto('/api/v1/auth/logout');
  await expect(page).toHaveURL(/\/login\?logged_out=true/, { timeout: 20_000 });
}

/** Guard halaman terautentikasi: main tampil + tidak ada raw DB error. */
export async function expectHealthyPage(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('main').first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/PostgresError|duplicate key|violates unique|FATAL|panic/i)).toHaveCount(0);
}
