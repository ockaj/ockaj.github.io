import {
  test,
  expect,
  seedLoadedSession,
  skipLoadingScreen,
} from "./fixtures";

test.describe("Session Storage & Zero-Flash Loading", () => {
  test("shows LoadingScreen on fresh visit and hides it on skip", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const skipButton = page.getByRole("button", { name: "Skip" });
    await expect(skipButton).toBeVisible();

    await skipButton.click();
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("bypasses LoadingScreen immediately on repeat visit", async ({
    page,
  }) => {
    await seedLoadedSession(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("button", { name: "Skip" })).toBeHidden();
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("loads safely when localStorage throws SecurityError", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      try {
        Object.defineProperty(window, "localStorage", {
          get() {
            throw new DOMException(
              "The operation is insecure.",
              "SecurityError",
            );
          },
          configurable: true,
        });
      } catch {
        // Ignored: redefine may fail in strict environments
      }
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await skipLoadingScreen(page);
  });
});
