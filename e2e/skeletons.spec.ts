import { test, expect } from "./fixtures";

test.describe("Boneyard Skeletons & Shells", () => {
  test("renders all 7 landmark shells in DOM on initial load", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const landmarkIds = [
      "home",
      "work",
      "skills",
      "processes",
      "journal",
      "faq",
      "contact",
    ];
    for (const id of landmarkIds) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
  });
});
