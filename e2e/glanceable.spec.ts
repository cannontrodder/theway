import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import {
  ITINERARY_PATH,
  STAYS_PATH,
  TRAVEL_PATH,
  stagePath,
} from "../src/lib/display";
import { trip } from "../src/lib/trip";

const ROUTES = [
  "/",
  ITINERARY_PATH,
  "/map/",
  ...trip.stages.map(stagePath),
  TRAVEL_PATH,
  STAYS_PATH,
];

const PHONE_WIDTHS = [320, 360, 412];

const MINIMUM_TAP_SIZE = 44;

const DEFERRED_PAGES = ["/bilbao", "/burgos", "/packing", "/info"];

test.describe.configure({ timeout: 180_000 });

type Rgb = [number, number, number];

function parseRgb(colour: string): Rgb | undefined {
  const numbers = colour.match(/[\d.]+/g);
  if (!numbers || numbers.length < 3) return undefined;
  const [red, green, blue] = numbers.slice(0, 3).map(Number);
  return [red, green, blue];
}

function relativeLuminance([red, green, blue]: Rgb): number {
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928
      ? scaled / 12.92
      : Math.pow((scaled + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue)
  );
}

function contrastRatio(one: Rgb, other: Rgb): number {
  const [lighter, darker] = [
    relativeLuminance(one),
    relativeLuminance(other),
  ].sort((first, second) => second - first);
  return (lighter + 0.05) / (darker + 0.05);
}

function contrastRequiredFor(size: number, weight: number): number {
  const isLargeText = size >= 24 || (size >= 18.66 && weight >= 700);
  return isLargeText ? 3 : 4.5;
}


function installVisibilityProbe(page: Page) {
  return page.evaluate(() => {
    (window as unknown as { visibleEnough: (element: Element) => boolean }).visibleEnough =
      (element: Element) => {
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return (
          box.width > 0 &&
          box.height > 0 &&
          style.visibility !== "hidden" &&
          Number(style.opacity) > 0.05
        );
      };
  });
}

function linesOccupiedBy(locator: import("@playwright/test").Locator) {
  return locator.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getClientRects().length;
  });
}

async function openTheLowerPanels(page: Page) {
  await page.evaluate(() => {
    for (const panel of document.querySelectorAll("details")) panel.open = true;
  });
}

test("every v1 route renders its own heading in the built export", async ({
  page,
}) => {
  for (const route of ROUTES) {
    const response = await page.goto(route);
    expect(response!.status(), `${route} did not serve`).toBe(200);
    await expect(
      page.getByRole("main").getByRole("heading", { level: 1 }),
      `${route} has no level-one heading`,
    ).toBeVisible();
  }
});

test("no link anywhere promises a deferred page", async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route);
    await openTheLowerPanels(page);

    const hrefs = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")].map((link) =>
        link.getAttribute("href"),
      ),
    );
    for (const href of hrefs) {
      for (const deferred of DEFERRED_PAGES) {
        expect(
          href!.startsWith(deferred),
          `${route} links to the deferred page ${href}`,
        ).toBe(false);
      }
    }
  }
});

const OCHRE = "rgb(210, 167, 74)";

test("ochre is spent once per screen on every route, not just the homepage", async ({
  page,
}) => {
  for (const route of ROUTES) {
    await page.goto(route);
    await openTheLowerPanels(page);

    const ochrePlaces = await page.evaluate((ochre) => {
      const paintedOchre = (element: Element) => {
        const style = getComputedStyle(element);
        return [
          style.color,
          style.backgroundColor,
          style.borderTopColor,
          style.borderBottomColor,
          style.fill,
          style.stroke,
          style.textDecorationColor,
          style.outlineColor,
        ].includes(ochre);
      };

      return [...document.querySelectorAll("body *")]
        .filter(paintedOchre)
        .map((element) => {
          const mark = element.closest('[data-testid="shell-mark"]');
          if (!mark) return `${element.tagName.toLowerCase()} outside the Shell mark`;
          return mark.closest("header")
            ? "the header Shell mark"
            : "the footer Shell mark";
        });
    }, OCHRE);

    expect(
      [...new Set(ochrePlaces)].sort(),
      `${route} spends ochre somewhere other than the Shell mark`,
    ).toEqual(["the footer Shell mark", "the header Shell mark"]);
  }
});

