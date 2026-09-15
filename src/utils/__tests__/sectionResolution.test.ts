import { describe, it, expect } from "vitest";
import {
  normalizeHash,
  resolveSectionFromHash,
  isValidModalHash,
  isTransientModalHash,
} from "../sectionResolution";

describe("sectionResolution", () => {
  describe("normalizeHash", () => {
    it("should return empty string for empty input", () => {
      expect(normalizeHash("")).toBe("");
    });

    it("should strip leading hash, query parameters, and lower-case the string", () => {
      expect(normalizeHash("#Work")).toBe("work");
      expect(normalizeHash("#work?foo=bar")).toBe("work");
      expect(normalizeHash("skills&session=123")).toBe("skills");
    });
  });

  describe("resolveSectionFromHash", () => {
    it("should map valid section hashes directly", () => {
      expect(resolveSectionFromHash("#home")).toBe("home");
      expect(resolveSectionFromHash("#work")).toBe("work");
      expect(resolveSectionFromHash("#skills")).toBe("skills");
      expect(resolveSectionFromHash("#processes")).toBe("processes");
      expect(resolveSectionFromHash("#journal")).toBe("journal");
      expect(resolveSectionFromHash("#faq")).toBe("faq");
      expect(resolveSectionFromHash("#contact")).toBe("contact");
    });

    it("should map modal hashes to their parent section", () => {
      expect(resolveSectionFromHash("#case-study-logistics")).toBe("work");
      expect(resolveSectionFromHash("#article-bpmn-best-practices")).toBe(
        "journal",
      );
      expect(resolveSectionFromHash("#lightbox-2")).toBe("processes");
    });

    it("should fallback to home for unknown, empty, or standalone modal hashes", () => {
      expect(resolveSectionFromHash("")).toBe("home");
      expect(resolveSectionFromHash("#unknown-section")).toBe("home");
      expect(resolveSectionFromHash("#cv")).toBe("home");
      expect(resolveSectionFromHash("#bpmn")).toBe("home");
      expect(resolveSectionFromHash("#nav")).toBe("home");
    });
  });

  describe("isValidModalHash", () => {
    it("should recognize valid modal hashes", () => {
      expect(isValidModalHash("#cv")).toBe(true);
      expect(isValidModalHash("#bpmn")).toBe(true);
      expect(isValidModalHash("#nav")).toBe(true);
      expect(isValidModalHash("#menu")).toBe(true);
      expect(isValidModalHash("#case-study-1")).toBe(true);
      expect(isValidModalHash("#article-2")).toBe(true);
      expect(isValidModalHash("#lightbox-0")).toBe(true);
    });

    it("should reject invalid modal hashes", () => {
      expect(isValidModalHash("")).toBe(false);
      expect(isValidModalHash("#home")).toBe(false);
      expect(isValidModalHash("#case-study-")).toBe(false);
      expect(isValidModalHash("#article-")).toBe(false);
      expect(isValidModalHash("#lightbox-abc")).toBe(false);
    });
  });

  describe("isTransientModalHash", () => {
    it("should return true for transient nav or menu hashes", () => {
      expect(isTransientModalHash("#nav")).toBe(true);
      expect(isTransientModalHash("#menu")).toBe(true);
    });

    it("should return false for persistent overlays", () => {
      expect(isTransientModalHash("#cv")).toBe(false);
      expect(isTransientModalHash("#case-study-1")).toBe(false);
      expect(isTransientModalHash("#home")).toBe(false);
    });
  });
});
