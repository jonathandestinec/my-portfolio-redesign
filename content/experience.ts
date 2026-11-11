import type { Education, Role } from './types'

/*
 * TODO(content): `details`, `highlights` and `stack` below are drafted from the
 * one-line summaries in the content inventory. Every one of them needs the
 * owner's confirmation or rewrite before launch. Nothing here contains made-up
 * numbers; replace generic lines with real outcomes where you have them.
 */

export const experience: Role[] = [
  {
    slug: 'welup-digital',
    start: 'Aug 2026',
    end: 'Present',
    title: 'Software Development Intern',
    company: 'Welup Digital',
    companyUrl: 'https://www.welupdigital.com',
    logo: { src: '/logos/welup.png' },
    type: 'Internship',
    summary: 'Ongoing software development internship.',
    // TODO(content): confirm
    details:
      'Working inside a small product team on Welup’s web platform for tech training and consulting. I pick up features end to end, from the UI to the API it talks to, and ship them through code review.',
    highlights: [
      'Build and maintain pages and components for the learning platform', // TODO(content)
      'Work through tickets with code review and pull requests', // TODO(content)
      'Pair with senior engineers on backend and data work', // TODO(content)
    ],
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS'], // TODO(content)
  },
  {
    slug: 'giz',
    start: 'Aug 2026',
    end: 'Present',
    title: 'AI & Automations Engineering',
    company: 'GIZ',
    companyUrl: 'https://www.giz.de',
    logo: { src: '/logos/giz.png' },
    type: 'Programme',
    summary: 'Ongoing AI and automation engineering programme.',
    // TODO(content): confirm
    details:
      'A structured programme on applying AI and workflow automation to real business problems: connecting tools, moving data between systems, and putting language models to work where they actually save time.',
    highlights: [
      'Design automation workflows that connect forms, CRMs, email and databases', // TODO(content)
      'Use language models for intake, classification and drafting steps', // TODO(content)
      'Ship small working projects as part of the programme', // TODO(content)
    ],
    stack: ['n8n', 'OpenAI API', 'Postgres', 'Webhooks'], // TODO(content)
  },
  {
    slug: 'nexorra-studio',
    start: 'Aug 2024',
    end: 'Present',
    title: 'Front-End Developer',
    company: 'Nexorra Studio',
    companyUrl: 'https://www.nexorrastudio.com',
    logo: { src: '/logos/nexorra.png' },
    type: 'Contract',
    location: 'Remote',
    summary:
      'Client web apps in React/Next.js/TypeScript; UI performance work; Zustand/Redux state and Socket.io realtime.',
    // TODO(content): confirm
    details:
      'Building client web apps for a design and development agency. Designers hand over Figma files and I turn them into fast, responsive interfaces, wire up state and realtime features, and keep them quick as they grow.',
    highlights: [
      'Turn Figma designs into production React and Next.js interfaces',
      'Manage app state with Zustand and Redux',
      'Add realtime updates with Socket.io',
      'Find and fix slow renders and heavy pages',
    ],
    stack: ['Next.js', 'React', 'TypeScript', 'Zustand', 'Redux', 'Socket.io'],
  },
  {
    slug: 'caretrax',
    start: '2025',
    end: '2025',
    title: 'Frontend Developer',
    company: 'Caretrax',
    logo: { initials: 'CT' },
    type: 'Contract',
    location: 'Remote',
    summary:
      'UI components for a health and care web app; API integration with the team.',
    // TODO(content): confirm
    details:
      'Worked with the Caretrax team on a web app for health and care providers. I built reusable interface components and connected them to the team’s APIs, so screens showed real data and handled loading and error states properly.',
    highlights: [
      'Built reusable UI components for care records and schedules', // TODO(content)
      'Integrated screens with the team’s REST APIs',
      'Handled loading, empty and error states across the app', // TODO(content)
    ],
    stack: ['React', 'TypeScript', 'REST APIs'], // TODO(content)
  },
  {
    slug: 'joenadiv-concepts',
    start: '2024',
    end: '2025',
    title: 'Frontend Developer',
    company: 'JoeNadiv Concepts',
    logo: { initials: 'JN' },
    summary: 'Responsive business web app; SEO and page-load improvements.',
    // TODO(content): confirm
    details:
      'Built a responsive web app for the business, then made it easier to find and quicker to open: cleaner metadata and structure for search engines, lighter images and less JavaScript on first load.',
    highlights: [
      'Built the responsive web app from scratch',
      'Improved SEO: metadata, page structure and sitemap', // TODO(content)
      'Cut page-load time with image and bundle work', // TODO(content)
    ],
    stack: ['Next.js', 'React', 'Tailwind CSS'], // TODO(content)
  },
]

export const education: Education[] = [
  {
    slug: 'aptech',
    date: '05/2024',
    course: 'Frontend development course',
    institution: 'Aptech Computer Education',
    institutionUrl: 'https://www.aptech-worldwide.com',
    logo: { initials: 'AP' },
    location: 'Abuja',
    summary: 'Hands-on course in building websites and web apps.',
    // TODO(content): confirm
    details:
      'A practical course covering the foundations of the web and modern frontend work: semantic HTML, CSS layout, JavaScript, and building interfaces with React. It is where I went from tinkering to shipping complete projects.',
    highlights: [
      'HTML, CSS and responsive layout',
      'JavaScript fundamentals and the DOM',
      'Building interfaces with React', // TODO(content)
      'Final project: a complete multi-page site', // TODO(content)
    ],
  },
  {
    slug: 'unizik',
    date: '01/2023',
    course: 'Polymer and Textiles Engineering',
    institution: 'Nnamdi Azikiwe University',
    institutionUrl: 'https://unizik.edu.ng',
    logo: { src: '/logos/unizik.png' },
    location: 'Awka',
    summary: 'Engineering degree studies.',
    // TODO(content): confirm dates, status and details
    details:
      'Engineering studies in polymer and textile materials. The habits carried over to software: working from first principles, measuring before changing things, and writing up how something works so others can follow it.',
    highlights: [
      'Engineering maths, materials science and process design', // TODO(content)
      'Lab work and technical reports', // TODO(content)
    ],
  },
]
