import { expect, test } from "@playwright/test";

const STAGES = [
  {
    number: 1,
    path: "/day/1/",
    date: "Mon 5 Oct",
    route: "Logroño → Nájera",
    distance: "28.7 km",
    difficulty: "Long",
    overnight: "Nájera",
    waypoints: ["Navarrete", "Ventosa"],
  },
  {
    number: 2,
    path: "/day/2/",
    date: "Tue 6 Oct",
    route: "Nájera → Santo Domingo de la Calzada",
    distance: "21.7 km",
    difficulty: "Moderate",
    overnight: "Santo Domingo de la Calzada",
    waypoints: ["Azofra", "Cirueña"],
  },
  {
    number: 3,
    path: "/day/3/",
    date: "Wed 7 Oct",
    route: "Santo Domingo de la Calzada → Belorado",
    distance: "22.7 km",
    difficulty: "Moderate",
    overnight: "Belorado",
    waypoints: [
      "Grañón",
      "Redecilla del Camino",
      "Castildelgado",
      "Viloria de Rioja",
      "Villamayor del Río",
    ],
  },
  {
    number: 4,
    path: "/day/4/",
    date: "Thu 8 Oct",
    route: "Belorado → Atapuerca",
    distance: "29.9 km",
    difficulty: "Long and more demanding",
    overnight: "Atapuerca",
    waypoints: [
      "Tosantos",
      "Villambistia",
      "Espinosa del Camino",
      "Villafranca Montes de Oca",
      "San Juan de Ortega",
      "Agés",
    ],
  },
  {
    number: 5,
    path: "/day/5/",
    date: "Fri 9 Oct",
    route: "Atapuerca → Burgos",
    distance: "20.2 km",
    difficulty: "Moderate",
    overnight: "Burgos",
    waypoints: ["Cardeñuela Riopico", "Orbaneja Riopico", "Villafría"],
  },
];

test("five Stage cards sit on the homepage in day order", async ({ page }) => {
  await page.goto("/");

  const cards = page
    .getByRole("region", { name: "Walking days" })
    .getByTestId("stage-card");
  await expect(cards).toHaveCount(5);

  for (const [index, stage] of STAGES.entries()) {
    const card = cards.nth(index);
    await expect(card).toContainText(String(stage.number));
    await expect(card).toContainText(stage.date);
    await expect(card).toContainText(stage.route);
    await expect(card).toContainText(stage.distance);
    await expect(card).toContainText(stage.difficulty);
    await expect(card).toContainText(stage.overnight);
    await expect(card).toContainText("PROPOSED");
  }
});

