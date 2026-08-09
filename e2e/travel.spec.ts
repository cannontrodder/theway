import { expect, test } from "@playwright/test";

const LEGS = [
  {
    kind: "Flight",
    date: "Sunday 4 October",
    route: "Newcastle → Amsterdam → Bilbao",
    status: "PLANNED",
    detail: "KLM",
    times: "05:45–11:15 approx",
  },
  {
    kind: "Bus",
    date: "Monday 5 October",
    route: "Bilbao → Logroño",
    status: "TO VERIFY",
    detail: "ALSA or applicable regional operator",
    times: "approximately 1 hour 45 minutes to 2 hours",
  },
  {
    kind: "Bus",
    date: "Saturday 10 October",
    route: "Burgos → Bilbao",
    status: "TO VERIFY",
    detail: "ALSA",
    times: "approximately 1 hour 45 minutes for a fast direct service",
  },
  {
    kind: "Flight",
    date: "Sunday 11 October",
    route: "Bilbao → Amsterdam → Newcastle",
    status: "PLANNED",
    detail: "KLM",
    times: "17:15–22:55 approx",
  },
];

test("the header nav reaches Travel in one tap on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/");

  const toggle = page.getByRole("button", { name: "Menu" });
  await expect(toggle).toBeVisible();
  await toggle.click();

  const link = page
    .getByRole("navigation", { name: "Menu" })
    .getByRole("link", { name: "Travel" });
  const box = (await link.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(24);

  await link.click();
  await expect(page).toHaveURL(/\/travel\/$/);
});

test("Travel lists every leg of the journey out and back, in date order", async ({
  page,
}) => {
  await page.goto("/travel/");

  const legs = page.getByTestId("travel-leg");
  await expect(legs).toHaveCount(LEGS.length);

  for (const [index, leg] of LEGS.entries()) {
    const row = legs.nth(index);
    await expect(row).toContainText(leg.kind);
    await expect(row).toContainText(leg.date);
    await expect(row).toContainText(leg.route);
    await expect(row).toContainText(leg.detail);
    await expect(row).toContainText(leg.times);
    await expect(row.getByTestId("travel-leg-status")).toHaveText(leg.status);
  }
});

test("both flights read as PLANNED and both buses as TO VERIFY", async ({
  page,
}) => {
  await page.goto("/travel/");

  const statusOf = (kind: string) =>
    page
      .getByTestId("travel-leg")
      .filter({ hasText: kind })
      .getByTestId("travel-leg-status")
      .allInnerTexts();

  expect(await statusOf("Flight")).toEqual(["PLANNED", "PLANNED"]);
  expect(await statusOf("Bus")).toEqual(["TO VERIFY", "TO VERIFY"]);
});

test("the flights carry the note that October 2026 numbers and times need rechecking", async ({
  page,
}) => {
  await page.goto("/travel/");

  const flights = page.getByTestId("travel-leg").filter({ hasText: "Flight" });
  await expect(flights).toHaveCount(2);
  await expect(flights.first()).toContainText(
    "exact flight numbers and times must be rechecked against the bookable October 2026 schedule",
  );
  await expect(flights.nth(1)).toContainText(
    "Exact October 2026 flight numbers, timings and fare must be confirmed before booking.",
  );
});

test("the buses name their likely operator and likely stations", async ({
  page,
}) => {
  await page.goto("/travel/");

  const buses = page.getByTestId("travel-leg").filter({ hasText: "Bus" });
  await expect(buses).toHaveCount(2);
  await expect(buses.first()).toContainText(
    "Bilbao Intermodal → Logroño Bus Station",
  );
  await expect(buses.nth(1)).toContainText(
    "Burgos Bus Station → Bilbao Intermodal",
  );
  for (const bus of await buses.all()) {
    await expect(bus).toContainText("Likely operator");
    await expect(bus).toContainText("Likely stations");
  }
});