test("each page answers its own question above the fold at phone width", async ({
  page,
}) => {
  const questions: Record<string, string[]> = {
    "/": ["Logroño", "Burgos", "~123 km"],
    "/itinerary/": ["4–11 October 2026", "Sunday 4 October"],
    "/map/": ["Logroño → Burgos", "Indicative — real track to come"],
    "/day/1/": ["Logroño → Nájera", "28.7 km", "Nájera"],
    "/day/5/": ["Atapuerca → Burgos", "20.2 km", "Burgos"],
    "/travel/": ["Flights and buses", "Newcastle"],
    "/stays/": ["Where we sleep", "Bilbao"],
  };

  for (const [width, height] of [
    [320, 568],
    [412, 915],
  ]) {
    await page.setViewportSize({ width, height });

    for (const [route, answers] of Object.entries(questions)) {
      await page.goto(route);

      for (const answer of answers) {
        await expect(
          page.getByText(answer, { exact: false }).first(),
          `"${answer}" is not above the fold on ${route} at ${width}x${height}`,
        ).toBeInViewport({ ratio: 0.9 });
      }
    }
  }
});

const SMALLEST_READABLE_SENTENCE = 16;

const SMALLEST_READABLE_LABEL = 12;

const A_SENTENCE = /^[A-Z][^.!?]*[a-z]{2,}[^.!?]*[.!?]$/;

test("every sentence reads at 16px, and no label drops below 12px", async ({
  page,
}) => {
  for (const route of ROUTES) {
    await page.goto(route);
    await openTheLowerPanels(page);

    const measured = await page.evaluate(() => {
      const carriesItsOwnText = (element: Element) =>
        [...element.childNodes].some(
          (node) => node.nodeType === 3 && node.textContent!.trim().length > 0,
        );

      return [...document.querySelectorAll("body *")]
        .filter((element) => {
          const box = element.getBoundingClientRect();
          return (
            carriesItsOwnText(element) &&
            box.width > 0 &&
            box.height > 0 &&
            !(element instanceof SVGElement)
          );
        })
        .map((element) => ({
          text: element.textContent!.trim().replace(/\s+/g, " "),
          size: parseFloat(getComputedStyle(element).fontSize),
        }));
    });

    const shrunkenSentences = measured.filter(
      (item) =>
        A_SENTENCE.test(item.text) && item.size < SMALLEST_READABLE_SENTENCE,
    );
    expect(
      shrunkenSentences.map((item) => `${item.size}px: ${item.text.slice(0, 50)}`),
      `${route} sets a whole sentence below ${SMALLEST_READABLE_SENTENCE}px`,
    ).toEqual([]);

    const shrunkenLabels = measured.filter(
      (item) => item.size < SMALLEST_READABLE_LABEL,
    );
    expect(
      shrunkenLabels.map((item) => `${item.size}px: ${item.text.slice(0, 40)}`),
      `${route} sets a label below ${SMALLEST_READABLE_LABEL}px`,
    ).toEqual([]);
  }
});

