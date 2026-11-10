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
});
