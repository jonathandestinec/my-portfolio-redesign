import { createElement } from 'react'
import { renderToBuffer, renderToString } from '@react-pdf/renderer'
import { education, experience } from '@/content/experience'
import { projects } from '@/content/projects'
import { site } from '@/content/site'
import { stack, stackCategories } from '@/content/stack'
import { siteUrl } from '@/lib/site-url'
import { ResumeDocument } from './ResumeDocument'

/**
 * `compress: false` is for tests only (readable text streams). The route never sets it.
 * react-pdf's renderToBuffer always compresses; renderToString is its only uncompressed path.
 */
/** Everything the résumé is rendered from. */
export function resumeData() {
  return { site, siteUrl: siteUrl(), experience, education, stack, stackCategories, projects }
}

export async function buildResumePdf(opts: { compress?: boolean } = {}): Promise<Uint8Array> {
  const el = createElement(ResumeDocument, { data: resumeData() })
  if (opts.compress === false) {
    return new Uint8Array(Buffer.from(await renderToString(el as never), 'latin1'))
  }
  return new Uint8Array(await renderToBuffer(el as never))
}
