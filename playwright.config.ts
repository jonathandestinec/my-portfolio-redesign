import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  webServer: {
    command: "bun run build && bun run start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    // Test-only admin gate values (the real ones live only in Vercel).
    env: {
      ADMIN_ENTRY_PATH: "/studio-e2e-gate-01",
      ADMIN_GATE_TOKEN: "e2e-gate-token-0123456789abcdef0123456789abcdef",
    },
    timeout: 240_000,
  },
  use: { baseURL: "http://localhost:3100" },
  projects: [
    {
      name: "desktop",
      use: { browserName: "chromium", viewport: { width: 1440, height: 900 } },
    },
    {
      name: "phone",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
});
