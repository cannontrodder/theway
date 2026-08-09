import { expect, test } from "@playwright/test";

const OPEN_ITEM_COUNT = 19;

const OPEN_ITEMS = [
  { text: "Book flights", status: "TO BOOK", href: "/travel/" },
  {
    text: "Reverify exact KLM flight numbers and October 2026 timings",
    status: "TO VERIFY",
    href: "/travel/",
  },
  {
    text: "Select and book Sunday Bilbao hotel",
    status: "TO BOOK",
    href: "/stays/",
  },
  {
    text: "Verify Monday Bilbao to Logroño bus timetable",
    status: "TO VERIFY",
    href: "/travel/",
  },
  {
    text: "Review whether Logroño to Nájera is too long after the Monday bus",
    status: "PROPOSED",
    href: "/day/1/",
  },
  {
    text: "Review the Belorado to Atapuerca stage for terrain and October daylight",
    status: "PROPOSED",
    href: "/day/4/",
  },
  {
    text: "Obtain authoritative Camino GPX or GeoJSON for Logroño to Burgos",
    status: "TO DO",
    href: undefined,
  },
  {
    text: "Research and book Camino accommodation for Monday through Thursday",
    status: "TO BOOK",
    href: "/stays/",
  },
  {
    text: "Choose central Burgos hotel for Friday",
    status: "TO BOOK",
    href: "/stays/",
  },
  {
    text: "Choose Bilbao hotel for Saturday",
    status: "TO BOOK",
    href: "/stays/",
  },
  {
    text: "Plan Friday night restaurants and bars in Burgos",
    status: "TO DO",
    href: undefined,
  },
  {
    text: "Verify and book Burgos to Bilbao bus for Saturday",
    status: "TO VERIFY",
    href: "/travel/",
  },
  {
    text: "Plan Saturday afternoon/evening in Bilbao",
    status: "TO DO",
    href: undefined,
  },
  {
    text: "Determine airport transfer arrangements in Bilbao",
    status: "TO DO",
    href: "/travel/",
  },
  {
    text: "Add elevation profiles for all five walking days",
    status: "TO DO",
    href: undefined,
  },
  {
    text: "Plan Sunday activities in Bilbao before airport departure",
    status: "TO DO",
    href: "/travel/",
  },
  {
    text: "Add realistic walking-time estimates including breaks",
    status: "TO DO",
    href: undefined,
  },
  {
    text: "Add sunrise, sunset and expected October weather",
    status: "TO DO",
    href: undefined,
  },
  {
    text: "Research cafes, lunch stops, water, shops and pharmacies for every stage",
    status: "TO DO",
    href: undefined,
  },
];

async function openEveryPanel(page: import("@playwright/test").Page) {
  for (const testId of ["open-items-panel", "highlights-panel"]) {
    const panel = page.getByTestId(testId);
    if (!(await panel.locator("> div").isVisible())) {
      await panel.getByRole("heading").first().click();
    }
    await expect(panel.locator("> div")).toBeVisible();
  }
}

test("Up next names the first Stage by date, with its route, distance and Status", async ({
  page,
}) => {
  await page.goto("/");

  const panel = page.getByTestId("up-next");
  await expect(panel.getByRole("heading", { name: "Up next" })).toBeVisible();
  await expect(panel).toContainText("Stage 1 of 5");
  await expect(panel).toContainText("Monday 5 October");
  await expect(panel.getByText("Logroño → Nájera")).toBeVisible();
  await expect(panel).toContainText("28.7 km");
  await expect(panel).toContainText("Long");
  await expect(panel).toContainText("Nájera");
  await expect(panel.getByTestId("up-next-status")).toHaveText("PROPOSED");
});

