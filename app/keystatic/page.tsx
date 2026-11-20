// The admin UI is rendered by the layout and routes itself in the browser.
// proxy.ts serves every /keystatic/... address from this one page.
export default function Page() {
  return null;
}

// Renders nothing on the server, so opt out of instant-navigation validation.
export const instant = false;