test("body text meets AA contrast against the token palette on every route", async ({
  page,
}) => {
  for (const width of PHONE_WIDTHS) {
    await page.setViewportSize({ width, height: 800 });

    for (const route of ROUTES) {
      await page.goto(route);
      await openTheLowerPanels(page);
      await installVisibilityProbe(page);

      const painted = await page.evaluate(() => {
        const carriesItsOwnText = (element: Element) =>
          [...element.childNodes].some(
            (node) => node.nodeType === 3 && node.textContent!.trim().length > 0,
          );
        const opaqueBackgroundBehind = (element: Element) => {
          for (let node: Element | null = element; node; node = node.parentElement) {
            const colour = getComputedStyle(node).backgroundColor;
            const alpha = colour.startsWith("rgba")
              ? Number(colour.match(/[\d.]+/g)![3])
              : 1;
            if (alpha > 0.5) return colour;
          }
          return "rgb(255, 255, 255)";
        };

        return [...document.querySelectorAll("body *")]
          .filter(
            (element) =>
              carriesItsOwnText(element) &&
              (
                window as unknown as {
                  visibleEnough: (element: Element) => boolean;
                }
              ).visibleEnough(element),
          )
          .map((element) => {
            const style = getComputedStyle(element);
            return {
              text: element.textContent!.trim().slice(0, 40),
              foreground: style.color,
              background: opaqueBackgroundBehind(element),
              size: parseFloat(style.fontSize),
              weight: Number(style.fontWeight),
            };
          });
      });

      const failures = painted
        .map((item) => {
          const foreground = parseRgb(item.foreground);
          const background = parseRgb(item.background);
          if (!foreground || !background) return undefined;

          const ratio = contrastRatio(foreground, background);
          const needs = contrastRequiredFor(item.size, item.weight);
          if (ratio >= needs) return undefined;

          return `${item.text} — ${Math.round(ratio * 100) / 100}:1, needs ${needs}:1`;
        })
        .filter((failure) => failure !== undefined);

      expect(failures, `${route} at ${width}px fails AA contrast`).toEqual([]);
    }
  }
});

test("every control meets the minimum tap size at phone width", async ({
  page,
}) => {
  for (const width of PHONE_WIDTHS) {
    await page.setViewportSize({ width, height: 800 });

    for (const route of ROUTES) {
      await page.goto(route);
      await openTheLowerPanels(page);
      await installVisibilityProbe(page);

      const tooSmall = await page.evaluate((minimum) => {
        const insideTheMapCanvas = (element: Element) =>
          Boolean(element.closest(".maplibregl-map"));
        const isAttribution = (element: Element) =>
          Boolean(element.closest('[data-testid="map-attribution"]'));

        return [...document.querySelectorAll("a[href], button, summary")]
          .filter(
            (element) =>
              (
                window as unknown as { visibleEnough: (element: Element) => boolean }
              ).visibleEnough(element) &&
              !insideTheMapCanvas(element) &&
              !isAttribution(element),
          )
          .map((element) => {
            const box = element.getBoundingClientRect();
            return {
              text: (
                element.textContent ||
                element.getAttribute("aria-label") ||
                ""
              )
                .trim()
                .slice(0, 40),
              width: Math.round(box.width),
              height: Math.round(box.height),
            };
          })
          .filter(
            (measured) =>
              measured.width < minimum || measured.height < minimum,
          );
      }, MINIMUM_TAP_SIZE);

      expect(tooSmall, `${route} at ${width}px has controls under ${MINIMUM_TAP_SIZE}px`).toEqual(
        [],
      );
    }
  }
});

test("no route scrolls sideways between 320px and desktop width", async ({
  page,
}) => {
  for (const width of [...PHONE_WIDTHS, 640, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 800 });

    for (const route of ROUTES) {
      await page.goto(route);
      await openTheLowerPanels(page);

      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      expect(scrollWidth, `${route} scrolls sideways at ${width}px`).toBeLessThanOrEqual(
        width,
      );
    }
  }
});

test("the Wordmark stays on one line at the narrowest phone width", async ({
  page,
}) => {
  for (const width of PHONE_WIDTHS) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");

    for (const role of ["banner", "contentinfo"] as const) {
      const wordmark = page.getByRole(role).getByText("The Way", { exact: true });
      const lines = await linesOccupiedBy(wordmark);
      expect(lines, `the ${role} Wordmark wraps at ${width}px`).toBe(1);
    }
  }
});

