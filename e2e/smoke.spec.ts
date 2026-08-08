import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";

test("the homepage renders from the static export", async ({ page }) => {
  await page.goto("/");

  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1 })).toHaveText("The Way");
  await expect(main.getByText("Our Camino. Our Journey.")).toBeVisible();
  await expect(
    main.getByText("Logroño to Burgos, 4–11 October 2026."),
  ).toBeVisible();
});

test("the export writes each route as a directory index, so no host rewrite rules are needed", () => {
  expect(existsSync("out/_not-found/index.html")).toBe(true);
  expect(existsSync("out/_not-found.html")).toBe(false);
});
