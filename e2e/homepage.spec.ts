import { expect, test } from "@playwright/test";

const HERO_SENTENCE =
  "From Logroño to Burgos over five days in October 2026. Two mates from County Durham walking west.";

test("the hero carries the Wordmark, the strapline and the hero sentence", async ({
  page,
}) => {
  await page.goto("/");

  const hero = page.getByRole("region", { name: "The Way" });
  await expect(hero.getByRole("heading", { level: 1 })).toHaveText("The Way");
  await expect(hero.getByText("Our Camino. Our Journey.").first()).toBeVisible();
  await expect(hero.getByText(HERO_SENTENCE)).toBeVisible();
});

test("the four headline figures render below the hero", async ({ page }) => {
  await page.goto("/");

  const figures = page.getByRole("region", { name: "Headline figures" });
  await expect(figures.getByRole("listitem")).toHaveCount(4);

  await expect(figures.getByText("4–11 Oct 2026")).toBeVisible();
  await expect(figures.getByText("8 days")).toBeVisible();

  await expect(figures.getByText("5 walking days")).toBeVisible();
  await expect(figures.getByText("Mon 5 – Fri 9 Oct")).toBeVisible();

  await expect(figures.getByText("Logroño → Burgos")).toBeVisible();
  await expect(figures.getByText("Camino Francés")).toBeVisible();

  await expect(figures.getByText("~123 km")).toBeVisible();
});

test("the total distance reads as approximate", async ({ page }) => {
  await page.goto("/");

  const distance = page.getByRole("listitem").filter({ hasText: "~123 km" });
  await expect(distance.getByText("APPROX")).toBeVisible();
  await expect(distance).toContainText("distance");
});

test("no names appear anywhere on the homepage", async ({ page }) => {
  await page.goto("/");

  const text = (await page.locator("body").innerText()).toLowerCase();
  const withoutTheDomain = text.replace("theway.cannontrodder.net", "");
  for (const name of ["neil", "trodden", "cannontrodder"]) {
    expect(withoutTheDomain).not.toContain(name);
  }
  expect(text).toContain("two mates from county durham");
});

test("the hero image slot is a flat colour block carrying the Route line, with no photograph", async ({
  page,
}) => {
  await page.goto("/");

  const slot = page
    .getByRole("region", { name: "The Way" })
    .getByTestId("image-slot");
  await expect(slot).toBeVisible();
  await expect(slot.getByTestId("route-line")).toBeVisible();

  await expect(page.locator("img")).toHaveCount(0);

  const background = await slot.evaluate(
    (node) => getComputedStyle(node).backgroundColor,
  );
  expect(["rgb(107, 127, 78)", "rgb(242, 239, 230)"]).toContain(background);
});

test("the hero and the headline figures sit above the fold", async ({ page }) => {
  await page.goto("/");

  const viewportHeight = page.viewportSize()!.height;
  const figures = page.getByRole("region", { name: "Headline figures" });
  const box = (await figures.boundingBox())!;

  expect(box.y + box.height).toBeLessThanOrEqual(viewportHeight);
  await expect(
    page.getByRole("region", { name: "The Way" }).getByText(HERO_SENTENCE),
  ).toBeInViewport();
});
