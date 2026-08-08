import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3000";

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "on-first-retry" },
  projects: [
    { name: "unit", testDir: "./tests/unit" },
    { name: "mobile", testDir: "./e2e", use: { ...devices["Pixel 7"] } },
    { name: "desktop", testDir: "./e2e", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run serve",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
