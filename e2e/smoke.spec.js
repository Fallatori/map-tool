import { expect, test } from '@playwright/test';

test('loads app and applies hemisphere filter', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'GeoGuessr Helper' })).toBeVisible();
  await page.getByLabel('Hemisphere').selectOption('south');

  const matchCount = page
    .locator('p')
    .filter({ hasText: /countries match\.$/ })
    .locator('strong')
    .first();

  await expect(matchCount).toBeVisible();
  const count = Number.parseInt((await matchCount.textContent()) ?? '0', 10);
  expect(Number.isNaN(count)).toBe(false);
  expect(count).toBeGreaterThan(0);
});
