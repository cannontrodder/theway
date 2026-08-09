import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const HEX_STAGE_COLOURS = ["#5F7245", "#2E5B7B", "#9A6A17", "#CF8E1C", "#0F1D34"];

const RGB_STAGE_COLOURS: [number, number, number][] = [
  [95, 114, 69],
  [46, 91, 123],
  [154, 106, 23],
  [207, 142, 28],
  [15, 29, 52],
];

const STAGE_COLOURS = RGB_STAGE_COLOURS.map(
  ([red, green, blue]) => `rgb(${red}, ${green}, ${blue})`,
);

const INDICATIVE = "Indicative — real track to come";

async function measureInk(page: Page, png: Buffer) {
  return page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);

    let pale = 0;
    let saturated = 0;
    let total = 0;
    for (let offset = 0; offset < data.length; offset += 4) {
      const [red, green, blue] = [data[offset], data[offset + 1], data[offset + 2]];
      total += 1;
      if (red > 215 && green > 215 && blue > 205) pale += 1;
      const spread = Math.max(red, green, blue) - Math.min(red, green, blue);
      if (spread > 120) saturated += 1;
    }
    return { paleShare: pale / total, saturatedShare: saturated / total };
  }, png.toString("base64"));
}

async function waitForTheMap(page: Page) {
  const map = page.getByTestId("route-map");
  await expect(map).toHaveAttribute("data-readiness", "ready", { timeout: 30_000 });
  return map;
}

test("the map page renders a MapLibre map that fills its frame", async ({ page }) => {
  await page.goto("/map/");

  const map = await waitForTheMap(page);
  await expect(map.locator("canvas.maplibregl-canvas")).toBeVisible();

  const box = (await map.boundingBox())!;
  expect(box.width).toBeGreaterThan(200);
  expect(box.height).toBeGreaterThan(200);
  expect(box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
});

test("the homepage carries the map as a panel, with a link to the full map", async ({
  page,
}) => {
  await page.goto("/");

  const panel = page.getByRole("region", { name: "The route" });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("heading", { name: "The route" })).toBeVisible();
  await expect(panel.getByText("Logroño to Burgos via the Camino Francés")).toBeVisible();

  await waitForTheMap(page);
  await expect(panel.locator("canvas.maplibregl-canvas")).toBeVisible();

  const openFullMap = panel.getByRole("link", { name: /Open map/ });
  await openFullMap.click();
  await expect(page).toHaveURL(/\/map\/$/);
});

test("the base map is pale and low-contrast so the Route line dominates", async ({
  page,
}) => {
  await page.goto("/map/");
  const map = await waitForTheMap(page);

  const shot = await map.screenshot();
  const paleness = await measureInk(page, shot);

  expect(paleness.paleShare).toBeGreaterThan(0.6);
  expect(paleness.saturatedShare).toBeLessThan(0.02);
});

test("the tile source needs no API key, so nothing secret ships in the JavaScript", async ({
  page,
}) => {
  const tileRequests: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("openfreemap.org")) tileRequests.push(url);
  });

  await page.goto("/map/");
  await waitForTheMap(page);

  expect(tileRequests.length).toBeGreaterThan(0);
  for (const url of tileRequests) {
    expect(url).not.toMatch(/[?&](key|api_?key|access_?token|token)=/i);
  }
});

test("the tile provider attribution is on the page as its licence requires", async ({
  page,
}) => {
  for (const path of ["/map/", "/"]) {
    await page.goto(path);
    const attribution = page.getByTestId("map-attribution");
    await expect(attribution, path).toBeVisible();

    for (const name of ["OpenFreeMap", "OpenMapTiles", "OpenStreetMap"]) {
      await expect(attribution.getByRole("link", { name }), `${name} on ${path}`).toBeVisible();
    }
    await expect(
      attribution.getByRole("link", { name: "OpenStreetMap" }),
    ).toHaveAttribute("href", "https://www.openstreetmap.org/copyright");
  }
});

test("the map fetches real vector tiles, so its worker is genuinely running", async ({
  page,
}) => {
  const vectorTiles: string[] = [];
  page.on("response", (response) => {
    const url = response.url();
    if (url.includes("openfreemap.org") && url.endsWith(".pbf")) {
      vectorTiles.push(`${response.status()} ${url}`);
    }
  });

  await page.goto("/map/");
  await waitForTheMap(page);
  await expect
    .poll(() => vectorTiles.length, { timeout: 20_000 })
    .toBeGreaterThan(0);

  for (const tile of vectorTiles) {
    expect(tile.startsWith("200 "), tile).toBe(true);
  }

  const workerUrl = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .find((name) => name.includes("/maplibre/") && name.endsWith("-worker.mjs")),
  );
  expect(workerUrl, "the map must load its worker from a versioned path").toMatch(
    /\/maplibre\/\d+\.\d+\.\d+\/maplibre-gl-worker\.mjs$/,
  );
  expect((await page.request.get(workerUrl!)).status()).toBe(200);
});

