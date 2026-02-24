import { expect, test } from '@playwright/test';

test('loads app and applies hemisphere filter', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'GeoGuessr Helper' })).toBeVisible();
  await page.getByLabel('Hemisphere').selectOption('south');

  await expect(page.locator('li', { hasText: 'Australia' }).first()).toBeVisible();
  await expect(page.locator('li', { hasText: 'Brazil' }).first()).toBeVisible();
});