test("each Stage card is a single tap through to its Stage page", async ({
  page,
}) => {
  await page.goto("/");

  const cards = page
    .getByRole("region", { name: "Walking days" })
    .getByTestId("stage-card");

  for (const stage of STAGES) {
    const link = cards.nth(stage.number - 1).getByRole("link");
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute("href", stage.path);

    const box = (await link.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});

test("tapping a Stage card opens that Stage page", async ({ page }) => {
  await page.goto("/");

  await page
    .getByTestId("stage-card")
    .first()
    .getByRole("link")
    .click();

  await expect(page).toHaveURL(/\/day\/1\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Logroño → Nájera",
  );
});

test("the Walking days section is the first thing below the headline figures", async ({
  page,
}) => {
  await page.goto("/");

  const figures = (await page
    .getByRole("region", { name: "Headline figures" })
    .boundingBox())!;
  const cardsBox = (await page
    .getByRole("region", { name: "Walking days" })
    .boundingBox())!;

  expect(cardsBox.y).toBeGreaterThanOrEqual(figures.y + figures.height - 1);
  expect(cardsBox.y - (figures.y + figures.height)).toBeLessThan(80);
});

test("the first Stage card needs no sideways scrolling and no menu to reach", async ({
  page,
}) => {
  await page.goto("/");

  const cards = page.getByRole("region", { name: "Walking days" });
  await expect(cards).toBeVisible();

  const scroller = page.getByTestId("stage-card-scroller");
  expect(await scroller.evaluate((node) => node.scrollLeft)).toBe(0);

  const scrollerBox = (await scroller.boundingBox())!;
  const firstCardBox = (await page.getByTestId("stage-card").first().boundingBox())!;
  expect(firstCardBox.x).toBeGreaterThanOrEqual(scrollerBox.x - 1);
  expect(firstCardBox.x + firstCardBox.width).toBeLessThanOrEqual(
    scrollerBox.x + scrollerBox.width + 1,
  );
});

for (const stage of STAGES) {
  test(`Stage ${stage.number} shows its date, distance, difficulty, Overnight and Waypoints`, async ({
    page,
  }) => {
    await page.goto(stage.path);

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      stage.route,
    );
    const main = page.getByRole("main");
    await expect(main).toContainText(`Stage ${stage.number}`);
    await expect(main).toContainText(stage.date);
    await expect(main).toContainText("PROPOSED");

    const distance = main.getByRole("listitem").filter({ hasText: "Distance" });
    await expect(distance).toContainText(stage.distance);
    await expect(distance.getByText("APPROX")).toBeVisible();

    await expect(
      main.getByRole("listitem").filter({ hasText: "Difficulty" }),
    ).toContainText(stage.difficulty);

    const overnight = main.getByRole("region", { name: "Overnight" });
    await expect(overnight).toContainText(stage.overnight);

    const waypoints = main.getByRole("region", { name: "Waypoints" });
    await expect(waypoints.getByRole("listitem")).toHaveText(stage.waypoints);
  });
}

test("Stage 1 keeps the late-bus risk visible", async ({ page }) => {
  await page.goto("/day/1/");

  const main = page.getByRole("main");
  await expect(main).toContainText("Bus from Bilbao to Logroño");
  await expect(main).toContainText("Nearly 29 km of walking");
  await expect(main).toContainText("A late bus arrival could make this stage");
});

test("Stage 4 keeps the Montes de Oca terrain note visible", async ({ page }) => {
  await page.goto("/day/4/");

  await expect(page.getByRole("main")).toContainText(
    "The Montes de Oca section makes this more demanding than a flat 30 km day.",
  );
});

test("Stage 5 reads as PROPOSED while stating the fixed Burgos finish and the evening plan", async ({
  page,
}) => {
  await page.goto("/day/5/");

  const main = page.getByRole("main");
  await expect(main.getByTestId("stage-status")).toHaveText("PROPOSED");

  const finish = main.getByTestId("fixed-finish");
  await expect(finish).toContainText("Burgos");
  await expect(finish).toContainText("Fri 9 Oct");
  await expect(finish.getByText("FIXED")).toBeVisible();

  await expect(main).toContainText("Night out in Burgos");
  await expect(main).toContainText("proper Friday night out");
  await expect(main).not.toContainText("proposed_with_fixed_finish");
});

test("each Stage page reaches the night's accommodation and an orientation-only map", async ({
  page,
}) => {
  for (const stage of STAGES) {
    await page.goto(stage.path);
    const main = page.getByRole("main");

    const overnight = main.getByRole("region", { name: "Overnight" });
    await expect(overnight).toContainText(stage.overnight);
    await expect(overnight).toContainText(stage.date);
    await expect(overnight.getByTestId("status-chip")).toBeVisible();

    const maps = main.getByRole("region", { name: "Orientation maps" });
    await expect(maps).toContainText("orientation only");
    await expect(maps).toContainText(
      "should not be presented as authoritative Camino navigation",
    );

    const links = maps.getByRole("link");
    expect(await links.count()).toBeGreaterThan(0);
    for (const link of await links.all()) {
      expect(await link.getAttribute("href")).toContain("google.com/maps");
      await expect(link).toHaveAttribute("rel", /noopener/);
    }
  }
});

test("no Stage page shows a superseded plan or a raw data key", async ({
  page,
}) => {
  for (const stage of STAGES) {
    await page.goto(stage.path);
    const text = await page.locator("body").innerText();
    expect(text).not.toContain("superseded");
    expect(text).not.toContain("original_plan");
    expect(text).not.toContain("_");
  }
});

test("a Stage page fits mobile width without sideways scroll", async ({
  page,
}) => {
  await page.goto("/day/4/");

  const viewport = page.viewportSize()!;
  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  expect(scrollWidth).toBeLessThanOrEqual(viewport.width);
});
