import { cacheLife } from 'next/cache'
import { buildResumePdf } from '@/lib/resume/build'

async function cachedPdf() {
  'use cache'
  cacheLife('max')
  return buildResumePdf()
}

export async function GET() {
  const bytes = await cachedPdf()
  return new Response(bytes as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Destine-Jonathan-Resume.pdf"',
    },
  })
}
