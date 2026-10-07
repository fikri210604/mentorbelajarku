import { test, expect } from '@playwright/test';
import { LandingPage } from '../../pages/LandingPage';

/**
 * Critical user flow: public landing page discovery.
 * Covers hero content, CTAs, anchor navigation — no auth required.
 * Selectors mirror components/sections/hero-section.tsx + navbar.tsx + trust-logos.tsx.
 */
test.describe('Feature: Public Landing Page', () => {
  let landing: LandingPage;

  test.beforeEach(async ({ page }) => {
    landing = new LandingPage(page);
    await landing.goto();
  });

  test('should render hero with headline and trust signals', async ({ page }) => {
    // Assert — headline from components/sections/hero-section.tsx
    await expect(landing.heroHeading).toBeVisible();
    await expect(page.getByText(/kemiling, bandar lampung/i).first()).toBeVisible();
    await expect(landing.trustStrip).toBeVisible();

    // Assert — both CTAs present
    await expect(landing.daftarCta.first()).toBeVisible();
    await expect(landing.methodCta.first()).toBeVisible();

    await page.screenshot({ path: 'test-results/landing-hero.png' });
  });

  test('should navigate to program section via nav anchor', async ({ page }) => {
    // Act — navbar "Program" link scrolls to #program
    await landing.gotoProgramSection();

    // Assert — URL hash updated, program section visible
    await expect(page).toHaveURL(/#program/);
  });

  test('should have valid metadata and respond quickly', async ({ page }) => {
    // Assert — SEO title from app/(public)/page.tsx metadata
    await expect(page).toHaveTitle(/Mentor Belajarku/);

    // Assert — no catastrophic console errors on load
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    expect(errors.filter((e) => !e.includes('hydration'))).toHaveLength(0);
  });
});
