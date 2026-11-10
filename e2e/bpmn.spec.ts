import { test, expect, seedLoadedSession } from "./fixtures";

test.describe("BPMN Hotkey, Diagram & Mobile Guard", () => {
  test("opens blueprint dialog via B-P-M-N hotkey and navigates via SVG task node", async ({
    page,
  }) => {
    await seedLoadedSession(page);
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("#main-content")).toBeVisible();

    await page.locator("body").click();
    await page.keyboard.press("b");
    await page.keyboard.press("p");
    await page.keyboard.press("m");
    await page.keyboard.press("n");

    const dialog = page.getByRole("dialog", {
      name: "Portfolio System Operation Blueprint",
    });
    await expect(dialog).toBeVisible();

    const taskNode = page.locator("svg g[aria-label*='Navigate']").first();
    await expect(taskNode).toBeVisible();
    await taskNode.click();

    await expect(page).not.toHaveURL(/#bpmn/);
  });

  test.describe("Mobile viewport guard", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("dismisses #bpmn and redirects to #home on mobile", async ({
      page,
    }) => {
      await seedLoadedSession(page);
      await page.goto("/#bpmn", { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/#home$|\/$/);
    });
  });

  test.describe("Base UI Hotkey Toast lifecycle", () => {
    test.beforeEach(async ({ page }) => {
      await seedLoadedSession(page);
      await page.addInitScript(() => {
        try {
          sessionStorage.removeItem("bpmn_tip_dismissed");
        } catch {
          // Ignored: storage might be restricted
        }
      });
      await page.clock.install();
    });

    test("appears after 12s, pauses on hover, and auto-dismisses after leave", async ({
      page,
    }) => {
      await page.goto("/", { waitUntil: "networkidle" });
      await page.clock.fastForward(500);
      await page.clock.fastForward(12_100);

      const toastHeading = page.getByRole("heading", {
        name: "Process Analyst Easter Egg",
      });
      await expect(toastHeading).toBeVisible();

      await toastHeading.hover();
      await page.clock.fastForward(10_500);
      await expect(toastHeading).toBeVisible();

      await page.mouse.move(10, 10);
      await page.clock.fastForward(10_500);
      await page.clock.runFor(400);
      await expect(toastHeading).toBeHidden();
    });

    test("closes immediately via Dismiss tip button", async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });
      await page.clock.fastForward(500);
      await page.clock.fastForward(12_100);

      const toastHeading = page.getByRole("heading", {
        name: "Process Analyst Easter Egg",
      });
      await expect(toastHeading).toBeVisible();

      await toastHeading.hover();
      await page.getByRole("button", { name: "Dismiss tip", exact: true }).click();
      await page.clock.runFor(400);
      await expect(toastHeading).toBeHidden();
    });
  });
});
