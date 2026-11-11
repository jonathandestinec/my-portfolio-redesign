import {
  siNextdotjs,
  siReact,
  siTypescript,
  siAstro,
  siTailwindcss,
  siReactquery,
  siAxios,
  siRedux,
  siNodedotjs,
  siExpress,
  siBun,
  siMongodb,
  siPostgresql,
  siPrisma,
  siDrizzle,
  siSocketdotio,
  siClerk,
  siJsonwebtokens,
  siAuth0,
  siN8n,
  siDocker,
  siGit,
  siGithub,
  siVercel,
  siFigma,
} from "simple-icons";

const ICONS: Record<string, string> = {
  nextdotjs: siNextdotjs.path,
  react: siReact.path,
  typescript: siTypescript.path,
  astro: siAstro.path,
  tailwindcss: siTailwindcss.path,
  reactquery: siReactquery.path,
  axios: siAxios.path,
  redux: siRedux.path,
  nodedotjs: siNodedotjs.path,
  express: siExpress.path,
  bun: siBun.path,
  mongodb: siMongodb.path,
  postgresql: siPostgresql.path,
  prisma: siPrisma.path,
  drizzle: siDrizzle.path,
  socketdotio: siSocketdotio.path,
  clerk: siClerk.path,
  jsonwebtokens: siJsonwebtokens.path,
  auth0: siAuth0.path,
  n8n: siN8n.path,
  docker: siDocker.path,
  git: siGit.path,
  github: siGithub.path,
  vercel: siVercel.path,
  figma: siFigma.path,
};

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function StackIcon({ slug, className = "h-4 w-4" }: { slug: string; className?: string }) {
  if (slug === "terminal") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...strokeProps}>
        <path d="M4 17l6-6-6-6" />
        <path d="M12 19h8" />
      </svg>
    );
  }
  const path = ICONS[slug];
  if (!path) {
    // 'key' and any unknown slug fall back to a key glyph.
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...strokeProps}>
        <circle cx="7.5" cy="15.5" r="4.5" />
        <path d="M10.7 12.3L21 2" />
        <path d="M17 6l3 3" />
        <path d="M14 9l2 2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d={path} />
    </svg>
  );
}
