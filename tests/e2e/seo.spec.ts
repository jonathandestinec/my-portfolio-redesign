import { expect, test } from '@playwright/test'

test('sitemap lists routes', async ({ request }) => {
  const t = await (await request.get('/sitemap.xml')).text()
  for (const p of ['/playground', '/blog', '/work/agrohub', '/blog/agrohub-payment-held-until-delivery']) expect(t).toContain(p)
})
test('robots links sitemap', async ({ request }) => {
  expect(await (await request.get('/robots.txt')).text()).toContain('sitemap.xml')
})
test('rss valid-ish', async ({ request }) => {
  const r = await request.get('/blog/rss.xml')
  expect(r.headers()['content-type']).toContain('application/rss+xml')
  expect(await r.text()).toContain('<item>')
})
test('og images', async ({ request }) => {
  for (const u of ['/opengraph-image', '/work/agrohub/opengraph-image', '/blog/agrohub-payment-held-until-delivery/opengraph-image']) {
    const r = await request.get(u)
    expect(r.status()).toBe(200)
    expect(r.headers()['content-type']).toBe('image/png')
  }
})
test('titles', async ({ page }) => {
  await page.goto('/work/agrohub')
  await expect(page).toHaveTitle('AgroHub — Destine Jonathan')
  await page.goto('/blog')
  await expect(page).toHaveTitle('Writing — Destine Jonathan')
  await page.goto('/playground')
  await expect(page).toHaveTitle('Pet projects & experiments — Destine Jonathan')
  await page.goto('/')
  await expect(page).toHaveTitle('Destine Jonathan — FullStack Developer & Automation Engineer')
})
test('og + rss link tags in head', async ({ page }) => {
  await page.goto('/work/agrohub')
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1)
  await expect(page.locator('link[type="application/rss+xml"]')).toHaveCount(1)
})
