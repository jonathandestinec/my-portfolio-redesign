import type { Site } from './types'

export const site: Site = {
  firstName: 'destine',
  lastName: 'jonathan',
  role: 'FullStack Developer & Automation Engineer',
  email: 'jonathandestinec@gmail.com',
  calendarUrl: 'https://cal.com/destine-jonathan-cvcewa/15min',
  githubUsername: 'jonathandestinec',
  socials: {
    github: 'https://github.com/jonathandestinec',
    linkedin: 'https://linkedin.com/in/jonathandestinec',
    x: 'https://x.com/destine0_',
  },
  hero: {
    lead: "Hi, I'm Destine.",
    statements: [
      ['I build fullstack web apps and the automations behind them.'],
      [
        'Right now: ',
        { text: 'AgroHub', href: '/work/agrohub' },
        ', helping farmer cooperatives in Nigeria sell together and get paid on delivery.',
      ],
      ['I work in Next.js, Postgres, and n8n.'],
    ],
    status: ['Open to fullstack roles.', 'Based in Nigeria · remote friendly.'],
  },
}
