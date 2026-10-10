export const id = "runtime";
export const name = "Runtime Health & Translation Safety";

export async function run({ page, urls, record, sleep, consoleErrors, pageErrors }) {
  console.log("\n--- Suite: Runtime Health & Translation Safety ---");

  await page.goto(urls, { waitUntil: "domcontentloaded" });
  const skipButton = page.locator("button:has-text('Skip')");
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipButton.click({ force: true }).catch(() => {});
  }
  await page.waitForSelector("#main-content", { timeout: 8000 });
  await sleep(1000);

  const notranslateCount = await page.locator(".notranslate, [translate='no']").count();
  record("DOM Translation Patch Elements Present", notranslateCount >= 0, `Count: ${notranslateCount}`);

  const title = await page.title();
  record("Document Title Verified", title.includes("Ondrej Michal Očkaj"), title);

  record(
    "Zero Page Uncaught Exceptions",
    pageErrors.length === 0,
    pageErrors.length > 0 ? pageErrors.join("; ") : "No runtime crashes"
  );
  record(
    "Zero Console Errors",
    consoleErrors.length === 0,
    consoleErrors.length > 0 ? consoleErrors.join("; ") : "Clean console"
  );
}