test("the Bilbao to Logroño bus says its timetable decides whether Stage 1 is sensible", async ({
  page,
}) => {
  await page.goto("/travel/");

  const bus = page.getByTestId("travel-leg").filter({ hasText: "Bilbao → Logroño" });
  await expect(bus).toContainText("the exact timetable materially affects");
  await expect(bus).toContainText("28.7 km");

  const link = bus.getByRole("link", { name: /Stage 1/ });
  await expect(link).toHaveAttribute("href", "/day/1/");
  await link.click();
  await expect(page).toHaveURL(/\/day\/1\/$/);
});

test("nothing on Travel reads as a booking, because nothing is booked", async ({
  page,
}) => {
  await page.goto("/travel/");

  const main = page.getByRole("main");
  await expect(main).toContainText("Nothing here is booked yet");

  const text = await main.innerText();
  for (const word of ["BOOKED", "Booking reference", "Confirmation", "Seat "]) {
    expect(text).not.toContain(word);
  }

  const statuses = await main
    .getByTestId(/^(status-chip|travel-leg-status)$/)
    .allInnerTexts();
  expect(statuses.length).toBeGreaterThanOrEqual(8);
  for (const status of statuses) {
    expect(["PLANNED", "TO VERIFY", "PROPOSED", "TO BOOK", "APPROX"]).toContain(
      status,
    );
  }
});

test("the Saturday bus's plan does not imply a hotel is already held", async ({
  page,
}) => {
  await page.goto("/travel/");

  const bus = page
    .getByTestId("travel-leg")
    .filter({ hasText: "Burgos → Bilbao" });
  await expect(bus).toContainText("check into the Bilbao hotel");
  await expect(bus).toContainText(
    "That night is in Bilbao, no property chosen yet",
  );
  await expect(bus.getByTestId("travel-stays-link")).toHaveAttribute(
    "href",
    "/stays/#night-2026-10-10",
  );
  await expect(
    bus.getByTestId("status-chip").filter({ hasText: "TO BOOK" }),
  ).toBeVisible();
});

test("the walking that follows a leg states that its distance is approximate", async ({
  page,
}) => {
  await page.goto("/travel/");

  const bus = page
    .getByTestId("travel-leg")
    .filter({ hasText: "Bilbao → Logroño" });
  const walking = bus.getByText(/The walking that follows/);
  await expect(walking).toContainText("28.7 km");
  await expect(
    bus.getByTestId("status-chip").filter({ hasText: "APPROX" }),
  ).toBeVisible();
});

test("Travel calls a walking day a Stage, never Day N", async ({ page }) => {
  await page.goto("/travel/");

  const text = await page.getByRole("main").innerText();
  expect(text).not.toMatch(/\bDay \d\b/);
  expect(text).toContain("whether Stage 1 is sensible");
});

test("the nav still fits across tablet widths now that it carries six links", async ({
  page,
}) => {
  for (const width of [640, 768, 820, 1024]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/travel/");

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);

    const header = (await page.getByRole("banner").boundingBox())!;
    expect(header.width).toBeLessThanOrEqual(width);
  }
});

test("Travel distinguishes flights from buses by icon", async ({ page }) => {
  await page.goto("/travel/");

  const legs = page.getByTestId("travel-leg");
  await expect(legs.getByTestId("mode-icon-flight")).toHaveCount(2);
  await expect(legs.getByTestId("mode-icon-bus")).toHaveCount(2);
});

test("Travel shows no placeholder text and no raw data keys", async ({ page }) => {
  await page.goto("/travel/");

  const text = await page.locator("body").innerText();
  for (const placeholder of ["TBC", "TODO", "Lorem", "undefined", "null"]) {
    expect(text).not.toContain(placeholder);
  }
  expect(text).not.toContain("_");
  expect(text).not.toContain("superseded");
});

test("Travel reads at phone width without sideways scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/travel/");

  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);

  const legs = page.getByTestId("travel-leg");
  await expect(legs).toHaveCount(LEGS.length);
  for (let index = 0; index < LEGS.length; index += 1) {
    const box = (await legs.nth(index).boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(320);
  }
});
