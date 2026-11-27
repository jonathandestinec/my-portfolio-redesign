/**
 * Renders a project film from video/sting.html.
 *
 *   bun video/render.ts stills <project> [frames...]   → video/out/<project>/still-fNNN.png
 *   bun video/render.ts film <project>                 → public/work/<project>/film/film.mp4 (+ poster.jpg)
 *
 * Every frame is drawn by seek(f) and screenshotted once fonts and images have
 * loaded. The master steps half a frame at a time (59.94 fps from a 29.97 fps
 * timeline). Audio comes from video/audio.py.
 */
import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, existsSync } from 'node:fs'
import path from 'node:path'

const [mode = 'stills', project = 'royal-beads-edo', ...rest] = process.argv.slice(2)
const ROOT = process.cwd()
const OUT = path.join(ROOT, 'video', 'out', project)
const url = `file://${path.join(ROOT, 'video', 'sting.html')}?p=${project}`

async function main() {
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const page = await (await browser.newContext({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 })).newPage()
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(url)
  await page.evaluate(() => (window as unknown as { ready: Promise<unknown> }).ready)
  const stage = page.locator('#stage')
  const draw = async (f: number) => {
    await page.evaluate((frame) => (window as unknown as { seek: (f: number) => void }).seek(frame), f)
    // Two animation frames so layout, filters and backdrop blur settle before the shot.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  }

  if (mode === 'stills') {
    const frames = rest.length ? rest.map(Number) : [40, 86, 150, 230]
    for (const f of frames) {
      await draw(f)
      await stage.screenshot({ path: path.join(OUT, `still-f${String(f).padStart(3, '0')}.png`) })
      console.log(`still f${f}`)
    }
  } else {
    const frames = path.join(OUT, 'frames')
    rmSync(frames, { recursive: true, force: true })
    mkdirSync(frames, { recursive: true })
    let i = 0
    for (let f = 0; f <= 359.5; f += 0.5) {
      await draw(f)
      await stage.screenshot({ path: path.join(frames, `${String(i).padStart(4, '0')}.png`) })
      if (i % 60 === 0) console.log(`frame ${i}/720`)
      i++
    }
    const dest = path.join(ROOT, 'public', 'work', project, 'film')
    mkdirSync(dest, { recursive: true })
    const audio = path.join(OUT, 'audio.wav')
    if (!existsSync(audio)) execFileSync('python3', ['-I', path.join(ROOT, 'video', 'audio.py'), audio], { stdio: 'inherit' })
    // Web master: H.264 yuv420p at 60000/1001, faststart, with the mastered audio.
    execFileSync('ffmpeg', [
      '-v', 'error', '-y',
      '-framerate', '60000/1001', '-i', path.join(frames, '%04d.png'),
      '-i', audio,
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', '22', '-profile:v', 'high',
      // The picture ends at 12.012 s (360 frames), so the 60 ms fade goes there.
      '-af', 'afade=t=out:st=11.952:d=0.06',
      '-c:a', 'aac', '-b:a', '160k',
      '-shortest', '-movflags', '+faststart',
      path.join(dest, 'film.mp4'),
    ], { stdio: 'inherit' })
    // Poster: f40, the header in the window over the real site (shown before playback and with reduced motion).
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(frames, `${String(80).padStart(4, '0')}.png`), '-q:v', '3', path.join(dest, 'poster.jpg')])
    console.log(`wrote ${path.join(dest, 'film.mp4')}`)
  }
  if (errors.length) console.error('page errors:', errors)
  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
