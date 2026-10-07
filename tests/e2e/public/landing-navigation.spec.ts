import { test, expect } from '@playwright/test';
import { LandingPage } from '../../pages/LandingPage';

/**
 * Public navigation journeys: anchor CTAs, WhatsApp entry points, health endpoint.
 * No auth required — safe to run in any environment (no data mutation).
 * The landing has no login link; conversion goes through WhatsApp CTAs (navbar.tsx,
 * hero-section.tsx) and anchor navigation (#program, #metode).
 */
test.describe('Feature: Landing Navigation', () => {
  let landing: LandingPage;

  test.beforeEach(async ({ page }) => {
    landing = new LandingPage(page);
    await landing.goto();
  });

  test('should navigate to method section via hero secondary CTA', async ({ page }) => {
    // Act — "Kenali Metode Kami" anchor scrolls to #metode (teaching-method-section.tsx)
    await landing.gotoMethodSection();

    // Assert — hash updated
    await expect(page).toHaveURL(/#metode/);
  });

  test('should navigate to program section via navbar link', async ({ page }) => {
    // Act — navbar "Program" anchor scrolls to #program (program-section.tsx)
    await landing.gotoProgramSection();

    // Assert — hash updated
    await expect(page).toHaveURL(/#program/);
  });

  test('should expose WhatsApp registration CTA with external link', async ({ page }) => {
    // Assert — "DAFTAR SEKARANG !" opens WhatsApp in a new tab (never navigates away)
    const cta = landing.daftarCta.first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('target', '_blank');
    const href = await cta.getAttribute('href');
    expect(href).toMatch(/whatsapp\.com|wa\.me/);

    await page.screenshot({ path: 'test-results/landing-cta.png' });
  });

  test('should return ok from health endpoint', async ({ request }) => {
    // Act
    const res = await request.get('/api/health');

    // Assert — health route returns { status: "ok" }
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});
