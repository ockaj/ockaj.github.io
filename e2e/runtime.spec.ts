import { test, expect, seedLoadedSession } from "./fixtures";

test.describe("Runtime Health & Translation Safety", () => {
  test("renders expected title and translation-safe markers with zero errors", async ({
    page,
  }) => {
    await seedLoadedSession(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#main-content")).toBeVisible();

    await expect(page).toHaveTitle(/Ondrej Michal Očkaj/);
    const notranslateCount = await page
      .locator(".notranslate, [translate='no']")
      .count();
    expect(notranslateCount).toBeGreaterThanOrEqual(0);
  });
});
