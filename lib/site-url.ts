/** Public origin of the site. Set NEXT_PUBLIC_SITE_URL to override (e.g. for a custom domain later). */
export const DEFAULT_SITE_URL = 'https://destinejc.vercel.app'

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '')
}
