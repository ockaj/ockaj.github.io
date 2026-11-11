import AxeBuilder from "@axe-core/playwright";
import { test, expect, seedLoadedSession } from "./fixtures";

async function expectNoAxeViolations(
  page: import("@playwright/test").Page,
  contextLabel: string,
): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .analyze();

  expect(
    results.violations,
    `${contextLabel} axe violations:\n${results.violations
      .map(
        (v) =>
          `[${v.impact ?? "unknown"}] ${v.id}: ${v.help} (${v.nodes
            .map((n) => n.target.join(" "))
            .join(", ")})`,
      )
      .join("\n")}`,
  ).toEqual([]);
}

async function expectNoBrokenAriaRefs(
  page: import("@playwright/test").Page,
): Promise<void> {
  const brokenRefs = await page.evaluate(() => {
    const issues: string[] = [];
    for (const attr of ["aria-labelledby", "aria-describedby", "aria-controls"]) {
      for (const el of document.querySelectorAll(`[${attr}]`)) {
        const val = el.getAttribute(attr)?.trim();
        if (!val) continue;
        for (const id of val.split(/\s+/)) {
          if (!document.getElementById(id)) {
            issues.push(`${attr}="${id}" missing on <${el.tagName.toLowerCase()}>`);
          }
        }
      }
    }
    return issues;
  });

  expect(brokenRefs, `Broken ARIA IDREFs: ${brokenRefs.join("; ")}`).toEqual([]);
}

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

  test("passes axe-core WCAG 2.1 AA and ARIA IDREF checks across desktop, modals, and mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#main-content")).toBeVisible();

    for (const id of [
      "#work",
      "#skills",
      "#processes",
      "#journal",
      "#faq",
      "#contact",
    ]) {
      await page.locator(id).scrollIntoViewIfNeeded();
      await expect(page.locator(id)).toBeVisible();
    }
    await page.evaluate(() => window.scrollTo(0, 0));

    await expectNoBrokenAriaRefs(page);
    await expectNoAxeViolations(page, "Desktop 1440px");

    await page.evaluate(() => {
      window.location.hash = "#cv";
    });
    const cvDialog = page
      .getByRole("dialog")
      .filter({ has: page.getByRole("tab", { name: /Interactive/i }) });
    await expect(cvDialog).toBeVisible();
    await expectNoAxeViolations(page, "CV Modal (PDF tab)");

    await cvDialog.getByRole("tab", { name: /Interactive/i }).click();
    await expectNoAxeViolations(page, "CV Modal (Interactive tab)");
    await cvDialog.getByRole("button", { name: /Close/i }).click();
    await expect(cvDialog).toBeHidden();

    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expectNoBrokenAriaRefs(page);
    await expectNoAxeViolations(page, "Mobile 375px");

    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.locator("#mobile-nav-panel")).toBeVisible();
    await expectNoBrokenAriaRefs(page);
    await expectNoAxeViolations(page, "Mobile 375px + Menu Open");
  });

  test("passes axe-core WCAG 2.1 AA and ARIA IDREF checks across Case Study Drawer, Journal Drawer, Process Lightbox, and BPMN Overlay", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Case Study Drawer
    await page.goto("/#case-study-1", { waitUntil: "domcontentloaded" });
    const closePanelBtn = page.getByRole("button", { name: "Close panel" });
    await expect(closePanelBtn).toBeVisible();
    await expectNoBrokenAriaRefs(page);
    await expectNoAxeViolations(page, "Case Study Drawer");
    await closePanelBtn.click();
    await expect(closePanelBtn).toBeHidden();

    // Journal Drawer
    await page.evaluate(() => {
      window.location.hash = "#article-bpmn-traps";
    });
    await expect(closePanelBtn).toBeVisible();
    await expectNoBrokenAriaRefs(page);
    await expectNoAxeViolations(page, "Journal Drawer");
    await closePanelBtn.click();
    await expect(closePanelBtn).toBeHidden();

    // Process Lightbox
    const processes = page.locator("#processes");
    await processes.scrollIntoViewIfNeeded();
    const zoomTrigger = processes
      .locator('button[aria-label^="Zoom diagram:"]')
      .first();
    await expect(zoomTrigger).toBeVisible();
    await zoomTrigger.click();
    const zoomOutBtn = page.getByRole("button", { name: /Zoom out/i });
    await expect(zoomOutBtn).toBeVisible();
    await expectNoBrokenAriaRefs(page);
    await expectNoAxeViolations(page, "Process Lightbox");
    await page.keyboard.press("Escape");
    await expect(zoomOutBtn).toBeHidden();

    // BPMN Overlay
    await page.evaluate(() => {
      window.location.hash = "#bpmn";
    });
    const bpmnDialog = page.getByRole("dialog", {
      name: "Portfolio System Operation Blueprint",
    });
    await expect(bpmnDialog).toBeVisible();
    await expectNoBrokenAriaRefs(page);
    await expectNoAxeViolations(page, "BPMN Overlay");
    await page.keyboard.press("Escape");
    await expect(bpmnDialog).toBeHidden();
  });
});
