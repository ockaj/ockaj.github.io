import { test as base, expect, type Page } from "@playwright/test";

export const test = base.extend<{ pageErrorGuard: void }>({
  pageErrorGuard: [
    async ({ page }, use) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });
      page.on("pageerror", (err) => {
        pageErrors.push(err.message);
      });

      await use();

      expect(
        pageErrors,
        `Uncaught page errors: ${pageErrors.join("; ")}`,
      ).toEqual([]);
      expect(
        consoleErrors,
        `Console errors: ${consoleErrors.join("; ")}`,
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export async function skipLoadingScreen(page: Page): Promise<void> {
  const skipButton = page.getByRole("button", { name: "Skip" });
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipButton.click().catch(() => {});
  }
  await expect(page.locator("#main-content")).toBeVisible({ timeout: 8000 });
}

export async function seedLoadedSession(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("portfolio_loaded", "true");
    } catch {
      // Ignored: storage might be restricted
    }
  });
}
