import { chromium, devices } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const BASE = 'https://agrohub-theta.vercel.app'
const OUT = path.join(process.cwd(), 'public', 'work', 'agrohub')
const HIDE_CSS = 'vercel-live-feedback{display:none!important}'
const MAX_BYTES = 1_500_000
// Desktop shots are downscaled to the largest width at which ALL of them fit.
const WIDTHS = [2160, 1800, 1600]

type Shot = { name: string; route: string; phone?: boolean }

const shots: Shot[] = [
  { name: 'landing', route: '/' },
  { name: 'lots', route: '/lots' },
  { name: 'prices', route: '/prices' },
  { name: 'landing-phone', route: '/', phone: true },
  { name: 'lots-phone', route: '/lots', phone: true },
]

function downscale(src: string, dest: string, width: number) {
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-vf', `scale=${width}:-1`, dest])
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  const work = mkdtempSync(path.join(tmpdir(), 'agrohub-capture-'))
  const desktopRaw: { name: string; file: string }[] = []
  const browser = await chromium.launch()
  try {
    for (const shot of shots) {
      const context = await browser.newContext(
        shot.phone
          ? { ...devices['iPhone 13'] }
          : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
      )
      try {
        const page = await context.newPage()
        const response = await page.goto(BASE + shot.route, { waitUntil: 'networkidle' })
        if (!response || response.status() !== 200) {
          throw new Error(`${shot.route} returned ${response?.status() ?? 'no response'}`)
        }
        await page.waitForTimeout(1500)
        await page.addStyleTag({ content: HIDE_CSS })
        if (shot.phone) {
          const file = path.join(OUT, `${shot.name}.png`)
          await page.screenshot({ path: file })
          if (statSync(file).size > MAX_BYTES) throw new Error(`${shot.name}.png is over 1.5MB`)
        } else {
          const file = path.join(work, `${shot.name}.raw.png`)
          await page.screenshot({ path: file })
          desktopRaw.push({ name: shot.name, file })
        }
        console.log(`captured ${shot.name} <- ${shot.route}`)
      } finally {
        await context.close()
      }
    }

    let chosen: number | null = null
    for (const width of WIDTHS) {
      const fits = desktopRaw.every(({ name, file }) => {
        const tmp = path.join(work, `${name}.${width}.png`)
        downscale(file, tmp, width)
        return statSync(tmp).size <= MAX_BYTES
      })
      if (fits) {
        chosen = width
        break
      }
    }
    if (chosen === null) {
      throw new Error(`desktop shots do not fit in 1.5MB even at ${WIDTHS[WIDTHS.length - 1]}px wide`)
    }
    for (const { name } of desktopRaw) {
      copyFileSync(path.join(work, `${name}.${chosen}.png`), path.join(OUT, `${name}.png`))
    }
    console.log(`desktop shots written at ${chosen}px wide`)
  } finally {
    await browser.close()
    rmSync(work, { recursive: true, force: true })
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
