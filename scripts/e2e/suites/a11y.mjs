export const id = "a11y";
export const name = "Accessibility & Keyboard Navigation";

export async function run({ page, urls, record, sleep }) {
  console.log("\n--- Suite: Accessibility & Keyboard Navigation ---");

  await page.goto(urls, { waitUntil: "domcontentloaded" });
  const skipButton = page.locator("button:has-text('Skip')");
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipButton.click({ force: true }).catch(() => {});
  }
  await page.waitForSelector("#main-content", { timeout: 8000 });

  // 1. FAQ Accordion Keyboard Navigation (<kbd>Enter</kbd> and <kbd>Space</kbd>)
  const faqSection = page.locator("#faq");
  await faqSection.scrollIntoViewIfNeeded();
  await sleep(600);

  const firstTrigger = page.locator("#faq button.group").first();
  const triggerPresent = (await firstTrigger.count()) > 0;
  record("FAQ Trigger Available for Keyboard Focus", triggerPresent);

  if (triggerPresent) {
    // Focus trigger
    await firstTrigger.focus();
    await sleep(200);

    // Expand with Enter
    await page.keyboard.press("Enter");
    await sleep(500);

    const openedWithEnter = await firstTrigger.evaluate((el) =>
      el.hasAttribute("data-panel-open")
    );
    record("Accordion Trigger Toggles Open via <Enter>", openedWithEnter);

    // Collapse with Space
    await page.keyboard.press("Space");
    await sleep(500);

    const closedWithSpace = await firstTrigger.evaluate(
      (el) => !el.hasAttribute("data-panel-open")
    );
    record("Accordion Trigger Toggles Closed via <Space>", closedWithSpace);
  }

  // 2. Base UI hiddenUntilFound attribute on collapsed panels
  const collapsedPanel = page.locator("#faq [hidden='until-found']").first();
  const hasHiddenUntilFound = (await collapsedPanel.count()) > 0;
  record(
    "Collapsed FAQ Panel Has hidden='until-found' For In-Page Search",
    hasHiddenUntilFound
  );

  // 3. Modal Dialog Dismissal via <Escape> Key
  await page.goto(`${urls}#cv`, { waitUntil: "domcontentloaded" });
  await sleep(800);

  const cvModal = page.locator("dialog, [role='dialog'], #pdf-viewer");
  const modalOpened = (await cvModal.count()) > 0;
  record("CV Modal Dialog Opened via Hash", modalOpened);

  if (modalOpened) {
    await page.keyboard.press("Escape");
    await sleep(600);

    const currentHash = page.url();
    const modalDismissed = !currentHash.includes("#cv");
    record(
      "Modal Dismisses on <Escape> Key Press",
      modalDismissed,
      `Current URL: ${currentHash}`
    );
  }
}