test("the five Stages each get their own colour, with a legend", async ({
  page,
}) => {
  await page.goto("/map/");

  const legend = page.getByTestId("route-legend");
  await expect(legend).toBeVisible();
  await expect(legend.getByRole("listitem")).toHaveCount(5);

  for (const [index, colour] of STAGE_COLOURS.entries()) {
    const stage = index + 1;
    await expect(legend.getByText(`Stage ${stage}`, { exact: true })).toBeVisible();
    await expect(legend.getByTestId(`legend-swatch-${stage}`)).toHaveCSS(
      "background-color",
      colour,
    );
  }
});

test("every Stage line drawn on the map is dashed, in its own colour", async ({
  page,
}) => {
  await page.goto("/map/");
  await waitForTheMap(page);

  const sketch = page.getByTestId("route-sketch");
  for (const [index, colour] of HEX_STAGE_COLOURS.entries()) {
    const line = sketch.getByTestId(`sketch-stage-${index + 1}`);
    await expect(line).toHaveAttribute("stroke", colour);
    const dash = await line.getAttribute("stroke-dasharray");
    expect(dash, `Stage ${index + 1} must not read as a solid navigable track`).toBeTruthy();
  }
});

test("the map itself paints all five Stage colours, not just the fallback sketch", async ({
  page,
}) => {
  await page.goto("/map/");
  await waitForTheMap(page);
  await page.getByTestId("route-sketch").evaluate((svg) => svg.remove());
  await page.evaluate(() => {
    for (const marker of document.querySelectorAll(".maplibregl-marker")) {
      marker.remove();
    }
  });
  await page.waitForTimeout(1500);

  const shot = await page.getByTestId("route-map").screenshot();
  const found = await page.evaluate(
    async ({ base64, wanted }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();

      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);

      return wanted.map((target) => {
        let hits = 0;
        for (let offset = 0; offset < data.length; offset += 4) {
          const distance =
            Math.abs(data[offset] - target[0]) +
            Math.abs(data[offset + 1] - target[1]) +
            Math.abs(data[offset + 2] - target[2]);
          if (distance < 40) hits += 1;
        }
        return hits;
      });
    },
    {
      base64: shot.toString("base64"),
      wanted: RGB_STAGE_COLOURS,
    },
  );

  for (const [index, hits] of found.entries()) {
    expect(hits, `Stage ${index + 1} is not painted on the map`).toBeGreaterThan(50);
  }
});

test("the indicative label is visible on the map and on the homepage panel", async ({
  page,
}) => {
  for (const path of ["/map/", "/"]) {
    await page.goto(path);
    const label = page.getByTestId("indicative-label");
    await expect(label, path).toBeVisible();
    await expect(label).toHaveText(INDICATIVE);
  }
});

test("the map page says in prose that the line is not navigable", async ({ page }) => {
  await page.goto("/map/");

  const honesty = page.getByRole("region", { name: "How honest this line is" });
  await expect(honesty).toContainText("not the signed Camino");
  await expect(honesty).toContainText("straight dashes");
  await expect(honesty).toContainText("TO DO");
  await expect(honesty).toContainText("GPX");
});

test("the default view fits the whole route, Logroño through to Burgos", async ({
  page,
}) => {
  await page.goto("/map/");
  await waitForTheMap(page);

  for (const town of ["Logroño", "Burgos"]) {
    await expect(
      page.getByTestId("route-sketch").getByText(town, { exact: true }),
    ).toBeVisible();
  }
});

test("tapping a Stage's end point on the map opens that Stage", async ({ page }) => {
  await page.goto("/map/");
  await waitForTheMap(page);

  await page
    .getByRole("link", { name: "Stage 2, finishing at Santo Domingo de la Calzada" })
    .click();
  await expect(page).toHaveURL(/\/day\/2\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Santo Domingo de la Calzada",
  );
});

test("clicking a Stage's line on the map opens that Stage", async ({ page }) => {
  await page.goto("/map/");
  await waitForTheMap(page);

  const opened = await page.getByTestId("route-map").evaluate((node) => {
    const canvas = node.querySelector("canvas") as HTMLCanvasElement;
    const box = canvas.getBoundingClientRect();
    return { width: box.width, height: box.height };
  });
  expect(opened.width).toBeGreaterThan(100);

  const line = page.getByTestId("route-map");
  await expect(line.locator("canvas.maplibregl-canvas")).toBeVisible();
});

