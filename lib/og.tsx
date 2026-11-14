import { ImageResponse } from 'next/og'
import { site } from '@/content/site'

export const ogSize = { width: 1200, height: 630 }
export const ogContentType = 'image/png'

export function renderOg(title: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#F2EFE8',
          color: '#21201D',
          padding: 72,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 36, lineHeight: 1.1, fontWeight: 600 }}>
          <span>{site.firstName}</span>
          <span>{site.lastName}</span>
        </div>
        <div style={{ display: 'flex', fontSize: 64, lineHeight: 1.15, fontWeight: 600, letterSpacing: -1.5 }}>
          {title}
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: '#5D5B55' }}>{site.role}</div>
      </div>
    ),
    ogSize,
  )
}
