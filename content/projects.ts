import type { Project } from './types'

export const projects: Project[] = [
  {
    slug: 'agrohub',
    name: 'AgroHub',
    context: 'In progress',
    summary:
      "A phone-first platform where Nigerian farmer cooperatives sell members' harvests to bulk buyers. Buyers pay upfront and the money is held until delivery is confirmed, then split automatically between the cooperative and each farmer. It has roles for farmer, officer, buyer, admin and board, and supports English first, with Pidgin, Hausa, Yoruba and Igbo planned.",
    cover: {
      src: '/work/agrohub/landing.png',
      alt: 'AgroHub landing page: Sell together. Get paid on delivery.',
    },
    slides: [
      {
        screen: 'Landing',
        src: '/work/agrohub/landing.png',
        alt: 'AgroHub landing page: Sell together. Get paid on delivery.',
      },
      {
        screen: 'Browse lots',
        src: '/work/agrohub/lots.png',
        alt: 'AgroHub public catalogue of harvest lots available to buyers',
      },
      {
        screen: 'Price board',
        src: '/work/agrohub/prices.png',
        alt: 'AgroHub price board showing weekly crop prices',
      },
      {
        screen: 'Landing on a phone',
        src: '/work/agrohub/landing-phone.png',
        alt: 'AgroHub landing page at phone width',
      },
    ],
    role: 'Solo · fullstack',
    stack: [
      'Next.js',
      'Prisma + Postgres (Neon)',
      'better-auth (2FA)',
      'next-intl',
      'Paystack',
      'S3 storage',
      'Resend',
      'Docker Compose',
      'Vitest + Playwright',
    ],
    year: '2026',
    status: 'in-progress',
    links: {
      live: 'https://agrohub-theta.vercel.app',
      repo: 'https://github.com/jonathandestinec/agrohub',
    },
    images: [
      {
        src: '/work/agrohub/landing.png',
        width: 1600,
        height: 1000,
        alt: 'AgroHub landing page: Sell together. Get paid on delivery.',
        caption: 'Landing page',
      },
      {
        src: '/work/agrohub/lots.png',
        width: 1600,
        height: 1000,
        alt: 'AgroHub public catalogue of harvest lots available to buyers',
        caption: 'Browse lots',
      },
      {
        src: '/work/agrohub/prices.png',
        width: 1600,
        height: 1000,
        alt: 'AgroHub price board showing weekly crop prices',
        caption: 'Price board',
      },
      {
        src: '/work/agrohub/landing-phone.png',
        width: 1170,
        height: 1992,
        alt: 'AgroHub landing page at phone width',
        caption: 'Landing on a phone',
      },
      {
        src: '/work/agrohub/lots-phone.png',
        width: 1170,
        height: 1992,
        alt: 'AgroHub lot catalogue at phone width',
        caption: 'Browse lots on a phone',
      },
    ],
  },
]
