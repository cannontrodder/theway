import { expect, test } from "@playwright/test";

import { trip } from "../src/lib/trip";

const EVENT_COUNT = trip.itinerary.reduce(
  (total, day) => total + day.events.length,
  0,
);

const CHAIN = [
  "Newcastle",
  "Amsterdam",
  "Bilbao",
  "Logroño",
  "Burgos",
  "Bilbao",
  "Amsterdam",
  "Newcastle",
];

const DAY_HEADINGS = [
  "Sunday 4 October",
  "Monday 5 October",
  "Tuesday 6 October",
  "Wednesday 7 October",
  "Thursday 8 October",
  "Friday 9 October",
  "Saturday 10 October",
  "Sunday 11 October",
];

function glance(page: import("@playwright/test").Page) {
  return page.getByRole("region", { name: "The journey at a glance" });
}

test("the homepage strip renders the whole door-to-door chain in order, with dates", async ({
  page,
}) => {
  await page.goto("/");

  const places = glance(page).getByTestId("journey-place");
  await expect(places).toHaveCount(CHAIN.length);

  for (const [index, name] of CHAIN.entries()) {
    await expect(places.nth(index)).toContainText(name);
  }

  await expect(places.nth(0)).toContainText("4 Oct");
  await expect(places.nth(3)).toContainText("5 Oct");
  await expect(places.nth(4)).toContainText("9 Oct");
  await expect(places.nth(5)).toContainText("10 Oct");
  await expect(places.nth(7)).toContainText("11 Oct");
});

test("the strip distinguishes flights, buses and walking by icon", async ({
  page,
}) => {
  const chain = glance(page);
  await page.goto("/");

  await expect(chain.getByTestId("mode-icon-flight")).toHaveCount(4);
  await expect(chain.getByTestId("mode-icon-bus")).toHaveCount(2);
  await expect(chain.getByTestId("mode-icon-walk")).toHaveCount(1);

  const walk = chain.getByTestId("journey-walk");
  await expect(walk).toHaveCount(1);
  await expect(walk.getByTestId("mode-icon-walk")).toBeVisible();
  await expect(chain.getByTestId("journey-leg")).toHaveCount(6);
});

test("the Camino dominates the strip and the transfers give context without competing", async ({
  page,
}) => {
  await page.goto("/");

  const walk = glance(page).getByTestId("journey-walk");
  await expect(walk).toContainText("5-day Camino");
  await expect(walk).toContainText("5–9 Oct");
  await expect(walk).toContainText("~123 km");

  const walkIcon = (await walk.getByTestId("mode-icon-walk").boundingBox())!;
  const transferIcons = glance(page)
    .getByTestId("journey-leg")
    .getByTestId(/mode-icon-/);
  for (let index = 0; index < (await transferIcons.count()); index += 1) {
    const box = (await transferIcons.nth(index).boundingBox())!;
    expect(box.width).toBeLessThan(walkIcon.width);
  }

  const caminoType = await walk
    .getByText("5-day Camino")
    .evaluate((node) => getComputedStyle(node).fontSize);
  const transferType = await glance(page)
    .getByTestId("journey-leg")
    .first()
    .getByText("Flight")
    .evaluate((node) => getComputedStyle(node).fontSize);
  expect(parseFloat(caminoType)).toBeGreaterThan(parseFloat(transferType));
});

test("the walking rail is drawn solid while the transfer rails are dashed", async ({
  page,
}) => {
  await page.goto("/");

  const styleOf = (testId: string) =>
    glance(page)
      .getByTestId(testId)
      .first()
      .locator("span[aria-hidden='true']")
      .evaluate((node) => {
        const style = getComputedStyle(node);
        return [style.borderTopStyle, style.borderLeftStyle].join(" ");
      });

  expect(await styleOf("journey-walk")).toContain("solid");
  expect(await styleOf("journey-leg")).toContain("dashed");
});

test("every leg in the strip carries its Status", async ({ page }) => {
  await page.goto("/");

  const legs = glance(page).getByTestId(/journey-(leg|walk)/);
  await expect(legs).toHaveCount(7);

  const statuses = await legs.getByTestId("status-chip").allInnerTexts();
  expect(statuses).toEqual([
    "PLANNED",
    "PLANNED",
    "TO VERIFY",
    "PROPOSED",
    "TO VERIFY",
    "PLANNED",
    "PLANNED",
  ]);
});

test("the strip links to the full itinerary", async ({ page }) => {
  await page.goto("/");

  await glance(page).getByRole("link", { name: /Full itinerary/ }).click();
  await expect(page).toHaveURL(/\/itinerary\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "4–11 October 2026",
  );
});

test("the header nav reaches the itinerary", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Itinerary" })
    .click();
  await expect(page).toHaveURL(/\/itinerary\/$/);
});

test("the itinerary shows all eight days, 4 to 11 October, each with its date and day name", async ({
  page,
}) => {
  await page.goto("/itinerary/");

  const days = page.getByTestId("itinerary-day");
  await expect(days).toHaveCount(8);

  for (const [index, heading] of DAY_HEADINGS.entries()) {
    await expect(days.nth(index).getByRole("heading", { level: 3 })).toHaveText(
      heading,
    );
    await expect(days.nth(index)).toContainText(`Day ${index + 1} of 8`);
  }
});