test("a section heading is never squeezed onto two lines by its own link", async ({
  page,
}) => {
  for (const width of PHONE_WIDTHS) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");

    for (const [section, linkName] of [
      ["The journey at a glance", "Full itinerary →"],
      ["The route", "Open map →"],
    ] as const) {
      const region = page.getByRole("region", { name: section });
      const heading = region.getByRole("heading", { level: 2 });
      const link = region.getByRole("link", { name: linkName });

      const shareALine = await heading.evaluate((element, otherName) => {
        const other = [...element.ownerDocument.querySelectorAll("a")].find(
          (candidate) => candidate.textContent!.trim() === otherName,
        )!;
        const headingBox = element.getBoundingClientRect();
        const linkBox = other.getBoundingClientRect();
        return (
          headingBox.bottom > linkBox.top && linkBox.bottom > headingBox.top
        );
      }, linkName);

      if (!shareALine) continue;

      const headingLines = await linesOccupiedBy(heading);
      await expect(link).toBeVisible();
      expect(
        headingLines,
        `"${section}" wraps mid-phrase beside "${linkName}" at ${width}px`,
      ).toBe(1);
    }
  }
});

const NAVY_BADGE = "rgb(15, 29, 52)";

const CROWDING_LIMIT = 0.06;

test("a map place label never crowds the marker it belongs to", async ({
  page,
}) => {
  for (const width of PHONE_WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/map/");
    await expect(page.getByTestId("route-map")).toHaveAttribute(
      "data-readiness",
      "ready",
    );
    await page.waitForTimeout(1500);

    const canvas = page.locator(".maplibregl-canvas");
    const canvasBox = (await canvas.boundingBox())!;
    const rendered = (await canvas.screenshot()).toString("base64");

    const markers = await page.getByTestId("route-stop").all();
    expect(markers, `the map drew no markers at ${width}px`).toHaveLength(6);

    const badges = [];
    for (const marker of markers) {
      const box = (await marker.boundingBox())!;
      const badgeColour = await marker.evaluate(
        (element) => getComputedStyle(element.firstElementChild!).backgroundColor,
      );
      if (badgeColour === NAVY_BADGE) continue;

      badges.push({
        stop: (await marker.getAttribute("data-stop"))!,
        x: box.x + box.width / 2 - canvasBox.x,
        y: box.y + box.height / 2 - canvasBox.y,
        radius: box.width / 2,
      });
    }

    const crowded = await page.evaluate(
      async ({ base64, badges, canvasWidth, limit }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();

        const board = document.createElement("canvas");
        board.width = image.width;
        board.height = image.height;
        const context = board.getContext("2d")!;
        context.drawImage(image, 0, 0);
        const { data } = context.getImageData(0, 0, image.width, image.height);

        const scale = image.width / canvasWidth;

        return badges
          .map(({ stop, x, y, radius }) => {
            const scaled = radius * scale;
            const centreX = x * scale;
            const centreY = y * scale;
            let inked = 0;
            let total = 0;

            for (let dy = -scaled * 1.9; dy <= scaled * 1.9; dy += 1) {
              if (Math.abs(dy) < scaled * 1.05) continue;

              for (let dx = -scaled * 0.7; dx <= scaled * 0.7; dx += 1) {
                const pixelX = Math.round(centreX + dx);
                const pixelY = Math.round(centreY + dy);
                if (
                  pixelX < 0 ||
                  pixelY < 0 ||
                  pixelX >= image.width ||
                  pixelY >= image.height
                ) {
                  continue;
                }

                total += 1;
                const offset = (pixelY * image.width + pixelX) * 4;
                const isInk =
                  data[offset] < 90 &&
                  data[offset + 1] < 100 &&
                  data[offset + 2] < 120;
                if (isInk) inked += 1;
              }
            }

            return {
              stop,
              inkFraction:
                total === 0 ? 0 : Math.round((inked / total) * 1000) / 1000,
            };
          })
          .filter((measured) => measured.inkFraction > limit);
      },
      {
        base64: rendered,
        badges,
        canvasWidth: canvasBox.width,
        limit: CROWDING_LIMIT,
      },
    );

    expect(
      crowded,
      `a label sits on top of its own marker at ${width}px`,
    ).toEqual([]);
  }
});
