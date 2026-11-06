import { expect, test } from "@playwright/test";
import { horizontalOverflow, isMobile, open, scrollThrough, settledBox, watchErrors } from "./helpers";

test.describe("navigation", () => {
  test("main menu reaches every section", async ({ page }) => {
    const watch = watchErrors(page);
    await open(page, "/es");
    const header = page.locator("header");

    if (isMobile(page)) {
      // Desktop links are hidden; the hamburger opens a full-width menu.
      await expect(header.locator("nav").first()).toBeHidden();
      const burger = page.getByRole("button", { name: "Menu" });
      await expect(burger).toBeVisible();
      await burger.click();
      await expect(burger).toHaveAttribute("aria-expanded", "true");
      await header.getByRole("link", { name: "Tienda" }).last().click();
    } else {
      await expect(page.getByRole("button", { name: "Menu" })).toBeHidden();
      await header.getByRole("link", { name: "Tienda" }).click();
    }
    await expect(page).toHaveURL(/\/es\/tienda$/);
    await expect(page.locator("h1").first()).toBeVisible();

    // Menu closes itself after navigating on phones.
    if (isMobile(page)) await expect(page.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "false");

    if (isMobile(page)) await page.getByRole("button", { name: "Menu" }).click();
    await header.getByRole("link", { name: "Cortes" }).last().click();
    await expect(page).toHaveURL(/\/es\/cortes$/);

    // Logo goes home.
    await page.getByRole("link", { name: "Don Corte Fino" }).first().click();
    await expect(page).toHaveURL(/\/es$/);
    watch.expectClean();
  });

  test("language switch keeps the page and remembers the choice", async ({ page, context }) => {
    await open(page, "/es/cortes");
    await page.locator("header").getByRole("link", { name: "EN", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/cortes$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === "NEXT_LOCALE")?.value).toBe("en");
    await page.goto("/");
    await expect(page).toHaveURL(/\/en$/);
  });
});

test.describe("ordering", () => {
  test("configure a cut, add to cart, edit it, and send the order to WhatsApp", async ({ page, context }) => {
    const watch = watchErrors(page);
    // Don't actually leave for WhatsApp: capture where the order would go.
    await context.route(/wa\.me|api\.whatsapp\.com|whatsapp\.com/, (r) => r.fulfill({ status: 200, body: "whatsapp" }));

    await open(page, "/es/cortes/ojo-de-bife");
    await expect(page.locator("h1").first()).toContainText(/ojo\s+de\s+bife/i);

    const add = page.getByRole("button", { name: "Agregar al carrito" });
    await add.scrollIntoViewIfNeeded();
    await expect(add).toBeEnabled();
    await add.click();

    // The drawer slides in with the item.
    const drawer = page.getByRole("dialog", { name: "Tu carrito" });
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText(/ojo\s+de\s+bife/i);
    const box = await settledBox(drawer);
    const vp = page.viewportSize()!;
    expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width + 1);
    if (isMobile(page)) expect(box!.width).toBeGreaterThan(vp.width - 2); // full screen on phones

    const badge = page.locator("header").getByRole("button", { name: "Carrito" });
    await expect(badge).toHaveText(/^\d+$/);
    const n = Number(await badge.innerText()); // steaks default to 2 pieces

    // Quantity controls.
    const plus = drawer.getByRole("button", { name: "+" }).first();
    await plus.click();
    await expect(badge).toHaveText(String(n + 1));
    await drawer.getByRole("button", { name: "-" }).first().click();
    await expect(badge).toHaveText(String(n));

    await drawer.getByRole("link", { name: "Finalizar pedido" }).click();
    await expect(page).toHaveURL(/\/es\/checkout$/);
    await expect(page.locator("h1")).toContainText("Finalizar pedido");
    expect(await horizontalOverflow(page)).toEqual([]);

    // Validation: nothing filled in.
    const send = page.getByRole("button", { name: /Confirmar por WhatsApp/ });
    await send.click();
    await expect(page.getByText("Completa nombre, teléfono y dirección.")).toBeVisible();

    await page.locator("textarea").first().fill("Av. San Martín 123, Equipetrol");
    await page.locator('input[autocomplete="name"]').fill("Prueba E2E");
    await page.locator('input[type="tel"]').fill("123");
    await send.click();
    await expect(page.getByText(/Revisa tu número de teléfono/)).toBeVisible();

    await page.locator('input[type="tel"]').fill("+591 70000000");
    const popup = context.waitForEvent("page");
    await send.click();
    const wa = await popup;
    await wa.waitForURL(/wa\.me|whatsapp/);
    const text = decodeURIComponent(new URL(wa.url()).searchParams.get("text") ?? wa.url());
    expect(text).toMatch(/ojo\s+de\s+bife/i);
    expect(text).toContain("Prueba E2E");
    expect(text).toContain("Av. San Martín 123");

    // Confirmation screen, cart emptied.
    await expect(page.getByText("¡Pedido listo!")).toBeVisible();
    await expect(page.locator("header").getByRole("button", { name: "Carrito" })).not.toContainText(/\d/);
    watch.expectClean();
  });

  test("quick add from the shop grid", async ({ page }) => {
    const watch = watchErrors(page);
    await open(page, "/es/tienda");
    const quick = page.getByRole("button", { name: /^\+ / }).first();
    await quick.scrollIntoViewIfNeeded();
    await quick.click();

    // Cuts open an options sheet; other products go straight in.
    const sheet = page.getByRole("dialog").filter({ has: page.getByRole("button", { name: "Agregar al carrito" }) });
    if (await sheet.isVisible().catch(() => false)) {
      const sb = await settledBox(sheet);
      const vp = page.viewportSize()!;
      expect(sb!.y + sb!.height).toBeLessThanOrEqual(vp.height + 1);
      expect(sb!.x + sb!.width).toBeLessThanOrEqual(vp.width + 1);
      await sheet.getByRole("button", { name: "Agregar al carrito" }).click();
    }
    await expect(page.getByRole("dialog", { name: "Tu carrito" })).toBeVisible();
    await page.getByRole("dialog", { name: "Tu carrito" }).getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("dialog", { name: "Tu carrito" })).toBeHidden();
    await expect(page.locator("header").getByRole("button", { name: "Carrito" })).toHaveText(/^[1-9]\d*$/);
    watch.expectClean();
  });

  test("cart survives a reload", async ({ page }) => {
    await open(page, "/es/cortes/picana");
    await page.getByRole("button", { name: "Agregar al carrito" }).click();
    const badge = page.locator("header").getByRole("button", { name: "Carrito" });
    await expect(badge).toHaveText(/^[1-9]\d*$/);
    const n = await badge.innerText();
    await page.reload();
    await expect(badge).toHaveText(n);
  });

  test("empty checkout points back to the cuts", async ({ page }) => {
    await open(page, "/es/checkout");
    await expect(page.getByText("Tu carrito está vacío.")).toBeVisible();
    await page.getByRole("link", { name: "Explorar cortes" }).click();
    await expect(page).toHaveURL(/\/es\/cortes$/);
  });
});

