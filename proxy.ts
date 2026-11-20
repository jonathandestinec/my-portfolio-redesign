import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE, GATE_MAX_AGE, decide } from "@/lib/admin-gate";

const NO_INDEX = "noindex, nofollow, noarchive";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const decision = decide(pathname, request.cookies.get(GATE_COOKIE)?.value, {
    entryPath: process.env.ADMIN_ENTRY_PATH,
    token: process.env.ADMIN_GATE_TOKEN,
    dev: process.env.NODE_ENV === "development",
  });

  switch (decision.kind) {
    case "pass":
      return NextResponse.next();
    case "enter": {
      const res = NextResponse.redirect(new URL("/keystatic", request.url));
      res.cookies.set(GATE_COOKIE, decision.token, {
        httpOnly: true,
        secure: request.nextUrl.protocol === "https:",
        sameSite: "lax",
        path: "/",
        maxAge: GATE_MAX_AGE,
      });
      res.headers.set("X-Robots-Tag", NO_INDEX);
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
    case "admin": {
      // Keystatic routes itself in the browser, so every /keystatic/... page is the same static page.
      const res =
        pathname.startsWith("/keystatic/")
          ? NextResponse.rewrite(new URL("/keystatic", request.url))
          : NextResponse.next();
      res.headers.set("X-Robots-Tag", NO_INDEX);
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
    case "not-found":
      // Render the site's ordinary 404 page, exactly as for any unknown address.
      return NextResponse.rewrite(new URL("/__gate-not-found__", request.url));
  }
}

export const config = {
  // Every page and API request, but not static assets (files with an extension) or Next internals.
  matcher: ["/((?!_next/|.*\\.[A-Za-z0-9]+$).*)"],
};