test("Up next carries a plain-language note and a button through to that Stage", async ({
  page,
}) => {
  await page.goto("/");

  const panel = page.getByTestId("up-next");
  await expect(panel.getByTestId("up-next-transport")).toContainText(
    "Bus from Bilbao to Logroño",
  );
  await expect(panel.getByTestId("up-next-note")).toContainText(
    "Nearly 29 km of walking after travelling from Bilbao to Logroño",
  );

  const button = panel.getByTestId("up-next-link");
  await expect(button).toHaveText("View Stage 1 →");
  await expect(button).toHaveAttribute("href", "/day/1/");

  const box = (await button.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);

  await button.click();
  await expect(page).toHaveURL(/\/day\/1\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Logroño → Nájera",
  );
});

test("Up next never says Day where it means Stage", async ({ page }) => {
  await page.goto("/");

  const text = await page.getByTestId("up-next").innerText();
  expect(text).not.toMatch(/\bDay \d/);
  expect(text).toContain("Stage 1");
});

test("the To book / to verify panel lists every open item with its Status", async ({
  page,
}) => {
  await page.goto("/");
  await openEveryPanel(page);

  const panel = page.getByTestId("open-items-panel");
  await expect(
    panel.getByRole("heading", { name: "To book / to verify" }),
  ).toBeVisible();

  const items = panel.getByTestId("open-item");
  await expect(items).toHaveCount(OPEN_ITEM_COUNT);
  expect(OPEN_ITEMS).toHaveLength(OPEN_ITEM_COUNT);

  for (const expected of OPEN_ITEMS) {
    const row = items.filter({ hasText: expected.text });
    await expect(row).toHaveCount(1);
    await expect(row.getByTestId("open-item-status")).toHaveText(
      expected.status,
    );
  }
});

test("the open items are grouped with the highest priority first", async ({
  page,
}) => {
  await page.goto("/");
  await openEveryPanel(page);

  const panel = page.getByTestId("open-items-panel");
  await expect(panel.getByTestId("open-items-group")).toHaveText([
    "High priority",
    "Medium priority",
    "Low priority",
  ]);

  const firstItem = panel.getByTestId("open-item").first();
  await expect(firstItem).toContainText("Book flights");
});

test("bus and flight items link to Travel, and accommodation items to Stays", async ({
  page,
}) => {
  await page.goto("/");
  await openEveryPanel(page);

  const items = page.getByTestId("open-items-panel").getByTestId("open-item");

  for (const expected of OPEN_ITEMS) {
    const link = items
      .filter({ hasText: expected.text })
      .getByTestId("open-item-link");
    if (expected.href === undefined) {
      await expect(link).toHaveCount(0);
    } else {
      await expect(link).toHaveAttribute("href", expected.href);
    }
  }
});

test("the panel does not silently truncate — it says it shows them all", async ({
  page,
}) => {
  await page.goto("/");
  await openEveryPanel(page);

  const panel = page.getByTestId("open-items-panel");
  await expect(panel.getByTestId("open-items-count")).toContainText(
    `All ${OPEN_ITEM_COUNT} open items`,
  );
  await expect(panel.getByTestId("open-items-count")).toContainText(
    "Nothing is left out",
  );
  await expect(panel.getByTestId("open-item")).toHaveCount(OPEN_ITEM_COUNT);
});

test("an open item link lands on the page it names", async ({ page }) => {
  await page.goto("/");
  await openEveryPanel(page);

  await page
    .getByTestId("open-items-panel")
    .getByTestId("open-item")
    .filter({ hasText: "Choose central Burgos hotel" })
    .getByTestId("open-item-link")
    .click();

  await expect(page).toHaveURL(/\/stays\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Where we sleep",
  );
});

