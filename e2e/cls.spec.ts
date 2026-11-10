import { test, expect, skipLoadingScreen } from "./fixtures";

interface ClsWindow extends Window {
  __clsScore?: number;
}

test.describe("Cumulative Layout Shift (CLS)", () => {
  test("stays below 0.05 across initial load, full scroll, and anchor jump", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.evaluate(() => {
      const win = window as ClsWindow;
      win.__clsScore = 0;
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const shift = entry as PerformanceEntry & {
            hadRecentInput?: boolean;
            value?: number;
          };
          if (!shift.hadRecentInput && typeof shift.value === "number") {
            win.__clsScore = (win.__clsScore ?? 0) + shift.value;
          }
        }
      });
      observer.observe({ type: "layout-shift", buffered: true });
    });

    await skipLoadingScreen(page);

    const initialCls = await page.evaluate(
      () => (window as ClsWindow).__clsScore ?? 0,
    );
    expect(initialCls).toBeLessThan(0.05);

    const sections = [
      "#home",
      "#work",
      "#skills",
      "#processes",
      "#journal",
      "#faq",
      "#contact",
    ];
    for (const sectionId of sections) {
      const section = page.locator(sectionId);
      if (await section.isVisible().catch(() => false)) {
        await section.scrollIntoViewIfNeeded();
        await expect(section).toBeInViewport({ timeout: 2000 }).catch(() => {});
      }
    }

    const scrollCls = await page.evaluate(
      () => (window as ClsWindow).__clsScore ?? 0,
    );
    expect(scrollCls).toBeLessThan(0.05);

    await page.goto("/#contact", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#contact")).toBeAttached();
    const contactCls = await page.evaluate(
      () => (window as ClsWindow).__clsScore ?? 0,
    );
    expect(contactCls).toBeLessThan(0.05);
  });
});
