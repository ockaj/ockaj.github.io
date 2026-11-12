import { test, expect, seedLoadedSession } from "./fixtures";

test.describe("BaseDrawer & Entity Modals", () => {
  test.beforeEach(async ({ page }) => {
    await seedLoadedSession(page);
  });

  test("opens Case Study drawer via hash and closes via backdrop", async ({
    page,
  }) => {
    await page.goto("/#case-study-1", { waitUntil: "domcontentloaded" });

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await page
      .locator(".fixed.inset-0.z-90")
      .click({ position: { x: 50, y: 50 } });
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/#work$/);
  });

  test("opens Case Study drawer via card click and closes via Close button", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#main-content")).toBeVisible();

    const firstCard = page.locator("article").first();
    await firstCard.scrollIntoViewIfNeeded();
    await firstCard.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/#case-study-/);

    await page.getByRole("button", { name: "Close panel" }).click();
    await expect(dialog).toBeHidden();
  });

  test("keeps drawer content vertically scrollable", async ({ page }) => {
    await page.goto("/#case-study-1", { waitUntil: "domcontentloaded" });

    const dialog = page.getByRole("dialog");
    const content = dialog.locator(".overflow-y-auto").first();
    await expect(content).toBeVisible();
    await expect
      .poll(() =>
        content.evaluate((element) => ({
          canScroll: element.scrollHeight > element.clientHeight,
          scrollTop: element.scrollTop,
        })),
      )
      .toMatchObject({ canScroll: true, scrollTop: 0 });

    await content.hover();
    await page.mouse.wheel(0, 500);

    await expect
      .poll(() => content.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
  });

  test("recovers from invalid case study deep link to #work", async ({
    page,
  }) => {
    await page.goto("/#case-study-999", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page).toHaveURL(/#work$/);
  });

  test("opens Journal drawer via hash and closes via backdrop to #journal", async ({
    page,
  }) => {
    await page.goto("/#article-bpmn-traps", { waitUntil: "domcontentloaded" });

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await page
      .locator(".fixed.inset-0.z-90")
      .click({ position: { x: 50, y: 50 } });
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/#journal$/);
  });

  test.describe("Reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("opens and closes drawer cleanly under prefers-reduced-motion", async ({
      page,
    }) => {
      await page.goto("/#case-study-1", { waitUntil: "domcontentloaded" });

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      await page
        .locator(".fixed.inset-0.z-90")
        .click({ position: { x: 50, y: 50 } });
      await expect(dialog).toBeHidden();
    });
  });
});