test.describe("help launcher", () => {
  test("opens WhatsApp and the Vaca Lola chat, which answers", async ({ page }) => {
    const watch = watchErrors(page);
    await open(page, "/es");
    const launcher = page.getByRole("button", { name: "¿Te ayudamos?" });
    await expect(launcher).toBeVisible();
    const lb = await launcher.boundingBox();
    const vp = page.viewportSize()!;
    expect(lb!.x + lb!.width).toBeLessThanOrEqual(vp.width);
    expect(lb!.y + lb!.height).toBeLessThanOrEqual(vp.height);

    await launcher.click();
    await expect(page.locator('a[href*="wa.me"]').filter({ hasText: /whatsapp/i }).last()).toBeVisible();
    await page.getByRole("button", { name: /Vaca Lola/ }).click();

    const chat = page.getByRole("dialog", { name: /Vaca Lola|Lola/ });
    await expect(chat).toBeVisible();
    const cb = await settledBox(chat);
    expect(cb!.x).toBeGreaterThanOrEqual(-1);
    expect(cb!.x + cb!.width).toBeLessThanOrEqual(vp.width + 1);

    await chat.getByRole("button", { name: "¿Cómo pago?" }).click();
    // A reply bubble arrives (AI if configured, otherwise the FAQ fallback).
    await expect(chat.getByText(/QR|efectivo|pago/i).nth(1)).toBeVisible({ timeout: 20_000 });

    const input = chat.getByPlaceholder("Escribe tu pregunta…");
    await input.fill("¿Hacen envíos?");
    await chat.getByRole("button", { name: "Enviar" }).click();
    await expect(input).toHaveValue("");

    await page.getByRole("button", { name: /Cerrar|Close/ }).first().click();
    await expect(chat).toBeHidden();
    watch.expectClean();
  });
});

test.describe("smoothness", () => {
  test("home page scrolls without freezing", async ({ page }) => {
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
    expect(p95, "95th-percentile frame time while scrolling").toBeLessThan(400);
  });
});