test("every itinerary Day carries its summary and its events", async ({ page }) => {
  await page.goto("/itinerary/");

  const days = page.getByTestId("itinerary-day");
  await expect(days.nth(0)).toContainText(
    "Fly Newcastle to Bilbao via Amsterdam and stay in Bilbao.",
  );
  await expect(days.nth(0).getByTestId("itinerary-event")).toHaveCount(2);
  await expect(days.nth(0)).toContainText("NCL → AMS → BIO");
  await expect(days.nth(0)).toContainText("05:45–11:15 approx");

  await expect(days.nth(1)).toContainText(
    "Bus Bilbao to Logroño, then begin Camino and walk to Nájera.",
  );
  await expect(days.nth(1)).toContainText("Bilbao → Logroño");
  await expect(days.nth(1)).toContainText("Logroño → Nájera");
  await expect(days.nth(1)).toContainText("28.7 km");

  await expect(days.nth(7)).toContainText("BIO → AMS → NCL");
  await expect(days.nth(7)).toContainText("17:15–22:55 approx");

  const events = page.getByTestId("itinerary-event");
  await expect(events).toHaveCount(EVENT_COUNT);
  for (let index = 0; index < EVENT_COUNT; index += 1) {
    await expect(events.nth(index).getByTestId("status-chip")).toBeVisible();
  }
});

test("flights read as PLANNED, buses as TO VERIFY and accommodation as the data says", async ({
  page,
}) => {
  await page.goto("/itinerary/");

  const events = page.getByTestId("itinerary-event");
  const statusOf = (kind: string) =>
    events.filter({ hasText: kind }).getByTestId("status-chip").allInnerTexts();

  expect(await statusOf("FLIGHT")).toEqual(["PLANNED", "PLANNED"]);
  expect(await statusOf("BUS")).toEqual(["TO VERIFY", "TO VERIFY"]);
  expect(await statusOf("ACCOMMODATION")).toEqual([
    "TO BOOK",
    "PROPOSED",
    "PROPOSED",
    "PROPOSED",
    "PROPOSED",
    "TO BOOK",
    "TO BOOK",
  ]);
});

test("the Friday Burgos finish and the night out read as FIXED", async ({
  page,
}) => {
  await page.goto("/itinerary/");

  const friday = page.getByTestId("itinerary-day").nth(5);
  await expect(friday.getByRole("heading", { level: 3 })).toHaveText(
    "Friday 9 October",
  );

  const evening = friday
    .getByTestId("itinerary-event")
    .filter({ hasText: "EVENING" });
  await expect(evening).toContainText("Proper Friday night out in Burgos");
  await expect(evening.getByTestId("status-chip")).toHaveText("FIXED");

  const finish = friday.getByTestId("fixed-finish");
  await expect(finish).toContainText("Walking into Burgos today is settled");
  await expect(finish.getByTestId("status-chip")).toHaveText("FIXED");
});

test("the walk to Burgos still reads PROPOSED, never as a Status the data does not hold", async ({
  page,
}) => {
  await page.goto("/itinerary/");

  const walk = page
    .getByTestId("itinerary-day")
    .nth(5)
    .getByTestId("itinerary-event")
    .filter({ hasText: "WALK" });
  await expect(walk.getByTestId("status-chip")).toHaveText("PROPOSED");

  const text = await page.locator("body").innerText();
  expect(text).not.toContain("proposed_with_fixed_finish");
  expect(text).not.toContain("superseded");
  expect(text).not.toContain("planned_not_booked");
});

test("each walking Day links to its Stage page, and the non-walking Days do not", async ({
  page,
}) => {
  await page.goto("/itinerary/");

  const links = page.getByTestId("itinerary-stage-link");
  await expect(links).toHaveCount(5);
  await expect(links).toHaveText([
    "Stage 1 →",
    "Stage 2 →",
    "Stage 3 →",
    "Stage 4 →",
    "Stage 5 →",
  ]);

  for (const index of [0, 6, 7]) {
    await expect(
      page.getByTestId("itinerary-day").nth(index).getByTestId("itinerary-stage-link"),
    ).toHaveCount(0);
  }

  await links.first().click();
  await expect(page).toHaveURL(/\/day\/1\/$/);
});

test("the itinerary states its own Status and the trip's span", async ({ page }) => {
  await page.goto("/itinerary/");

  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1 })).toHaveText(
    "4–11 October 2026",
  );
  await expect(main).toContainText("eight days, five of them walking");
  await expect(main).toContainText("Door to door from Newcastle upon Tyne");
  await expect(main.getByTestId("status-chip").first()).toHaveText("FIXED");
});

test("the itinerary reads at mobile width without horizontal scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/itinerary/");

  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  expect(scrollWidth).toBeLessThanOrEqual(320);

  for (const testId of ["itinerary-day", "itinerary-event"]) {
    const nodes = page.getByTestId(testId);
    for (let index = 0; index < (await nodes.count()); index += 1) {
      const box = (await nodes.nth(index).boundingBox())!;
      expect(box.x + box.width).toBeLessThanOrEqual(320);
    }
  }
});

test("the journey strip reads at mobile width without horizontal scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");

  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);

  const steps = glance(page).getByRole("listitem");
  for (let index = 0; index < (await steps.count()); index += 1) {
    const box = (await steps.nth(index).boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(320);
  }
});

test("every fact on the itinerary comes from the trip data, with no hardcoded stand-ins", async ({
  page,
}) => {
  await page.goto("/itinerary/");

  const text = await page.locator("body").innerText();
  for (const placeholder of ["TBC", "TODO", "Lorem", "XX", "example.com"]) {
    expect(text).not.toContain(placeholder);
  }
  expect(await page.locator("img").count()).toBe(0);
});
