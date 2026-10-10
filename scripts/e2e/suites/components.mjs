export const id = "components";
export const name = "Base UI & Components";

export async function run({ page, urls, record, sleep }) {
  console.log("\n--- Suite: Base UI & Components ---");

  await page.goto(urls, { waitUntil: "domcontentloaded" });
  const skipButton = page.locator("button:has-text('Skip')");
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipButton.click();
  }
  await page.waitForSelector("#main-content", { timeout: 8000 });

  // 1. FAQ Accordion (Base UI uncontrolled data-panel-open)
  const faqSection = page.locator("#faq");
  await faqSection.scrollIntoViewIfNeeded();
  await sleep(800);

  const triggers = page.locator("#faq button.group");
  const triggerCount = await triggers.count();
  record("FAQ Triggers Present", triggerCount > 0, `Count: ${triggerCount}`);

  if (triggerCount > 0) {
    const firstFaqBtn = triggers.first();
    const firstPanel = page.locator("#faq [data-no-skeleton]").first();

    const initialOpen = await firstFaqBtn.evaluate((el) => el.hasAttribute("data-panel-open"));
    record("FAQ Initially Collapsed", !initialOpen);

    await firstFaqBtn.click();
    await sleep(500);

    const opened = await firstFaqBtn.evaluate((el) => el.hasAttribute("data-panel-open"));
    record("FAQ Expands on Click (data-panel-open)", opened);
    record("FAQ Content Readable", await firstPanel.isVisible());

    await firstFaqBtn.click();
    await sleep(500);
    const closed = await firstFaqBtn.evaluate((el) => el.hasAttribute("data-panel-open"));
    record("FAQ Collapses on Second Click", !closed);
  }

  // 2. Process Library (Tabs & Decoupled Actions)
  const processSection = page.locator("#processes");
  await processSection.scrollIntoViewIfNeeded();
  await sleep(800);

  const processTabs = page.locator("#processes button[role='tab']");
  const tabCount = await processTabs.count();
  record("Process Topic Tabs Rendered", tabCount > 0, `Count: ${tabCount}`);

  if (tabCount > 1) {
    const secondTab = processTabs.nth(1);
    await secondTab.click();
    await sleep(400);
    const isSelected = await secondTab.getAttribute("aria-selected");
    record("Process Tab Selection Switched", isSelected === "true");
  }
}
