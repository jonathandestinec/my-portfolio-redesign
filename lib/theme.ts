export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

export function resolveTheme(
  stored: string | null,
  prefersDark: boolean,
): Theme {
  if (stored === "dark" || stored === "light") return stored;
  return prefersDark ? "dark" : "light";
}

// Inlined copy of resolveTheme; runs before first paint to avoid a flash.
export const themeInitScript = `(function(){var t=null;try{t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}var d=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.dataset.theme=(t==="dark"||t==="light")?t:(d?"dark":"light")})();`;