test("the Highlights panel carries the Friday night in Burgos and the weekend in Bilbao", async ({
  page,
}) => {
  await page.goto("/");
  await openEveryPanel(page);

  const panel = page.getByTestId("highlights-panel");
  await expect(panel.getByRole("heading", { name: "Highlights" })).toBeVisible();

  const highlights = panel.getByTestId("highlight");
  await expect(highlights).toHaveCount(2);

  const burgos = highlights.first();
  await expect(burgos.getByRole("heading")).toHaveText("Burgos on the Friday");
  await expect(burgos).toContainText("Friday 9 October");
  await expect(burgos).toContainText("proper night out after completing the walk");
  await expect(burgos).toContainText("Walking into Burgos that day is settled");
  await expect(burgos.getByTestId("highlight-fact")).toHaveCount(2);
  await expect(burgos.getByTestId("highlight-status")).toHaveText([
    "FIXED",
    "FIXED",
  ]);
  await expect(burgos.getByTestId("highlight-link")).toHaveAttribute(
    "href",
    "/day/5/",
  );

  const bilbao = highlights.last();
  await expect(bilbao.getByRole("heading")).toHaveText(
    "The weekend in Bilbao",
  );
  await expect(bilbao).toContainText("10–11 Oct");
  await expect(bilbao).toContainText("Saturday and Sunday in Bilbao");
  await expect(bilbao).toContainText("Newcastle upon Tyne");
  await expect(bilbao.getByTestId("highlight-status")).toHaveText("FIXED");
  await expect(bilbao.getByTestId("highlight-link")).toHaveAttribute(
    "href",
    "/stays/#night-2026-10-10",
  );
});

test("each highlight carries an empty image slot rather than a photograph", async ({
  page,
}) => {
  await page.goto("/");
  await openEveryPanel(page);

  const highlights = page.getByTestId("highlights-panel").getByTestId("highlight");
  for (const highlight of await highlights.all()) {
    await expect(highlight.getByTestId("image-slot")).toBeVisible();
  }
  await expect(page.locator("img")).toHaveCount(0);
});

test("at phone width the lower panels collapse and expand on tap", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/");

  for (const testId of ["open-items-panel", "highlights-panel"] as const) {
    const panel = page.getByTestId(testId);
    const heading = panel.getByRole("heading").first();
    const body = panel.locator("> div");

    await expect(heading).toBeVisible();
    await expect(body).toBeHidden();

    const tapTarget = (await heading.boundingBox())!;
    expect(tapTarget.height).toBeGreaterThanOrEqual(20);
    const summary = (await panel.locator("summary").boundingBox())!;
    expect(summary.height).toBeGreaterThanOrEqual(44);

    await heading.click();
    await expect(body).toBeVisible();

    await heading.click();
    await expect(body).toBeHidden();
  }
});

test("Up next stays open at phone width, because it is the answer above all", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/");

  await expect(page.getByTestId("up-next").getByTestId("up-next-link")).toBeVisible();
});

test("at desktop width the lower panels are open and cannot be collapsed", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  for (const testId of ["open-items-panel", "highlights-panel"] as const) {
    const panel = page.getByTestId(testId);
    const body = panel.locator("> div");
    await expect(body).toBeVisible();

    await panel.getByRole("heading").first().click({ force: true });
    await expect(body).toBeVisible();
  }
});

test("all three lower panels fit within phone width without sideways scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await openEveryPanel(page);

  for (const testId of ["up-next", "open-items-panel", "highlights-panel"]) {
    const box = (await page.getByTestId(testId).boundingBox())!;
    expect(box.width).toBeLessThanOrEqual(320);
  }
});

test("no open item or highlight leaks a booking reference or a personal name", async ({
  page,
}) => {
  await page.goto("/");
  await openEveryPanel(page);

  const text = (
    await page
      .locator(
        '[data-testid="up-next"], [data-testid="open-items-panel"], [data-testid="highlights-panel"]',
      )
      .allInnerTexts()
  )
    .join(" ")
    .toLowerCase();

  for (const forbidden of ["neil", "trodden", "cannontrodder", "booking ref"]) {
    expect(text).not.toContain(forbidden);
  }
  expect(text).not.toContain("booked");
});
