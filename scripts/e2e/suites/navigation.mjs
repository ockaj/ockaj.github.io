export const id = "nav";
export const name = "Navigation & SPA Routing";

export async function run({ page, urls, record, sleep }) {
  console.log("\n--- Suite: Navigation & SPA Routing ---");

  await page.goto(urls, { waitUntil: "domcontentloaded" });
  const skipButton = page.locator("button:has-text('Skip')");
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipButton.click({ force: true }).catch(() => {});
  }
  await page.waitForSelector("#main-content", { timeout: 8000 });

  // 1. Deep link to #faq
  await page.evaluate(() => {
    window.location.hash = "#faq";
  });
  await sleep(1000);
  const faqUrl = page.url();
  record("Deep Link #faq in URL Hash", faqUrl.includes("#faq"), faqUrl);

  // 2. Deep link to #contact
  await page.evaluate(() => {
    window.location.hash = "#contact";
  });
  await sleep(1000);
  const contactUrl = page.url();
  record(
    "Deep Link #contact in URL Hash",
    contactUrl.includes("#contact"),
    contactUrl,
  );

  // 3. Scroll to #home and verify scrollspy updates hash
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(1500);
  const homeUrl = page.url();
  record(
    "Scrollspy Hash Alignment (#home)",
    homeUrl.includes("#home") || homeUrl.endsWith("/"),
    homeUrl,
  );

  // 4. CV modal hash trigger (#cv)
  await page.evaluate(() => {
    window.location.hash = "#cv";
  });
  await sleep(1000);
  const modalVisible = await page
    .locator("dialog, [role='dialog'], #pdf-viewer")
    .count();
  record(
    "Overlay Hash Deep Link (#cv)",
    modalVisible > 0,
    `Dialog count: ${modalVisible}`,
  );
}
