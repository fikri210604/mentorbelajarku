import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

/**
 * Critical user flow: authentication (Better Auth email + password).
 * Uses intentionally-invalid credentials — never touches real payroll/attendance data.
 */
test.describe('Feature: Login', () => {
  let login: LoginPage;

  test.beforeEach(async ({ page }) => {
    login = new LoginPage(page);
    await login.goto();
  });

  test('should render login form with email and password fields', async ({ page }) => {
    // Assert — branding + form controls from LoginPage.tsx
    await expect(login.title).toBeVisible();
    await expect(login.emailInput).toBeVisible();
    await expect(login.passwordInput).toBeVisible();
    await expect(login.submitButton).toBeVisible();
    await expect(page.getByText(/portal manajemen & sistem presensi/i)).toBeVisible();

    await page.screenshot({ path: 'test-results/login-form.png' });
  });

  test('should show validation error when submitting empty form', async ({ page }) => {
    // Act — submit without filling. Inputs carry `required`, so native browser
    // validation blocks the submit and handleLogin never fires.
    await login.submitButton.click();

    // Assert — still on login, email flagged as value-missing by the browser
    await expect(page).toHaveURL(/\/login/);
    const valueMissing = await login.emailInput.evaluate(
      (el) => (el as HTMLInputElement).validity.valueMissing
    );
    expect(valueMissing).toBe(true);
  });

  test('should toggle password visibility', async ({ page }) => {
    // Assert — starts hidden
    await expect(login.passwordInput).toHaveAttribute('type', 'password');

    // Act — toggle on/off
    await login.togglePasswordVisibility.click();
    await expect(login.passwordInput).toHaveAttribute('type', 'text');
    await login.togglePasswordVisibility.click();
    await expect(login.passwordInput).toHaveAttribute('type', 'password');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Act — attempt login with a guaranteed-nonexistent account.
    // Browser validation requires a valid email shape; wrong password triggers server error.
    await login.login('e2e-nonexistent-user@example.com', 'WrongPassword123!');

    // Assert — either inline error alert OR still on login (loading -> error).
    // Better Auth may take a few seconds; wait for alert or URL stability.
    const alert = page.locator('[role="alert"]').first();
    await expect(alert).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('should preserve callbackUrl through login page', async ({ page }) => {
    // Act — visit login with callback param (as middleware sets on redirect)
    await login.goto('/management/dashboard');

    // Assert — still on login, callbackUrl retained in URL
    await expect(page).toHaveURL(/\/login\?callbackUrl=/);
    await expect(login.emailInput).toBeVisible();
  });
});
