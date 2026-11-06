import { expect, type Locator, type Page } from "@playwright/test";

/** Third-party embeds that are allowed to fail (blocked networks, ad blockers) without failing a test. */
const THIRD_PARTY = /maps\.google\.com|google\.com\/maps|googletagmanager|instagram\.com|fonts\.g/;

/** Collects uncaught exceptions, console errors and failed first-party requests for the whole test. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    // The browser logs a console error for every failed resource; those are judged by URL below.
    if (/Failed to load resource/.test(text)) return;
    errors.push(`console: ${text}`);
  });
  page.on("requestfailed", (r) => {
    const url = r.url();
    if (THIRD_PARTY.test(url) || r.failure()?.errorText === "net::ERR_ABORTED") return;
    errors.push(`requestfailed: ${url} ${r.failure()?.errorText}`);
  });
  page.on("response", (r) => {
    const url = r.url();
    if (r.status() >= 400 && !THIRD_PARTY.test(url) && r.request().resourceType() !== "document") errors.push(`http ${r.status()}: ${url}`);
  });
  return {
    errors,
    expectClean: () => expect(errors, errors.join("\n")).toEqual([]),
  };
}

/** Waits for the axe intro on a full page load to finish (it sets window.__dcfLoaded). */
export async function waitForIntro(page: Page) {
  await page.waitForFunction(() => (window as unknown as { __dcfLoaded?: boolean }).__dcfLoaded === true, null, { timeout: 20_000 });
}

/** Loads a route and waits until the intro curtain has lifted. */
export async function open(page: Page, path: string) {
  const res = await page.goto(path, { waitUntil: "load" });
  await waitForIntro(page);
  return res;
}

/**
 * Scrolls to the bottom with real wheel steps so scroll-triggered sections all run. The page can grow
 * while scrolling (pinned sections add spacers), so the bottom is re-measured on every step.
 */
export async function scrollThrough(page: Page, step = 600, pause = 80, onStep?: () => Promise<void>) {
  const atBottom = () => page.evaluate(() => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4);
  for (let i = 0; i < 300; i++) {
    await page.mouse.wheel(0, step);
    await page.waitForTimeout(pause);
    await onStep?.();
    if (i % 5 === 4 && (await atBottom())) break;
  }
  // Let smooth scrolling coast to a stop.
  for (let i = 0; i < 20 && !(await atBottom()); i++) {
    await page.mouse.wheel(0, step);
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(400);
}

/** Bounding box once a slide/spring animation has stopped moving. */
export async function settledBox(locator: Locator) {
  let prev = await locator.boundingBox();
  for (let i = 0; i < 40; i++) {
    await locator.page().waitForTimeout(100);
    const next = await locator.boundingBox();
    if (prev && next && Math.abs(prev.x - next.x) < 0.5 && Math.abs(prev.y - next.y) < 0.5 && Math.abs(prev.width - next.width) < 0.5) return next;
    prev = next;
  }
  return prev;
}

/** Elements that stick out past the right edge and are not clipped by an ancestor. */
export async function horizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    // On phones, content wider than the screen widens the layout viewport itself (innerWidth > clientWidth).
    const widened = window.innerWidth > vw + 1 || document.documentElement.scrollWidth > vw + 1;
    if (!widened) return [];
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
      if (el.children.length) continue; // report leaves: the actual culprits
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.right <= vw + 1) continue;
      let clipped = false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const ox = getComputedStyle(a).overflowX;
        if (ox === "hidden" || ox === "clip" || ox === "auto" || ox === "scroll") {
          clipped = true;
          break;
        }
      }
      if (!clipped) out.push(`<${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 80)}"> right=${Math.round(r.right)} > ${vw}`);
      if (out.length >= 5) break;
    }
    return out.length ? out : [`page is ${Math.max(window.innerWidth, document.documentElement.scrollWidth)}px wide on a ${vw}px screen`];
  });
}

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768;
