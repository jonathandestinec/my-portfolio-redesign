import { chromium, devices } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = 'https://agrohub-theta.vercel.app'
const OUT = path.join(process.cwd(), 'public', 'work', 'agrohub')
const HIDE_CSS = 'vercel-live-feedback, [data-nextjs-toast], [data-nextjs-dev-tools-button]{display:none!important}'

type Shot = { name: string; route: string; phone?: boolean }

const shots: Shot[] = [
  { name: 'landing', route: '/' },
  { name: 'lots', route: '/lots' },
  { name: 'prices', route: '/prices' },
  { name: 'landing-phone', route: '/', phone: true },
  { name: 'lots-phone', route: '/lots', phone: true },
]

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch()
  try {
    for (const shot of shots) {
      const context = await browser.newContext(
        shot.phone
          ? { ...devices['iPhone 13'] }
          : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
      )
      const page = await context.newPage()
      const response = await page.goto(BASE + shot.route, { waitUntil: 'networkidle' })
      if (!response || response.status() !== 200) {
        throw new Error(`${shot.route} returned ${response?.status() ?? 'no response'}`)
      }
      await page.waitForTimeout(1500)
      await page.addStyleTag({ content: HIDE_CSS })
      const file = path.join(OUT, `${shot.name}.png`)
      await page.screenshot({ path: file })
      console.log(`captured ${shot.name} <- ${shot.route}`)
      await context.close()
    }
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
