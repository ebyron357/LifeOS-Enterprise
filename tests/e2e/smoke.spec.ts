import { test, expect } from '@playwright/test';

test('playwright bootstrap smoke test', async ({ page }) => {
  await page.goto('data:text/html,<title>LifeOS</title><h1>LifeOS Core</h1>');
  await expect(page).toHaveTitle('LifeOS');
});
