import { expect, test } from "@playwright/test";
import { open, scrollThrough } from "./helpers";

// Runs in the "perf-*" projects only, one device at a time after the functional tests, so the
// frame times measure the page rather than other browsers competing for the same CPU.
test.describe("smoothness", () => {
  test("home page scrolls without freezing", async ({ page }) => {
    test.setTimeout(180_000);
    await open(page, "/es");
    // Record every animation frame while scrolling top to bottom like a visitor would.
    await page.evaluate(() => {
      const w = window as unknown as { __frames: number[] };
      w.__frames = [];
      let last = performance.now();
      const tick = (t: number) => {
        w.__frames.push(t - last);
        last = t;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await scrollThrough(page, 400, 60);
    await page.waitForTimeout(1000);
    const frames = await page.evaluate(() => (window as unknown as { __frames: number[] }).__frames.slice(1));
    const sorted = [...frames].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const worst = sorted[sorted.length - 1];
    const long = frames.filter((f) => f > 100).length;
    test.info().annotations.push({ type: "frames", description: `n=${frames.length} p95=${p95.toFixed(1)}ms worst=${worst.toFixed(0)}ms >100ms=${long}` });

    // We reached the bottom of the page.
    await expect(page.locator("footer")).toBeInViewport();
    // Headless CI CPUs are slow, so this only catches real freezes (the page locking up), not dropped frames.
    expect(worst, "a frame took longer than 1.5s: the page froze while scrolling").toBeLessThan(1500);
    expect(p95, "95th-percentile frame time while scrolling").toBeLessThan(250);
  });
});
