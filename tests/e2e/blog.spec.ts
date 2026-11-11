import { expect, test } from '@playwright/test'

test('blog index lists posts and opens one', async ({ page }) => {
  await page.goto('/blog')
  await page.getByRole('link', { name: /AgroHub/i }).first().click()
  await expect(page).toHaveURL(/\/blog\/shipping-agrohub-escrow$/)
  await expect(page.getByRole('heading', { level: 1, name: /AgroHub/i })).toBeVisible()
})
test('unknown post 404s', async ({ page }) => {
  const r = await page.goto('/blog/nope')
  expect(r!.status()).toBe(404)
})

test('post renders without JS and highlights code', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false })
  const page = await ctx.newPage()
  await page.goto('/blog/shipping-agrohub-escrow')
  await expect(page.locator('article h2').first()).toBeVisible()
  await expect(page.locator('article pre.shiki')).toBeVisible()
  await ctx.close()
})
