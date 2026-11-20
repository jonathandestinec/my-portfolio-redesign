import { makeRouteHandler } from "@keystatic/next/route-handler";
import config from "../../../../keystatic.config";

type Handlers = ReturnType<typeof makeRouteHandler>;

// Built on first request, not at import: in GitHub mode Keystatic throws when its
// credentials are missing, which would otherwise fail every build until the
// GitHub App is set up. Without them the admin API simply answers 404.
let handlers: Handlers | null | undefined;

function getHandlers(): Handlers | null {
  if (handlers !== undefined) return handlers;
  const githubReady =
    !!process.env.KEYSTATIC_GITHUB_CLIENT_ID &&
    !!process.env.KEYSTATIC_GITHUB_CLIENT_SECRET &&
    !!process.env.KEYSTATIC_SECRET;
  handlers = config.storage.kind === "local" || githubReady ? makeRouteHandler({ config }) : null;
  return handlers;
}

const notFound = () => new Response("Not found", { status: 404 });

export function GET(request: Request) {
  const h = getHandlers();
  return h ? h.GET(request) : notFound();
}

export function POST(request: Request) {
  const h = getHandlers();
  return h ? h.POST(request) : notFound();
}
