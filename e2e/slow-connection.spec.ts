import { expect, test } from "@playwright/test";

const SLOW_3G = {
  offline: false,
  downloadThroughput: (400 * 1024) / 8,
  uploadThroughput: (400 * 1024) / 8,
  latency: 400,
};

test("the homepage becomes usable on a throttled mobile connection without waiting for the map", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "network throttling needs the CDP session");

  const session = await page.context().newCDPSession(page);
  await session.send("Network.enable");
  await session.send("Network.emulateNetworkConditions", SLOW_3G);

  const startedAt = Date.now();
  await page.goto("/", { waitUntil: "commit" });

  const hero = page.getByRole("region", { name: "The Way" });
  await expect(hero.getByRole("heading", { level: 1 })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("region", { name: "Headline figures" })).toBeVisible();
  await expect(page.getByTestId("up-next")).toContainText("Stage 1 of 5");
  await expect(page.getByRole("link", { name: "View Stage 1 →" })).toBeVisible();
  await expect(page.getByTestId("route-sketch").first()).toBeVisible();
  await expect(page.getByTestId("indicative-label").first()).toBeVisible();

  const readableAfter = Date.now() - startedAt;
  const stillDownloading = await page.evaluate(
    () => document.readyState !== "complete",
  );

  expect(
    readableAfter,
    "the answer took too long to become readable on a slow connection",
  ).toBeLessThan(3_000);
  expect(
    stillDownloading,
    "the page only became readable once every asset had arrived",
  ).toBe(true);
});

test("the shape of the walk is server-rendered, so it survives a map that never loads", async ({
  page,
}) => {
  await page.route("**/tiles.openfreemap.org/**", (route) => route.abort());
  await page.route("**/maplibre/**", (route) => route.abort());

  await page.goto("/");

  const sketch = page.getByTestId("route-sketch").first();
  await expect(sketch).toBeVisible();
  for (let stage = 1; stage <= 5; stage += 1) {
    await expect(sketch.getByTestId(`sketch-stage-${stage}`)).toBeAttached();
  }
  await expect(page.getByTestId("indicative-label").first()).toBeVisible();
});
