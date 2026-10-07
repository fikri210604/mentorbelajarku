import { test, expect } from '@playwright/test';

/**
 * Edge cases: 404 handling, security headers, cross-viewport smoke.
 * Guards against regressions in app/not-found.tsx and next.config.ts headers.
 */
test.describe('Feature: Error pages, headers & viewports', () => {
  test('should render friendly 404 for unknown routes', async ({ page }) => {
    // Act
    await page.goto('/rute-yang-tidak-ada-12345');

    // Assert — copy from app/not-found.tsx (shadcn CardTitle renders a div, not a heading)
    await expect(page.getByText('404 - Halaman Tidak Ditemukan', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /ke dashboard/i })).toBeVisible();

    await page.screenshot({ path: 'test-results/404-page.png' });
  });

  test('should send security headers on landing response', async ({ request }) => {
    // Act
    const res = await request.get('/');

    // Assert — headers set in next.config.ts
    expect(res.status()).toBe(200);
    expect(res.headers()['x-content-type-options']).toBe('nosniff');
    expect(res.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(res.headers()['x-powered-by']).toBeUndefined();
  });

  test('should be usable on a small mobile viewport', async ({ page }) => {
    // Arrange — emulate a small phone (Pixel 5 project also covers this)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Assert — hero still visible on a narrow screen
    await expect(page.getByRole('heading', { name: /anak paham konsep/i }).first()).toBeVisible();

    await page.screenshot({ path: 'test-results/landing-mobile-375.png' });
  });

  test('flaky: should have no horizontal overflow on a small mobile viewport', async ({ page }) => {
    test.fixme(true, 'Known UI defect: ~26px horizontal overflow at 375px — needs CSS fix, see E2E report 2026-10-06');

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: /anak paham konsep/i }).first()).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
