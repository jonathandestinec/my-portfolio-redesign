import { chromium, devices } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const HIDE_CSS = 'vercel-live-feedback{display:none!important}'
const MAX_BYTES = 1_500_000
// Desktop shots are downscaled to the largest width at which ALL of them fit.
const WIDTHS = [2160, 1800, 1600]

/**
 * `scrollTo`: a #id, or the exact text of an element, to scroll to the top of the screen before the shot.
 * `upload`: a photo (path on the same site) to give the page's file input, e.g. for a try-on demo.
 */
type Shot = { name: string; route: string; phone?: boolean; scrollTo?: string; upload?: { photo: string; openWith?: string } }

/** `jpg`: photo-heavy sites, where PNG screenshots are several MB. */
const projects: Record<string, { base: string; shots: Shot[]; jpg?: boolean }> = {
  'royal-beads-edo': {
    base: 'https://royal-beads-edo.vercel.app',
    jpg: true,
    shots: [
      { name: 'landing', route: '/' },
      { name: 'opening', route: '/', scrollTo: '#opening' },
      { name: 'occasions', route: '/', scrollTo: '#occasions' },
      { name: 'try-on-teaser', route: '/', scrollTo: '#try-on' },
      { name: 'care', route: '/', scrollTo: '#care' },
      { name: 'gallery', route: '/', scrollTo: '#gallery' },
      { name: 'enquire', route: '/', scrollTo: '#enquire' },
      { name: 'dashboard', route: '/dashboard' },
      { name: 'regalia', route: '/regalia' },
      { name: 'try-on', route: '/try-on', upload: { photo: '/images/concept/1-hero-coral-necklace-portrait.jpg', openWith: 'Use a photo instead' } },
      { name: 'landing-phone', route: '/', phone: true },
      { name: 'try-on-phone', route: '/try-on', phone: true, upload: { photo: '/images/concept/1-hero-coral-necklace-portrait.jpg', openWith: 'Use a photo instead' } },
      { name: 'occasions-phone', route: '/', phone: true, scrollTo: '#occasions' },
    ],
  },
  agrohub: {
    base: 'https://agro-hub.com.ng',
    shots: [
      { name: 'landing', route: '/' },
      { name: 'lots', route: '/lots' },
      { name: 'prices', route: '/prices' },
      { name: 'landing-phone', route: '/', phone: true },
      { name: 'lots-phone', route: '/lots', phone: true },
    ],
  },
  huddle: {
    base: 'https://huddleplat.vercel.app',
    shots: [
      { name: 'landing', route: '/' },
      { name: 'features', route: '/', scrollTo: '#features' },
      { name: 'event', route: '/the-watcher-s-voice/in-god-s-presence-2' },
      { name: 'event-functions', route: '/the-watcher-s-voice/in-god-s-presence-2', scrollTo: 'Number Picker' },
      { name: 'login', route: '/login' },
      { name: 'landing-phone', route: '/', phone: true },
      { name: 'event-phone', route: '/the-watcher-s-voice/in-god-s-presence-2', phone: true },
      { name: 'picker-phone', route: '/the-watcher-s-voice/in-god-s-presence-2', phone: true, scrollTo: 'Number Picker' },
    ],
  },
}

// Usage: bun scripts/capture-screenshots.ts <project>   (royal-beads-edo | agrohub | huddle)
const project = process.argv[2] ?? 'royal-beads-edo'
if (!projects[project]) throw new Error(`unknown project "${project}"; use one of ${Object.keys(projects).join(', ')}`)
const { base: BASE, shots, jpg: JPG } = projects[project]
const EXT = JPG ? 'jpg' : 'png'
// Screenshots land in captures/<project>/ (gitignored); upload the ones you want
// through the admin panel, which stores them under public/work/<project>/.
const OUT = path.join(process.cwd(), 'captures', project)

function downscale(src: string, dest: string, width: number) {
  const quality = dest.endsWith('.jpg') ? ['-q:v', '3'] : []
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-vf', `scale=${width}:-1`, ...quality, dest])
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  const work = mkdtempSync(path.join(tmpdir(), `${project}-capture-`))
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
        if (shot.upload) {
          const photo = path.join(work, path.basename(shot.upload.photo))
          const res = await fetch(BASE + shot.upload.photo)
          if (!res.ok) throw new Error(`${shot.upload.photo} returned ${res.status}`)
          writeFileSync(photo, Buffer.from(await res.arrayBuffer()))
          if (shot.upload.openWith) {
            const open = page.getByRole('button', { name: shot.upload.openWith })
            if (await open.count()) await open.first().click()
          }
          await page.locator('input[type=file]').first().setInputFiles(photo)
          await page.waitForTimeout(6000) // face tracking runs in the browser
        }
        if (shot.scrollTo) {
          const target = shot.scrollTo.startsWith('#')
            ? page.locator(shot.scrollTo)
            : page.getByText(shot.scrollTo, { exact: true })
          await target
            .first()
            .evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }))
          await page.evaluate(() => window.scrollBy(0, -32))
          await page.waitForTimeout(1200)
        }
        if (shot.phone) {
          const file = path.join(OUT, `${shot.name}.${EXT}`)
          const raw = path.join(work, `${shot.name}.raw.png`)
          await page.screenshot({ path: raw })
          if (JPG) downscale(raw, file, 1170)
          else copyFileSync(raw, file)
          // Photo-heavy pages: step down from 3x until the shot fits.
          for (const width of [900, 780, 640]) {
            if (statSync(file).size <= MAX_BYTES) break
            downscale(raw, file, width)
          }
          if (statSync(file).size > MAX_BYTES) throw new Error(`${shot.name}.${EXT} is over 1.5MB`)
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
        const tmp = path.join(work, `${name}.${width}.${EXT}`)
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
      copyFileSync(path.join(work, `${name}.${chosen}.${EXT}`), path.join(OUT, `${name}.${EXT}`))
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
