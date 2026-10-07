import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for /login (Better Auth email + password form).
 * Selectors map to features/auth/components/LoginPage.tsx:
 * - #email, #password, submit button "Masuk" / "Memverifikasi..."
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly title: Locator;
  readonly togglePasswordVisibility: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.getByRole('button', { name: /masuk|memverifikasi/i });
    // NOTE: shadcn CardTitle renders a <div>, not a heading — use text locator.
    this.title = page.getByText('Mentor Belajarku', { exact: true }).first();
    this.togglePasswordVisibility = page.getByRole('button', {
      name: /tampilkan kata sandi|sembunyikan kata sandi/i,
    });
  }

  async goto(callbackUrl?: string) {
    const url = callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login';
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
    await this.emailInput.waitFor({ state: 'visible' });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async errorAlert() {
    // Destructive alert rendered on validation / auth failure.
    return this.page.locator('[role="alert"]').first();
  }
}
