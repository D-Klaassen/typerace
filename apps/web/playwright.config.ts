import { defineConfig, devices } from "@playwright/test";

// Overridable so e2e runs in parallel worktrees don't share servers.
const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 3100);
const ROOMS_PORT = Number(process.env.E2E_ROOMS_PORT ?? 8788);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: `pnpm --dir ../rooms exec wrangler dev --port ${ROOMS_PORT}`,
      port: ROOMS_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `pnpm build && pnpm start --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      env: { NEXT_PUBLIC_ROOMS_HOST: `localhost:${ROOMS_PORT}` },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
