export const id = "cls";
export const name = "Cumulative Layout Shift (CLS)";

export async function run({ page, urls, record, sleep }) {
  console.log("\n--- Suite: Cumulative Layout Shift (CLS) ---");

  // Navigate with CLS PerformanceObserver attached
  await page.goto(urls, { waitUntil: "domcontentloaded" });

  await page.evaluate(() => {
    window.__clsScore = 0;
    window.__clsEntries = [];
    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__clsScore += entry.value;
          window.__clsEntries.push({
            value: entry.value,
          });
        }
      }
    });
    observer.observe({ type: "layout-shift", buffered: true });
  });

  const skipButton = page.locator("button:has-text('Skip')");
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipButton.click();
  }
  await page.waitForSelector("#main-content", { timeout: 8000 });
  await sleep(1000);

  const initialCls = await page.evaluate(() => window.__clsScore);
  record("Initial Page Load CLS < 0.05", initialCls < 0.05, `CLS: ${initialCls.toFixed(4)}`);

  const sections = ["#home", "#work", "#skills", "#processes", "#journal", "#faq", "#contact"];
  for (const sectionId of sections) {
    const loc = page.locator(sectionId);
    if (await loc.isVisible().catch(() => false)) {
      await loc.scrollIntoViewIfNeeded();
      await sleep(250);
    }
  }

  const scrollCls = await page.evaluate(() => window.__clsScore);
  record("Full Page Scroll CLS < 0.05", scrollCls < 0.05, `CLS: ${scrollCls.toFixed(4)}`);

  await page.goto(`${urls}#contact`, { waitUntil: "domcontentloaded" });
  await sleep(1000);
  const contactCls = await page.evaluate(() => window.__clsScore);
  record("Deep Link Anchor Jump CLS < 0.05", contactCls < 0.05, `CLS: ${contactCls.toFixed(4)}`);
}
