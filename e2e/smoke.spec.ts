import { expect, test } from "@playwright/test";

test("the homepage renders from the static export", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The Way");
  await expect(page.getByText("Our Camino. Our Journey.")).toBeVisible();
  await expect(
    page.getByText("Logroño to Burgos, 4–11 October 2026."),
  ).toBeVisible();
});

test("a trailing-slash URL serves the same page", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  expect(new URL(page.url()).pathname).toBe("/");
});
