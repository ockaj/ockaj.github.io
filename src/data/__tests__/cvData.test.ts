import { describe, it, expect } from "vitest";
import { CV_DATA } from "../cvData";

describe("CV data structure and privacy invariants", () => {
  it("ensures phone and address remain anonymized in Slovak and English", () => {
    for (const lang of ["sk", "en"] as const) {
      const data = CV_DATA[lang];

      // Phone must NOT contain digits (must be a placeholder/request prompt)
      expect(data.phone).not.toMatch(/\d/);
      expect(data.phone.toLowerCase()).toMatch(/vyžiadanie|request/);

      // Location must NOT contain street address or house numbers
      expect(data.location).not.toMatch(/\d/);
      expect(["Slovensko", "Slovakia"]).toContain(data.location);
    }
  });

  it("contains valid sections, Word, and new certificates in Slovak and English", () => {
    for (const lang of ["sk", "en"] as const) {
      const data = CV_DATA[lang];

      expect(data.title).toBe("Bc. Ondrej Michal Očkaj");
      expect(data.profile.text.length).toBeGreaterThan(50);
      expect(data.experience.items.length).toBeGreaterThan(0);
      expect(data.education.items.length).toBeGreaterThan(0);
      expect(data.languages.items.length).toBeGreaterThan(0);

      // Certificates check
      expect(data.certificates?.items).toBeDefined();
      const certNames = data.certificates?.items.map((c) => c.name);
      expect(certNames).toContain(
        "Introduction to ADONIS (Student Level Credential)",
      );
      expect(certNames).toContain("SQL (Basic)");

      // Skills check for SQL and Word
      const officeCategory = data.skills.categories.find(
        (c) => c.name.includes("Kancelárske") || c.name.includes("Office"),
      );
      expect(officeCategory).toBeDefined();
      const items = officeCategory?.items ?? [];
      expect(items.some((item) => item.toLowerCase().includes("sql"))).toBe(
        true,
      );
      expect(items.some((item) => item.toLowerCase().includes("word"))).toBe(
        true,
      );
    }
  });

  it("handles boundary check for missing or unknown language keys gracefully", () => {
    const rawData = CV_DATA as unknown as { [key: string]: unknown };
    expect(rawData["unknown"]).toBeUndefined();
    expect(rawData["sk"]).toBeDefined();
    expect(rawData["en"]).toBeDefined();
  });
});
