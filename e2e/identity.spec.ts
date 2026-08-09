import { readFileSync, readdirSync } from "node:fs";
import { chromium, expect, test } from "@playwright/test";

import { SHELL_MARK_PATH } from "../src/components/shell-mark";

async function decodeInkRows(png: Buffer) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    return await page.evaluate(async (base64) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();

      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);

      const { data } = context.getImageData(0, 0, image.width, image.height);
      return Array.from({ length: image.height }, (_, y) =>
        Array.from({ length: image.width }, (_, x) => {
          const offset = (y * image.width + x) * 4;
          const [red, green, blue] = [data[offset], data[offset + 1], data[offset + 2]];
          return red + green + blue < 720;
        }),
      );
    }, png.toString("base64"));
  } finally {
    await browser.close();
  }
}

function exportedCss() {
  const dir = "out/_next/static/chunks";
  return readdirSync(dir)
    .filter((name) => name.endsWith(".css"))
    .map((name) => readFileSync(`${dir}/${name}`, "utf8"))
    .join("\n");
}

test("the header carries the Shell mark, the Wordmark and the trip dates", async ({
  page,
}) => {
  await page.goto("/");

  const header = page.getByRole("banner");
  const wordmark = header.getByText("The Way", { exact: true });
  await expect(wordmark).toBeVisible();
  await expect(wordmark).toHaveCSS("text-transform", "uppercase");
  await expect(wordmark).toHaveCSS("letter-spacing", /^[0-9.]+px$/);
  await expect(header.getByText("4–11 October 2026")).toBeVisible();

  const shell = header.getByTestId("shell-mark");
  await expect(shell).toBeVisible();
  await expect(shell).toHaveCSS("color", "rgb(210, 167, 74)");
});

test("the footer carries the Shell mark, the Wordmark, the strapline and the domain", async ({
  page,
}) => {
  await page.goto("/");

  const footer = page.getByRole("contentinfo");
  await expect(footer.getByText("The Way", { exact: true })).toBeVisible();
  await expect(footer.getByText("Our Camino. Our Journey.")).toBeVisible();
  await expect(footer.getByText("theway.cannontrodder.net")).toBeVisible();
  await expect(footer.getByTestId("shell-mark")).toBeVisible();
});

test("ink on paper is the default pairing", async ({ page }) => {
  await page.goto("/");

  const body = page.locator("body");
  await expect(body).toHaveCSS("background-color", "rgb(242, 239, 230)");
  await expect(body).toHaveCSS("color", "rgb(15, 29, 52)");
});

test("ochre is the single accent, spent only on the Shell mark", async ({
  page,
}) => {
  await page.goto("/");

  const ochreOutsideShellMark = await page.evaluate(() =>
    [...document.querySelectorAll("body *")]
      .filter((element) => {
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
        ].includes("rgb(210, 167, 74)");
      })
      .filter((element) => !element.closest('[data-testid="shell-mark"]'))
      .map((element) => element.tagName.toLowerCase()),
  );

  expect(ochreOutsideShellMark).toEqual([]);
});

test("ochre is not spent a second time on a hover or focus state", async ({
  page,
}) => {
  await page.goto("/");

  const css = exportedCss();
  const ochreRules = css
    .split("}")
    .filter((rule) => /#d2a74a|--color-ochre/i.test(rule))
    .filter((rule) => /:hover|:focus|:active/.test(rule));

  expect(ochreRules).toEqual([]);
});

test("the Shell mark is a flat single-colour vector", async ({ page }) => {
  await page.goto("/");

  const shell = page.getByTestId("shell-mark").first();
  await expect(shell).toHaveAttribute("viewBox", "0 0 24 24");

  const fills = await shell.evaluate((svg) =>
    [...svg.querySelectorAll("[fill], [stroke]")].map((element) => [
      element.getAttribute("fill"),
      element.getAttribute("stroke"),
    ]),
  );
  expect(fills.flat().filter(Boolean)).toHaveLength(0);
  expect(await shell.locator("linearGradient, radialGradient").count()).toBe(0);
});

test("the Shell mark is the favicon and serves at favicon size", async ({
  page,
}) => {
  await page.goto("/");

  const href = await page.locator('link[rel="icon"]').first().getAttribute("href");
  expect(href).toBeTruthy();

  const response = await page.request.get(href!);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");

  const svg = await response.text();
  expect(svg).toContain('viewBox="0 0 24 24"');
  expect(svg).toContain("#D2A74A");
  expect(svg).toContain(SHELL_MARK_PATH);
  expect(svg.match(/<path/g)).toHaveLength(1);
});

test("the Shell mark's rays stay separate when rendered at 16px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 16, height: 16 });
  await page.setContent(
    `<body style="margin:0;background:#FFFFFF">
       <svg viewBox="0 0 24 24" width="16" height="16" fill="#D2A74A">
         <path d="${SHELL_MARK_PATH}" />
       </svg>
     </body>`,
  );

  const rendered = await page.locator("svg").screenshot();
  const rows = await decodeInkRows(rendered);

  const mostRunsInARow = Math.max(
    ...rows.map((row) => row.filter((inked, x) => inked && !row[x - 1]).length),
  );
  expect(mostRunsInARow).toBeGreaterThanOrEqual(4);
});

