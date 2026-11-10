import { test, expect, seedLoadedSession } from "./fixtures";

test.describe("Base UI & Components", () => {
  test.beforeEach(async ({ page }) => {
    await seedLoadedSession(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("FAQ accordion expands and collapses on click", async ({ page }) => {
    const faqSection = page.locator("#faq");
    await faqSection.scrollIntoViewIfNeeded();

    const firstTrigger = faqSection
      .getByRole("heading", { level: 3 })
      .getByRole("button")
      .first();
    await expect(firstTrigger).toBeVisible();
    await expect(firstTrigger).not.toHaveAttribute("data-panel-open", "");

    await firstTrigger.click();
    await expect(firstTrigger).toHaveAttribute("data-panel-open", "");
    await expect(page.locator("#faq [data-no-skeleton]").first()).toBeVisible();

    await firstTrigger.click();
    await expect(firstTrigger).not.toHaveAttribute("data-panel-open", "");
  });

  test("Process Library tabs switch active selection", async ({ page }) => {
    const processSection = page.locator("#processes");
    await processSection.scrollIntoViewIfNeeded();

    const tabs = processSection.getByRole("tab");
    await expect(tabs.first()).toBeVisible();
    expect(await tabs.count()).toBeGreaterThan(1);

    const secondTab = tabs.nth(1);
    await secondTab.click();
    await expect(secondTab).toHaveAttribute("aria-selected", "true");
  });
});
