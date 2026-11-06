import { expect, test } from "@playwright/test";
import { horizontalOverflow, open, scrollThrough, watchErrors } from "./helpers";

/** Every public page renders, has no JS errors, no broken assets, and never scrolls sideways on a phone. */
const ROUTES = [
  { path: "/es", h1: /No es solo carne/ },
  { path: "/en", h1: /not just beef/i },
  { path: "/es/cortes", h1: /./ },
  { path: "/en/cortes", h1: /./ },
  { path: "/es/tienda", h1: /./ },
  { path: "/es/checkout", h1: null },
  { path: "/es/privacidad", h1: /./ },
  { path: "/es/terminos", h1: /./ },
];

for (const { path, h1 } of ROUTES) {
  test(`${path} renders cleanly`, async ({ page }) => {
    const watch = watchErrors(page);
    const res = await open(page, path);
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(/Don Corte Fino/i);
    await expect(page.locator("header")).toBeVisible();
    if (h1) await expect(page.locator("h1").first()).toContainText(h1);

    await scrollThrough(page);
    await expect(page.locator("footer")).toBeVisible();
    expect(await horizontalOverflow(page)).toEqual([]);

    // Broken images show up as complete-but-zero-width.
    const broken = await page.evaluate(() =>
      Array.from(document.images)
        .filter((i) => i.complete && i.naturalWidth === 0 && i.loading !== "lazy")
        .map((i) => i.currentSrc || i.src),
    );
    expect(broken).toEqual([]);
    watch.expectClean();
  });
}

test("every product page fits the screen", async ({ page, request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  const urls = [...new Set([...xml.matchAll(/<loc>[^<]*?(\/es\/cortes\/[^<]+)<\/loc>/g)].map((m) => m[1]))];
  expect(urls.length).toBeGreaterThan(5);
  test.setTimeout(30_000 + urls.length * 12_000);

  const watch = watchErrors(page);
  const problems: string[] = [];
  for (const url of urls) {
    const res = await open(page, url);
    expect(res?.status(), url).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    await scrollThrough(page, 900, 40);
    const over = await horizontalOverflow(page);
    if (over.length) problems.push(`${url}: ${over.join("; ")}`);
  }
  expect(problems, problems.join("\n")).toEqual([]);
  watch.expectClean();
});

test("unknown pages show the 404", async ({ page }) => {
  const res = await page.goto("/es/no-existe");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("404")).toBeVisible();
  await page.getByRole("link", { name: "Don Corte Fino" }).last().click();
  await expect(page).toHaveURL(/\/(es|en)$/);
});

test("root redirects to the visitor's language", async ({ browser }) => {
  const es = await browser.newContext({ locale: "es-BO" });
  const p1 = await es.newPage();
  await p1.goto("/");
  await expect(p1).toHaveURL(/\/es$/);
  await es.close();

  const en = await browser.newContext({ locale: "en-US" });
  const p2 = await en.newPage();
  await p2.goto("/");
  await expect(p2).toHaveURL(/\/en$/);
  await en.close();
});

test("admin login page renders", async ({ page }) => {
  const watch = watchErrors(page);
  const res = await page.goto("/admin/login");
  expect(res?.status()).toBe(200);
  await expect(page.locator("form input").first()).toBeVisible();
  await expect(page.locator("input[type=password]")).toBeVisible();
  expect(await horizontalOverflow(page)).toEqual([]);
  watch.expectClean();
});
