import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for the public landing page (/).
 * Selectors map to the real sections in components/sections/:
 * - hero-section.tsx (H1 "Anak Paham Konsep...", CTAs "DAFTAR SEKARANG !" + "Kenali Metode Kami")
 * - navbar.tsx (anchor nav: Program, Metode Belajar, ...)
 * - trust-logos.tsx ("Dipercaya oleh Siswa & Orang Tua ...")
 * Uses semantic selectors (roles/headings/links) — the app has no data-testid yet.
 */
export class LandingPage {
  readonly page: Page;
  readonly heroHeading: Locator;
  readonly daftarCta: Locator;
  readonly methodCta: Locator;
  readonly programNavLink: Locator;
  readonly metodeNavLink: Locator;
  readonly trustStrip: Locator;
  readonly menuToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroHeading = page.getByRole('heading', { name: /anak paham konsep/i });
    this.daftarCta = page.getByRole('link', { name: /daftar sekarang/i });
    this.methodCta = page.getByRole('link', { name: /kenali metode kami/i });
    this.programNavLink = page.getByRole('link', { name: /^program$/i });
    this.metodeNavLink = page.getByRole('link', { name: /metode belajar/i });
    this.trustStrip = page.getByText(/dipercaya oleh siswa & orang tua/i);
    // Hamburger toggle — only rendered visible below the lg breakpoint (navbar.tsx).
    this.menuToggle = page.getByRole('button', { name: /toggle navigation menu/i });
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
    await this.heroHeading.waitFor({ state: 'visible' });
  }

  async gotoProgramSection() {
    // Desktop nav (lg+) shows the link directly; on smaller viewports it lives
    // behind the hamburger menu (navbar.tsx mobile dropdown).
    if (await this.programNavLink.first().isVisible()) {
      await this.programNavLink.first().click();
      return;
    }
    await this.menuToggle.click();
    await this.page
      .locator('header')
      .getByRole('link', { name: /^program$/i })
      .filter({ visible: true })
      .first()
      .click();
  }

  async gotoMethodSection() {
    await this.methodCta.first().click();
  }
}