test("web fonts self-host and swap rather than blocking first paint", () => {
  const html = readFileSync("out/index.html", "utf8");
  expect(html).not.toMatch(/rel="stylesheet"[^>]+fonts\.googleapis/);
  expect(html).not.toContain("fonts.gstatic.com");

  const css = exportedCss();
  expect(css).toMatch(/font-display:\s*swap/);
  expect(css).toMatch(/size-adjust/);
});

test("the design tokens are the source of truth for colour, type, radius and spacing", async ({
  page,
}) => {
  await page.goto("/");

  const tokens = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    const names = [
      "--color-ink",
      "--color-blue",
      "--color-olive",
      "--color-ochre",
      "--color-paper",
      "--color-white",
      "--color-muted",
      "--color-border",
      "--font-display",
      "--font-sans",
      "--radius-small",
      "--radius-medium",
      "--radius-large",
      "--spacing-xs",
      "--spacing-sm",
      "--spacing-md",
      "--spacing-lg",
      "--spacing-xl",
      "--spacing-xxl",
    ];
    return Object.fromEntries(
      names.map((name) => [
        name,
        style.getPropertyValue(name).trim().toLowerCase().replace(/_/g, " "),
      ]),
    );
  });

  expect(tokens).toMatchObject({
    "--color-ink": "#0f1d34",
    "--color-blue": "#2e5b7b",
    "--color-olive": "#5f7245",
    "--color-ochre": "#d2a74a",
    "--color-paper": "#f2efe6",
    "--color-white": "#faf9f5",
    "--color-muted": "#5f625a",
    "--color-border": "#d8d3c6",
    "--radius-small": "6px",
    "--radius-medium": "10px",
    "--radius-large": "16px",
    "--spacing-xs": "4px",
    "--spacing-sm": "8px",
    "--spacing-md": "16px",
    "--spacing-lg": "24px",
    "--spacing-xl": "40px",
    "--spacing-xxl": "64px",
  });
  expect(tokens["--font-display"]).toContain("playfair display");
  expect(tokens["--font-display"]).toContain("serif");
  expect(tokens["--font-sans"]).toContain("inter");
  expect(tokens["--font-sans"]).toContain("system-ui");
});

test("the header and footer fit within mobile width", async ({ page }) => {
  await page.goto("/");

  const viewport = page.viewportSize()!;
  for (const role of ["banner", "contentinfo"] as const) {
    const box = await page.getByRole(role).boundingBox();
    expect(box!.width).toBeLessThanOrEqual(viewport.width);
  }
  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  expect(scrollWidth).toBeLessThanOrEqual(viewport.width);
});

test("the nav collapses to a menu at mobile width and expands on wider screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/");

  const toggle = page.getByRole("button", { name: "Menu" });
  await expect(toggle).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();

  const box = await toggle.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);

  await toggle.click();
  await expect(page.getByRole("navigation", { name: "Menu" })).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(toggle).toBeHidden();
});

test("no Camino tourism branding, religious imagery, script fonts or bright holiday colours", async ({
  page,
}) => {
  await page.goto("/");

  const families = await page.evaluate(() =>
    [...new Set([...document.querySelectorAll("body *")].map((element) =>
      getComputedStyle(element).fontFamily.toLowerCase(),
    ))].join(" "),
  );
  for (const script of ["cursive", "script", "brush", "handwriting"]) {
    expect(families).not.toContain(script);
  }

  const backgroundImages = await page.evaluate(() =>
    [...document.querySelectorAll("body, body *")]
      .map((element) => getComputedStyle(element).backgroundImage)
      .filter((value) => value !== "none"),
  );
  expect(backgroundImages).toEqual([]);
  expect(await page.locator("img").count()).toBe(0);

  const saturated = await page.evaluate(() =>
    [...document.querySelectorAll("body *")].filter((element) => {
      const style = getComputedStyle(element);
      return [style.color, style.backgroundColor].some((value) => {
        const parsed = value.match(/\d+/g)?.slice(0, 3).map(Number);
        if (!parsed || parsed.length < 3) return false;
        const [max, min] = [Math.max(...parsed), Math.min(...parsed)];
        return max > 220 && max - min > 140;
      });
    }).length,
  );
  expect(saturated).toBe(0);
});
