export const id = "session";
export const name = "Session Storage & Zero-Flash Loading";

export async function run({ page, urls, record, sleep }) {
  console.log("\n--- Suite: Session Storage & Zero-Flash Loading ---");

  // 1. Initial Fresh Visit: Storage is empty, LoadingScreen appears
  await page.context().clearCookies();
  await page.goto(urls, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });
  await page.reload({ waitUntil: "domcontentloaded" });

  const skipButton = page.locator("button:has-text('Skip')");
  const hasLoadingScreen = await skipButton.isVisible({ timeout: 2500 }).catch(() => false);
  record("Fresh Visit Shows Loading Screen", hasLoadingScreen);

  if (hasLoadingScreen) {
    await skipButton.click();
    await page.waitForSelector("#main-content", { timeout: 8000 });
  }

  // 2. Repeat Visit: portfolio_loaded flag set, LoadingScreen bypassed immediately (Zero Flash)
  await page.evaluate(() => {
    try {
      localStorage.setItem("portfolio_loaded", "true");
    } catch {}
  });
  await page.reload({ waitUntil: "domcontentloaded" });

  const skipButtonOnRepeat = page.locator("button:has-text('Skip')");
  const loadingScreenOnRepeat = await skipButtonOnRepeat.isVisible({ timeout: 1000 }).catch(() => false);
  const mainContentVisibleImmediately = await page.locator("#main-content").isVisible();

  record(
    "Repeat Visit Bypasses Loading Screen (Zero Flash)",
    !loadingScreenOnRepeat && mainContentVisibleImmediately,
    `LoadingScreen: ${loadingScreenOnRepeat}, MainContent: ${mainContentVisibleImmediately}`
  );

  // 3. Storage Error Resilience: Simulate sandboxed or restricted storage throwing SecurityError
  await page.evaluate(() => {
    try {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new DOMException("The operation is insecure.", "SecurityError");
        },
        configurable: true,
      });
    } catch {}
  });

  await page.reload({ waitUntil: "domcontentloaded" });
  await sleep(1000);

  // If loading screen is shown due to fallback, skip it
  const skipButtonFallback = page.locator("button:has-text('Skip')");
  if (await skipButtonFallback.isVisible({ timeout: 1500 }).catch(() => false)) {
    await skipButtonFallback.click();
  }

  const mainContentHealthy = await page.locator("#main-content").isVisible();
  record("Restricted Storage Fallback Loads Safely", mainContentHealthy);
}
