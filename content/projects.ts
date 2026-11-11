import type { Project } from './types'

export const projects: Project[] = [
  {
    slug: 'agrohub',
    name: 'AgroHub',
    tagline: 'farmer cooperatives sell together and get paid on delivery',
    context: 'In progress',
    summary:
      "A phone-first platform where Nigerian farmer cooperatives sell members' harvests to bulk buyers. Buyers pay upfront and the money is held until delivery is confirmed, then split automatically between the cooperative and each farmer. It has roles for farmer, officer, buyer, admin and board, and supports English first, with Pidgin, Hausa, Yoruba and Igbo planned.",
    // TODO(content): story and chapters are drafted from the project summary; confirm wording.
    story: [
      'AgroHub is a phone-first platform where farmer cooperatives in Nigeria sell their members’ harvests to bulk buyers. A cooperative lists a lot, a buyer pays for it upfront, and nobody has to trust anybody on a handshake.',
      'The money is held until the buyer confirms delivery. Then it is split automatically: the cooperative’s share, and each farmer’s share of the lot they contributed to.',
      'I’m building it alone, end to end: product, design, the Next.js app, the database, payments and the tests. It is in progress, with English first and Pidgin, Hausa, Yoruba and Igbo planned.',
    ],
    chapters: [
      {
        id: 'selling-together',
        title: 'Selling together',
        text: 'One farmer with a few bags has little pull with a bulk buyer. A cooperative with a full lot does. Buyers browse open lots by crop, size and location, and each lot shows exactly which members it came from.',
        images: [
          {
            src: '/work/agrohub/lots.png',
            width: 1600,
            height: 1000,
            alt: 'AgroHub public catalogue of harvest lots available to buyers',
          },
        ],
      },
      {
        id: 'paid-on-delivery',
        title: 'Paid on delivery',
        text: 'Buyers pay through Paystack when they commit. AgroHub holds the money until delivery is confirmed, then splits it between the cooperative and each farmer, so the person who grew the crop sees their share without chasing anyone.',
        images: [
          {
            src: '/work/agrohub/prices.png',
            width: 1600,
            height: 1000,
            alt: 'AgroHub price board showing weekly crop prices',
          },
        ],
      },
      {
        id: 'built-for-phones',
        title: 'Built for phones',
        text: 'Most farmers and officers will only ever open AgroHub on a phone, often on a slow connection. Every screen is designed small first, with large tap targets and very little to download.',
        images: [
          {
            src: '/work/agrohub/landing-phone.png',
            width: 1170,
            height: 1992,
            alt: 'AgroHub landing page at phone width',
            phone: true,
          },
          {
            src: '/work/agrohub/lots-phone.png',
            width: 1170,
            height: 1992,
            alt: 'AgroHub lot catalogue at phone width',
            phone: true,
          },
        ],
      },
      {
        id: 'roles',
        title: 'Five roles, one app',
        text: 'Farmers, cooperative officers, buyers, admins and the board each see a different AgroHub. Sign-in uses better-auth with two-factor for anyone who handles money, and every role is covered by Vitest and Playwright tests.',
        images: [],
      },
    ],
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
        phone: true,
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
