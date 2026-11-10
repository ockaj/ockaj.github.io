import { test, expect, seedLoadedSession } from "./fixtures";

test.describe("Accessibility & Keyboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await seedLoadedSession(page);
  });

  test("FAQ accordion toggles with Enter/Space and exposes hidden=until-found", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const faqSection = page.locator("#faq");
    await faqSection.scrollIntoViewIfNeeded();

    const firstTrigger = faqSection
      .getByRole("heading", { level: 3 })
      .getByRole("button")
      .first();
    await expect(firstTrigger).toBeVisible();

    await expect(
      page.locator("#faq [hidden='until-found']").first(),
    ).toBeAttached();

    await firstTrigger.focus();
    await page.keyboard.press("Enter");
    await expect(firstTrigger).toHaveAttribute("data-panel-open", "");

    await page.keyboard.press("Space");
    await expect(firstTrigger).not.toHaveAttribute("data-panel-open", "");
  });

  test("CV modal dialog dismisses via Escape key", async ({ page }) => {
    await page.goto("/#cv", { waitUntil: "domcontentloaded" });

    const cvDialog = page.getByRole("dialog");
    await expect(cvDialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(cvDialog).toBeHidden();
    await expect(page).not.toHaveURL(/#cv/);
  });
});
