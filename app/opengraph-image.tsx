import { ogContentType, ogSize, renderOg } from '@/lib/og'

export const alt = 'Destine Jonathan — FullStack Developer & Automation Engineer'
export const size = ogSize
export const contentType = ogContentType

export default function Image() {
  return renderOg('I build fullstack web apps and the automations behind them.')
}
