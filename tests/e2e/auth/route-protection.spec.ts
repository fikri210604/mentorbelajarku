import { test, expect } from '@playwright/test';

/**
 * Security boundary: unauthenticated users must be bounced to /login.
 * Mirrors middleware.ts rule 4 (private: /management/*, /tutor/*, /api/v1/* except auth).
 */
test.describe('Feature: Route Protection', () => {
  // NOTE: /dashboard is intentionally NOT here — it is bounced to plain /login
  // by (private)/layout.tsx requireAuthUser(), without callbackUrl (see auth-edge spec).
  const privateRoutes = [
    '/management/dashboard',
    '/management/students',
    '/management/tutors',
    '/management/schedules',
    '/management/sessions',
    '/management/attendance',
    '/management/payroll',
    '/tutor/dashboard',
    '/tutor/schedules',
    '/tutor/attendance',
    '/tutor/payroll',
  ];

  for (const route of privateRoutes) {
    test(`should redirect unauthenticated user from ${route} to login`, async ({ page }) => {
      // Use a fresh context state — ensure no session cookies linger.
      await page.context().clearCookies();

      // Act
      await page.goto(route);

      // Assert — middleware redirects to /login?callbackUrl=<route>
      await expect(page).toHaveURL(/\/login\?callbackUrl=/, { timeout: 20_000 });
    });
  }

  test('should include the original path as callbackUrl', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/management/payroll');

    const url = new URL(page.url());
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('callbackUrl')).toBe('/management/payroll');
  });

  test('should allow public routes without redirect', async ({ page }) => {
    await page.context().clearCookies();

    // Act + Assert — landing + login render directly
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should protect private API routes from unauthenticated access', async ({ request }) => {
    // Act — hit a representative private API without session cookie.
    // maxRedirects: 0 so we observe the middleware 307 itself instead of the
    // login page it points to (Playwright follows redirects by default).
    const res = await request.get('/api/v1/management/students', { maxRedirects: 0 });

    // Assert — middleware bounces to /login?callbackUrl=... (the route guard
    // behind it would additionally return 401 JSON; see auth-edge session test).
    expect(res.status()).toBe(307);
    expect(res.headers()['location'] ?? '').toMatch(/\/login\?callbackUrl=/);
  });
});
