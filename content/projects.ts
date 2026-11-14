import type { Project } from './types'

export const projects: Project[] = [
  // Order matters: newest first. The hero names the first two; the carousel shows every cover.
  {
    slug: 'huddle',
    name: 'Huddle',
    blurb: 'where churches and communities run events and get paid for them',
    tagline: 'where organisations bring their people together',
    context: 'Live',
    summary:
      'A modular event platform for churches, community groups, schools and NGOs in Nigeria and Ghana. Organisers create an event, attach Functions (Number Picker, RSVP & Seats, Extra Content) and share one link. Each Function can be free, paid through Paystack, or unlocked with an access code, and the money settles straight to the organisation\u2019s bank.',
    // TODO(content): story and chapters are drafted from the huddle-app repo (README, PRODUCT.md, v1 spec); confirm wording and whether "built solo" is right.
    story: [
      'Huddle is for the people who run church services, community meetings and classes. They already meet on Zoom, Google Meet, Teams or in a room. Huddle runs alongside that meeting and adds the parts those tools lack: numbered turns, seats, recordings and notes behind a payment, and the payment itself.',
      'An organiser creates an event, picks the Functions it needs from the Function Store, and shares one link, usually on WhatsApp. Attendees open it on their phones and join with just a name and an email. There are no passwords anywhere.',
      'I built it end to end: the product, the event and dashboard flows, the database, payments and the tests. The first organisation is already running its events on it.',
    ],
    chapters: [
      {
        id: 'functions',
        title: 'Functions, mixed per event',
        text: 'Every event is assembled from Functions. RSVP & Seats handles capacity, Number Picker lets attendees claim their own number, and Extra Content keeps recordings, notes and slides behind a gate. Each Function is gated on its own: free, paid, or unlocked with an access code.',
        images: [
          {
            src: '/work/huddle/features.png',
            width: 2160,
            height: 1350,
            alt: 'Huddle landing page: the Features section listing Number Picker, Vault, Voting & Polls, Q&A Queue, Certificate and RSVP & Seats',
          },
        ],
      },
      {
        id: 'one-link',
        title: 'One link, no passwords',
        text: 'The event page is the whole attendee experience. It shows when and where the meeting is, a button to join it, and every Function attached to it. Attendees give a name and email once and are signed in with a magic link, so they never stop to create an account.',
        images: [
          {
            src: '/work/huddle/event.png',
            width: 2160,
            height: 1350,
            alt: 'Huddle public event page for In God\u2019s Presence by The Watcher\u2019s Voice, with date, place and a Join the meeting online button',
          },
        ],
      },
      {
        id: 'numbers',
        title: 'Numbers, held and called live',
        text: 'Tapping a free number holds it for ten minutes while the attendee pays. A database constraint makes sure two people can never claim the same number, and the loser gets a friendly "someone just grabbed it". During the event the host calls numbers from one screen, and every attendee\u2019s phone shows who is up within seconds.',
        images: [
          {
            src: '/work/huddle/event-phone.png',
            width: 1170,
            height: 1992,
            alt: 'Huddle event page on a phone',
            phone: true,
          },
          {
            src: '/work/huddle/picker-phone.png',
            width: 1170,
            height: 1992,
            alt: 'Huddle Number Picker grid on a phone, numbers 1 to 30 at \u20a6100 each',
            phone: true,
          },
        ],
      },
      {
        id: 'payments',
        title: 'Money goes straight to the organisation',
        text: 'Each organisation connects its bank once and gets its own Paystack subaccount. At checkout Paystack splits the payment: the organisation gets its share directly and Huddle\u2019s 5% fee is taken automatically, so Huddle never holds anyone\u2019s money. Payment confirmation is idempotent, so a late or repeated webhook can never grant something twice.',
        images: [
          {
            src: '/work/huddle/event-functions.png',
            width: 2160,
            height: 1350,
            alt: 'Huddle event page showing a \u20a6100 Number Picker and a free Extra Content card with Prophesy Recordings',
          },
        ],
      },
      {
        id: 'tested',
        title: 'Tested against a real database',
        text: 'Gating, payments, holds, seat limits and anonymous pickers are covered by integration tests that run against a throwaway Neon Postgres branch, and Playwright walks the full organiser-to-attendee flow end to end.',
        images: [],
      },
    ],
    cover: {
      src: '/work/huddle/landing.png',
      alt: 'Huddle landing page: Join the huddle. Connect, monetize your communities.',
    },
    slides: [
      {
        screen: 'Landing',
        src: '/work/huddle/landing.png',
        alt: 'Huddle landing page: Join the huddle. Connect, monetize your communities.',
      },
      {
        screen: 'Event page',
        src: '/work/huddle/event.png',
        alt: 'Huddle public event page for In God\u2019s Presence by The Watcher\u2019s Voice',
      },
      {
        screen: 'Number Picker on a phone',
        src: '/work/huddle/picker-phone.png',
        alt: 'Huddle Number Picker grid on a phone',
        phone: true,
      },
      {
        screen: 'Features',
        src: '/work/huddle/features.png',
        alt: 'Huddle landing page Features section',
      },
    ],
    role: 'Fullstack, end to end', // TODO(content): confirm (solo, or with The Watchers Channel / Vivant Enterprises?)
    stack: [
      'Next.js 16',
      'TypeScript',
      'Tailwind CSS 4',
      'Drizzle + Neon Postgres',
      'Better Auth (magic link + Google)',
      'Paystack split payments',
      'S3 storage (Backblaze B2)',
      'Resend',
      'Vitest + Playwright',
    ],
    year: '2026',
    status: 'shipped',
    links: {
      live: 'https://huddle-three-rho.vercel.app',
      repo: 'https://github.com/jonathandestinec/huddle-app',
    },
    images: [
      {
        src: '/work/huddle/landing.png',
        width: 2160,
        height: 1350,
        alt: 'Huddle landing page: Join the huddle. Connect, monetize your communities.',
        caption: 'Landing page',
      },
      {
        src: '/work/huddle/landing-phone.png',
        width: 1170,
        height: 1992,
        alt: 'Huddle landing page on a phone',
        caption: 'Landing on a phone',
      },
    ],
  },
  {
    slug: 'agrohub',
    name: 'AgroHub',
    blurb: 'where farmer cooperatives in Nigeria sell together and get paid on delivery',
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
