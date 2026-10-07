import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

/**
 * Edge cases around the auth boundary (Better Auth email + password).
 * - /register is disabled by design -> redirects to /login (app/(public)/register/page.tsx)
 * - ?logged_out=true shows an informational notice (LoginPage.tsx)
 * - Invalid email shape is blocked by native validation (never hits payroll/attendance data)
 * - /dashboard bounces unauthenticated users with callbackUrl preserved
 * - Session API returns 401 without a session cookie
 */
test.describe('Feature: Auth Edge Cases', () => {
  test('should redirect disabled register page to login', async ({ page }) => {
    // Act
    await page.goto('/register');

    // Assert — server redirect lands on /login
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
    await expect(page.locator('#email')).toBeVisible();
  });

  test('should show logged-out notice when logged_out param present', async ({ page }) => {
    // Act
    await page.goto('/login?logged_out=true');
    await page.waitForLoadState('domcontentloaded');

    // Assert — informational notice from LoginPage.tsx (middleware clears cookies on this URL)
    await expect(page.getByText(/anda telah keluar.*logout/i)).toBeVisible();
  });

  test('should stay on login when email shape is invalid', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    // Act — native email validation blocks submit for a non-email shape
    await login.emailInput.fill('bukan-email-valid');
    await login.passwordInput.fill('SomePassword123!');
    await login.submitButton.click();

    // Assert — still on login, no inline server alert (browser blocked the submit)
    await expect(page).toHaveURL(/\/login/);
    await expect(login.emailInput).toBeVisible();
  });

  test('should bounce unauthenticated dashboard to login', async ({ page }) => {
    await page.context().clearCookies();

    // Act
    await page.goto('/dashboard');

    // Assert — (private)/layout.tsx requireAuthUser() bounces to plain /login
    // (no callbackUrl: that param is only set by middleware.ts for direct hits
    // on /management/*, /tutor/*, /api/v1/*).
    await expect(page).toHaveURL(/\/login$/, { timeout: 20_000 });
    await expect(page.locator('#email')).toBeVisible();
  });

  test('should return 401 from session API without authentication', async ({ request }) => {
    // Act — no session cookie attached
    const res = await request.get('/api/v1/auth/session');

    // Assert — route returns 401 Unauthorized (app/api/v1/auth/session/route.ts)
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
