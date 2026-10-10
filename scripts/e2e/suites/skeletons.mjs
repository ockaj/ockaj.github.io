export const id = "skeletons";
export const name = "Boneyard Skeletons & Shells";

export async function run({ page, urls, record }) {
  console.log("\n--- Suite: Boneyard Skeletons & Shells ---");

  await page.goto(urls, { waitUntil: "domcontentloaded" });

  const landmarkIds = ["home", "work", "skills", "processes", "journal", "faq", "contact"];
  let shellsPresent = 0;
  for (const id of landmarkIds) {
    const el = page.locator(`#${id}`);
    if ((await el.count()) > 0) {
      shellsPresent++;
    }
  }
  record(
    "All 7 Landmark Shells in DOM on Frame 1",
    shellsPresent === landmarkIds.length,
    `Found: ${shellsPresent}/${landmarkIds.length}`
  );

  const contact = page.locator("#contact");
  record("ContactSection Static Anchor Present", (await contact.count()) > 0);

  const hero = page.locator("#home");
  record("Hero Section Static Anchor Present", (await hero.count()) > 0);
}
