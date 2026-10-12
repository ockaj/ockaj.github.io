export const id = "drawer";
export const name = "BaseDrawer & Entity Modals";

export async function run({ page, urls, record, sleep }) {
  console.log("\n--- Suite: BaseDrawer & Entity Modals ---");

  await page.goto(urls, { waitUntil: "domcontentloaded" });
  const skipButton = page.locator("button:has-text('Skip')");
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipButton.click({ force: true }).catch(() => {});
  }
  await page.waitForSelector("#main-content", { timeout: 8000 });

  // 1. Deep link to #case-study-1
  await page.goto(`${urls}#case-study-1`, { waitUntil: "domcontentloaded" });
  await sleep(600);
  const dialog = page.locator("[role='dialog']");
  const isDialogOpen = await dialog.isVisible();
  record("Case Study Drawer Opens via Hash (#case-study-1)", isDialogOpen);

  // 2. Click backdrop to dismiss (tests DrawerBackdrop with useDrawerContext)
  const backdrop = page.locator(".fixed.inset-0.z-90");
  await backdrop.click({ position: { x: 50, y: 50 } });
  await sleep(600);
  const isDialogClosed = !(await dialog.isVisible());
  const currentUrl = page.url();
  record(
    "Backdrop Click Closes Drawer & Restores URL (#work)",
    isDialogClosed && currentUrl.includes("#work"),
    currentUrl,
  );

  // 3. Open via card click
  const caseStudyCard = page.locator("article").first();
  await caseStudyCard.scrollIntoViewIfNeeded();
  await sleep(400);
  await caseStudyCard.click();
  await sleep(600);
  const isCardOpened = await dialog.isVisible();
  const cardUrl = page.url();
  record(
    "Case Study Card Click Opens Drawer",
    isCardOpened && cardUrl.includes("#case-study-"),
    cardUrl,
  );

  // 4. Close via close button
  const closeBtn = page.locator("button[aria-label='Close panel']");
  await closeBtn.click();
  await sleep(600);
  const isCloseBtnClosed = !(await dialog.isVisible());
  record("Close Button Dismisses Drawer", isCloseBtnClosed);

  // 5. Invalid deep-link recovery (#case-study-999)
  await page.goto(`${urls}#case-study-999`, { waitUntil: "domcontentloaded" });
  await sleep(600);
  const isInvalidClosed = !(await dialog.isVisible().catch(() => false));
  const recoveredUrl = page.url();
  record(
    "Invalid Deep Link Recovery to #work",
    isInvalidClosed && recoveredUrl.includes("#work"),
    recoveredUrl,
  );

  // 6. Journal Drawer & Backdrop Dismissal
  await page.goto(`${urls}#article-bpmn-traps`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("[role='dialog']", { timeout: 4000 }).catch(() => {});
  const journalOpen = await dialog.isVisible();
  record("Journal Drawer Opens via Hash", journalOpen);

  await backdrop.click({ position: { x: 50, y: 50 } });
  await sleep(600);
  const journalClosed = !(await dialog.isVisible());
  const journalUrl = page.url();
  record(
    "Journal Backdrop Click Closes Drawer & Restores #journal",
    journalClosed && journalUrl.includes("#journal"),
    journalUrl,
  );

  // 7. Reduced motion accessibility
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${urls}#case-study-1`, { waitUntil: "domcontentloaded" });
  await sleep(300);
  const rmOpen = await dialog.isVisible();
  record("Drawer Opens under prefers-reduced-motion", rmOpen);

  await backdrop.click({ position: { x: 50, y: 50 } });
  await sleep(600);
  const rmClosed = !(await dialog.isVisible());
  record("Drawer Closes under prefers-reduced-motion", rmClosed);

  await page.emulateMedia({ reducedMotion: "no-preference" });
}
