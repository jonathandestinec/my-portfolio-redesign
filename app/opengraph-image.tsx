import { ogContentType, ogSize, renderOg } from '@/lib/og'

export const alt = 'Destine Jonathan — FullStack Developer & Automation Engineer'
export const size = ogSize
export const contentType = ogContentType

export default function Image() {
  return renderOg('FullStack Developer & Automation Engineer')
}
