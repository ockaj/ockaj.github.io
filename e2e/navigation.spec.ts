import { test, expect, seedLoadedSession } from "./fixtures";

test.describe("Navigation & SPA Routing", () => {
  test.beforeEach(async ({ page }) => {
    await seedLoadedSession(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("deep links to #faq and #contact update URL hash", async ({ page }) => {
    await page.evaluate(() => {
      window.location.hash = "#faq";
    });
    await expect(page).toHaveURL(/#faq$/);

    await page.evaluate(() => {
      window.location.hash = "#contact";
    });
    await expect(page).toHaveURL(/#contact$/);
  });

  test("scrollspy aligns hash to #home after scrolling back to top", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.location.hash = "#contact";
    });
    await expect(page).toHaveURL(/#contact$/);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await expect(page).toHaveURL(/(?:#home|\/)$/);
  });

  test("opens CV modal dialog via #cv hash", async ({ page }) => {
    await page.evaluate(() => {
      window.location.hash = "#cv";
    });
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("drags desktop navbar pill across tabs with vertical drift and settles to idle on release", async ({
    page,
  }) => {
    const nav = page.getByRole("navigation", { name: "Main Navigation" });
    const pill = nav.locator(".highlight-pill");
    const homeTab = nav.getByRole("button", { name: "Home" });
    const faqTab = nav.getByRole("button", { name: "FAQ" });

    await expect(pill).toHaveClass(/navbar-highlight-flat/);

    const homeBox = await homeTab.boundingBox();
    const faqBox = await faqTab.boundingBox();
    expect(homeBox).not.toBeNull();
    expect(faqBox).not.toBeNull();
    if (!homeBox || !faqBox) return;

    await page.mouse.move(
      homeBox.x + homeBox.width / 2,
      homeBox.y + homeBox.height / 2,
    );
    await expect(pill).toHaveClass(/navbar-highlight-active/);

    await page.mouse.down();
    await page.mouse.move(
      faqBox.x + faqBox.width / 2,
      faqBox.y + faqBox.height / 2 + 120,
      { steps: 15 },
    );

    // Must not navigate mid-drag, and must maintain expanded pill height
    await expect(page).not.toHaveURL(/#faq$/);
    await expect(faqTab).toHaveClass(/text-text-primary/);
    const midPillBox = await pill.boundingBox();
    expect(midPillBox?.height).toBeGreaterThan(faqBox.height + 6);

    await page.mouse.up();
    await expect(page).toHaveURL(/#faq$/);
    await expect(faqTab).toHaveAttribute("aria-current", "page");
    await expect(pill).toHaveClass(/navbar-highlight-flat/);
  });

  test("does not drag navbar pill when pressing an inactive tab with touch", async ({
    page,
  }) => {
    const nav = page.getByRole("navigation", { name: "Main Navigation" });
    const faqTab = nav.getByRole("button", { name: "FAQ" });
    const faqBox = await faqTab.boundingBox();
    expect(faqBox).not.toBeNull();
    if (!faqBox) return;

    await page.evaluate(
      ({ x, y }) => {
        const btn = document.querySelectorAll(
          'nav[aria-label="Main Navigation"] button',
        )[5];
        btn?.dispatchEvent(
          new PointerEvent("pointerdown", {
            bubbles: true,
            pointerId: 7,
            pointerType: "touch",
            button: 0,
            isPrimary: true,
            clientX: x,
            clientY: y,
          }),
        );
        window.dispatchEvent(
          new PointerEvent("pointermove", {
            bubbles: true,
            pointerId: 7,
            pointerType: "touch",
            clientX: x - 120,
            clientY: y,
          }),
        );
        window.dispatchEvent(
          new PointerEvent("pointerup", {
            bubbles: true,
            pointerId: 7,
            pointerType: "touch",
            clientX: x - 120,
            clientY: y,
          }),
        );
      },
      { x: faqBox.x + faqBox.width / 2, y: faqBox.y + faqBox.height / 2 },
    );

    await expect(page).not.toHaveURL(/#faq$/);
    await expect(nav.getByRole("button", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("slow drag paused over target tab settles without fake flight stretch", async ({
    page,
  }) => {
    const nav = page.getByRole("navigation", { name: "Main Navigation" });
    const pill = nav.locator(".highlight-pill");
    const homeTab = nav.getByRole("button", { name: "Home" });
    const faqTab = nav.getByRole("button", { name: "FAQ" });

    const homeBox = await homeTab.boundingBox();
    const faqBox = await faqTab.boundingBox();
    expect(homeBox).not.toBeNull();
    expect(faqBox).not.toBeNull();
    if (!homeBox || !faqBox) return;

    await page.mouse.move(
      homeBox.x + homeBox.width / 2,
      homeBox.y + homeBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      faqBox.x + faqBox.width / 2,
      faqBox.y + faqBox.height / 2,
      { steps: 15 },
    );

    // Wait past VELOCITY_PAUSE_TIMEOUT_MS (80ms) via browser timer, then sample pill width across animation frames on release
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, 120);
        }),
    );
    const pressedPill = await pill.boundingBox();
    expect(pressedPill).not.toBeNull();
    if (!pressedPill) return;

    const maxWidthPromise = page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          const el = document.querySelector(
            'nav[aria-label="Main Navigation"] .highlight-pill',
          );
          let maxW = 0;
          let frames = 0;
          const tick = () => {
            if (el) {
              maxW = Math.max(maxW, el.getBoundingClientRect().width);
            }
            frames += 1;
            if (frames >= 12) {
              resolve(maxW);
            } else {
              requestAnimationFrame(tick);
            }
          };
          requestAnimationFrame(tick);
        }),
    );

    await page.mouse.up();
    const maxObservedWidth = await maxWidthPromise;
    expect(maxObservedWidth).toBeLessThanOrEqual(pressedPill.width + 0.5);
    await expect(page).toHaveURL(/#faq$/);
    await expect(pill).toHaveClass(/navbar-highlight-flat/);
  });

  test("supports real touchscreen drag from active tab at 800x900 without pointercancel", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 800, height: 900 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await seedLoadedSession(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#main-content")).toBeVisible();

    const nav = page.getByRole("navigation", { name: "Main Navigation" });
    const homeTab = nav.getByRole("button", { name: "Home" });
    const faqTab = nav.getByRole("button", { name: "FAQ" });

    await expect(homeTab).toHaveCSS("touch-action", "none");
    await expect(faqTab).toHaveCSS("touch-action", "pan-y");

    const homeBox = await homeTab.boundingBox();
    const faqBox = await faqTab.boundingBox();
    expect(homeBox).not.toBeNull();
    expect(faqBox).not.toBeNull();
    if (!homeBox || !faqBox) {
      await context.close();
      return;
    }

    const cdp = await context.newCDPSession(page);
    const startX = homeBox.x + homeBox.width / 2;
    const startY = homeBox.y + homeBox.height / 2;
    const endX = faqBox.x + faqBox.width / 2;

    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: startX, y: startY, id: 1 }],
    });
    for (let i = 1; i <= 12; i++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          { x: startX + ((endX - startX) * i) / 12, y: startY + i * 3, id: 1 },
        ],
      });
    }
    await expect(faqTab).toHaveClass(/text-text-primary/);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });

    await expect(page).toHaveURL(/#faq$/);
    await expect(faqTab).toHaveCSS("touch-action", "none");
    await expect(homeTab).toHaveCSS("touch-action", "pan-y");
    await context.close();
  });

  test("snaps immediately with zero expansion when dragging under prefers-reduced-motion", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await seedLoadedSession(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#main-content")).toBeVisible();

    const nav = page.getByRole("navigation", { name: "Main Navigation" });
    const pill = nav.locator(".highlight-pill");
    const homeTab = nav.getByRole("button", { name: "Home" });
    const faqTab = nav.getByRole("button", { name: "FAQ" });

    const homeBox = await homeTab.boundingBox();
    const faqBox = await faqTab.boundingBox();
    expect(homeBox).not.toBeNull();
    expect(faqBox).not.toBeNull();
    if (!homeBox || !faqBox) {
      await context.close();
      return;
    }

    await page.mouse.move(
      homeBox.x + homeBox.width / 2,
      homeBox.y + homeBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      faqBox.x + faqBox.width / 2,
      faqBox.y + faqBox.height / 2,
      { steps: 5 },
    );

    const midPill = await pill.boundingBox();
    expect(midPill?.height).toBeCloseTo(faqBox.height, 0);

    await page.mouse.up();
    await expect(page).toHaveURL(/#faq$/);
    const endPill = await pill.boundingBox();
    expect(endPill?.x).toBeCloseTo(faqBox.x, 0);
    expect(endPill?.width).toBeCloseTo(faqBox.width, 0);
    await context.close();
  });
});
