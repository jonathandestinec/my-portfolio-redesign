import fs from 'node:fs'
import path from 'node:path'
import { imageSize } from 'image-size'
import type { Img } from '@/content/types'

/** Fills in width/height for a /public image (needed by next/image); keeps any values already set. */
export function withSize<T extends Img>(img: T): T {
  if (img.width && img.height) return img
  const file = path.join(process.cwd(), 'public', img.src.replace(/^\//, ''))
  const { width, height } = imageSize(fs.readFileSync(/*turbopackIgnore: true*/ file))
  return { ...img, width, height }
}
