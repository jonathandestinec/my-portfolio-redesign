import { createElement } from 'react'
import { renderToBuffer, renderToString } from '@react-pdf/renderer'
import { education, experience } from '@/content/experience'
import { projects } from '@/content/projects'
import { site } from '@/content/site'
import { stack, stackCategories } from '@/content/stack'
import { ResumeDocument } from './ResumeDocument'

// TODO(content): real domain
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://destinejonathan.dev'

/**
 * `compress: false` is for tests only (readable text streams). The route never sets it.
 * react-pdf's renderToBuffer always compresses; renderToString is its only uncompressed path.
 */
export async function buildResumePdf(opts: { compress?: boolean } = {}): Promise<Uint8Array> {
  const el = createElement(ResumeDocument, {
    data: { site, siteUrl, experience, education, stack, stackCategories, project: projects[0] },
  })
  if (opts.compress === false) {
    return new Uint8Array(Buffer.from(await renderToString(el as never), 'latin1'))
  }
  return new Uint8Array(await renderToBuffer(el as never))
}