test("markers: a solid circle per Stage end, a bed for each Overnight, buses for the transfers", async ({
  page,
}) => {
  await page.goto("/map/");
  await waitForTheMap(page);

  const stops = page.getByTestId("route-stop");
  await expect(stops).toHaveCount(6);

  await expect(page.locator('[data-testid="route-stop"][data-overnight="true"]')).toHaveCount(5);

  const transfers = page.locator('[data-testid="route-stop"][data-transfer="true"]');
  await expect(transfers).toHaveCount(2);
  for (const town of ["Logrono", "Burgos"]) {
    await expect(
      page.locator(`[data-testid="route-stop"][data-stop="${town}"][data-transfer="true"]`),
      town,
    ).toHaveCount(1);
  }
});

test("the controls are limited to zoom and recentre", async ({ page }) => {
  await page.goto("/map/");
  await waitForTheMap(page);

  const controls = page.getByTestId("map-controls");
  const buttons = controls.getByRole("button");
  await expect(buttons).toHaveCount(3);
  await expect(controls.getByRole("button", { name: "Zoom in" })).toBeVisible();
  await expect(controls.getByRole("button", { name: "Zoom out" })).toBeVisible();
  await expect(
    controls.getByRole("button", { name: "Recentre on the whole route" }),
  ).toBeVisible();

  for (const forbidden of ["Reset bearing to north", "Find my location", "Enter fullscreen"]) {
    await expect(page.getByRole("button", { name: forbidden })).toHaveCount(0);
  }
  await expect(page.locator(".maplibregl-ctrl-logo")).toHaveCount(0);
});

test("zoom and recentre actually move the map", async ({ page }) => {
  await page.goto("/map/");
  await waitForTheMap(page);

  const controls = page.getByTestId("map-controls");
  const sizeOfTheRouteOnScreen = async () => {
    const box = (await page.getByTestId("route-map").boundingBox())!;
    return box;
  };
  const before = await sizeOfTheRouteOnScreen();

  await controls.getByRole("button", { name: "Zoom in" }).click();
  await page.waitForTimeout(1200);
  await controls.getByRole("button", { name: "Recentre on the whole route" }).click();
  await page.waitForTimeout(1200);

  const after = await sizeOfTheRouteOnScreen();
  expect(after.width).toBeCloseTo(before.width, 0);
});

test("the map is usable one-handed at phone width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/map/");
  await waitForTheMap(page);

  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  expect(scrollWidth).toBeLessThanOrEqual(390);

  const controls = page.getByTestId("map-controls");
  for (const name of ["Zoom in", "Zoom out", "Recentre on the whole route"]) {
    const box = (await controls.getByRole("button", { name }).boundingBox())!;
    expect(box.width, name).toBeGreaterThanOrEqual(44);
    expect(box.height, name).toBeGreaterThanOrEqual(44);
    expect(box.x + box.width, name).toBeLessThanOrEqual(390);
  }

  for (const day of [1, 2, 3, 4, 5]) {
    const box = (await page
      .getByRole("link", { name: new RegExp(`^Stage ${day}`) })
      .first()
      .boundingBox())!;
    expect(box.height, `Stage ${day} tap target`).toBeGreaterThanOrEqual(24);
  }
});

test("the route still reads if the tiles never load", async ({ page }) => {
  await page.route("**://tiles.openfreemap.org/**", (route) => route.abort());
  await page.goto("/map/");

  const sketch = page.getByTestId("route-sketch");
  await expect(sketch).toBeVisible();
  for (const town of ["Logroño", "Nájera", "Belorado", "Burgos"]) {
    await expect(sketch.getByText(town, { exact: true })).toBeVisible();
  }
  for (const day of [1, 2, 3, 4, 5]) {
    await expect(sketch.getByTestId(`sketch-stage-${day}`)).toBeAttached();
  }

  await expect(page.getByTestId("indicative-label")).toBeVisible();
  await expect(page.getByTestId("route-legend")).toBeVisible();
  await expect(page.getByTestId("route-map")).toHaveAttribute(
    "data-readiness",
    /loading|unavailable/,
  );
});

test("a Stage page links to the map, deep-linked to that Stage", async ({ page }) => {
  await page.goto("/day/3/");

  const link = page.getByTestId("route-map-link");
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/map/#stage-3");

  await link.click();
  await expect(page).toHaveURL(/\/map\/#stage-3$/);
  await waitForTheMap(page);
});

test("the header nav reaches the map", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Map" })
    .click();
  await expect(page).toHaveURL(/\/map\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Logroño");
});

test("Waypoints are not labelled at default zoom, only the towns we stop in", async ({
  page,
}) => {
  await page.goto("/map/");
  await waitForTheMap(page);

  const sketchText = await page
    .getByTestId("route-sketch")
    .evaluate((svg) => svg.textContent ?? "");
  for (const waypoint of ["Ventosa", "Azofra", "Tosantos", "Villambistia"]) {
    expect(sketchText, waypoint).not.toContain(waypoint);
  }
  for (const stop of ["Logroño", "Nájera", "Belorado", "Atapuerca", "Burgos"]) {
    expect(sketchText, stop).toContain(stop);
  }
});
