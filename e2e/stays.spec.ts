import { expect, test } from "@playwright/test";

const NIGHTS = [
  {
    anchor: "night-2026-10-04",
    date: "Sunday 4 October",
    town: "Bilbao",
    status: "TO BOOK",
    note: "Arrival night after flying from Newcastle.",
  },
  {
    anchor: "night-2026-10-05",
    date: "Monday 5 October",
    town: "Nájera",
    status: "PROPOSED",
    note: "Dependent on retaining the current proposed Stage 1.",
  },
  {
    anchor: "night-2026-10-06",
    date: "Tuesday 6 October",
    town: "Santo Domingo de la Calzada",
    status: "PROPOSED",
  },
  {
    anchor: "night-2026-10-07",
    date: "Wednesday 7 October",
    town: "Belorado",
    status: "PROPOSED",
  },
  {
    anchor: "night-2026-10-08",
    date: "Thursday 8 October",
    town: "Atapuerca",
    status: "PROPOSED",
  },
  {
    anchor: "night-2026-10-09",
    date: "Friday 9 October",
    town: "Burgos",
    status: "TO BOOK",
    note: "end-of-Camino celebration night",
  },
  {
    anchor: "night-2026-10-10",
    date: "Saturday 10 October",
    town: "Bilbao",
    status: "TO BOOK",
    note: "Final night before Sunday flight home.",
  },
];

test("the header nav reaches Stays in one tap on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/");

  await page.getByRole("button", { name: "Menu" }).click();
  await page
    .getByRole("navigation", { name: "Menu" })
    .getByRole("link", { name: "Stays" })
    .click();
  await expect(page).toHaveURL(/\/stays\/$/);
});

test("Stays lists all seven nights by date and town, in date order", async ({
  page,
}) => {
  await page.goto("/stays/");

  const nights = page.getByTestId("stay-night");
  await expect(nights).toHaveCount(7);

  for (const [index, night] of NIGHTS.entries()) {
    const row = nights.nth(index);
    await expect(row).toHaveAttribute("id", night.anchor);
    await expect(row).toContainText(night.date);
    await expect(row).toContainText(night.town);
    await expect(row.getByTestId("status-chip")).toHaveText(night.status);
    if (night.note) await expect(row).toContainText(night.note);
  }
});

test("every night says plainly that no property is chosen", async ({ page }) => {
  await page.goto("/stays/");

  const nights = page.getByTestId("stay-night");
  await expect(nights).toHaveCount(NIGHTS.length);
  await expect(page.getByTestId("stay-property")).toHaveCount(NIGHTS.length);
  for (let index = 0; index < NIGHTS.length; index += 1) {
    await expect(nights.nth(index).getByTestId("stay-property")).toHaveText(
      "No property chosen yet",
    );
  }
  await expect(page.getByRole("main")).toContainText(
    "No property is chosen for any night",
  );
});

test("the Friday Burgos night carries the celebration and night-out note", async ({
  page,
}) => {
  await page.goto("/stays/");

  const friday = page.locator("#night-2026-10-09");
  await expect(friday).toContainText("Burgos");
  await expect(friday).toContainText("Friday 9 October");
  await expect(friday).toContainText(
    "This is the end-of-Camino celebration night and should be suitable for going out in central Burgos.",
  );
  await expect(friday.getByTestId("status-chip")).toHaveText("TO BOOK");
});

test("each walking night links back to the Stage that ends there", async ({
  page,
}) => {
  await page.goto("/stays/");

  const links = page.getByTestId("stay-stage-link");
  await expect(links).toHaveCount(5);
  await expect(links).toHaveText([
    "Stage 1 →",
    "Stage 2 →",
    "Stage 3 →",
    "Stage 4 →",
    "Stage 5 →",
  ]);

  for (const anchor of ["night-2026-10-04", "night-2026-10-10"]) {
    await expect(
      page.locator(`#${anchor}`).getByTestId("stay-stage-link"),
    ).toHaveCount(0);
  }

  await links.first().click();
  await expect(page).toHaveURL(/\/day\/1\/$/);
});

test("Stays shows no property name, no address and no booking reference", async ({
  page,
}) => {
  await page.goto("/stays/");

  const text = await page.locator("body").innerText();
  for (const word of ["BOOKED", "Reference", "reference", "Address", "TBC"]) {
    expect(text).not.toContain(word);
  }

  const statuses = await page
    .getByRole("main")
    .getByTestId("status-chip")
    .allInnerTexts();
  expect(statuses).toEqual([
    "TO BOOK",
    "PROPOSED",
    "PROPOSED",
    "PROPOSED",
    "PROPOSED",
    "TO BOOK",
    "TO BOOK",
  ]);
});

test("Stays calls a walking day a Stage, never Day N", async ({ page }) => {
  await page.goto("/stays/");

  const text = await page.getByRole("main").innerText();
  expect(text).not.toMatch(/\bDay \d\b/);
  expect(text).toContain("current proposed Stage 1.");
});

test("Stays reads at phone width without sideways scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/stays/");

  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);

  const nights = page.getByTestId("stay-night");
  await expect(nights).toHaveCount(NIGHTS.length);
  for (let index = 0; index < NIGHTS.length; index += 1) {
    const box = (await nights.nth(index).boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(320);
  }
});

test("each Stage page links its Overnight through to that night on Stays", async ({
  page,
}) => {
  const STAGE_NIGHTS = [
    { path: "/day/1/", anchor: "night-2026-10-05" },
    { path: "/day/2/", anchor: "night-2026-10-06" },
    { path: "/day/3/", anchor: "night-2026-10-07" },
    { path: "/day/4/", anchor: "night-2026-10-08" },
    { path: "/day/5/", anchor: "night-2026-10-09" },
  ];

  for (const stage of STAGE_NIGHTS) {
    await page.goto(stage.path);

    const link = page
      .getByRole("region", { name: "Overnight" })
      .getByTestId("stays-link");
    await expect(link).toHaveAttribute("href", `/stays/#${stage.anchor}`);
  }

  await page.goto("/day/5/");
  await page
    .getByRole("region", { name: "Overnight" })
    .getByTestId("stays-link")
    .click();
  await expect(page).toHaveURL(/\/stays\/#night-2026-10-09$/);
  await expect(page.locator("#night-2026-10-09")).toBeInViewport();
});
