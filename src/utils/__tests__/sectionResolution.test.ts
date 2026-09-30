import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  normalizeHash,
  resolveSectionFromHash,
  isValidModalHash,
  isTransientModalHash,
  safeDecodeFragment,
  findIndicatedElement,
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

  describe("safeDecodeFragment", () => {
    it("should return empty string for empty input", () => {
      expect(safeDecodeFragment("")).toBe("");
      expect(safeDecodeFragment("#")).toBe("");
    });

    it("should strip leading hash and return plain strings", () => {
      expect(safeDecodeFragment("#skills")).toBe("skills");
      expect(safeDecodeFragment("skills")).toBe("skills");
    });

    it("should decode percent-encoded sequences correctly", () => {
      expect(safeDecodeFragment("#case%20study")).toBe("case study");
      expect(safeDecodeFragment("#caf%C3%A9")).toBe("café");
    });

    it("should safely handle malformed percent sequences without throwing", () => {
      expect(() => safeDecodeFragment("#%E0%A4%A")).not.toThrow();
      expect(() => safeDecodeFragment("#work%ZZ")).not.toThrow();
    });

    it("should preserve valid multi-byte characters even when malformed sequences exist", () => {
      expect(safeDecodeFragment("#caf%C3%A9%ZZ")).toBe("café%ZZ");
    });
  });

  describe("findIndicatedElement", () => {
    const originalDocument = globalThis.document;
    const originalCSS = globalThis.CSS;

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      globalThis.document = originalDocument;
      globalThis.CSS = originalCSS;
    });

    it("should return null for empty fragment", () => {
      expect(findIndicatedElement("")).toBeNull();
    });

    it("should return null when document is undefined", () => {
      // @ts-expect-error testing undefined document
      delete globalThis.document;
      expect(findIndicatedElement("skills")).toBeNull();
    });

    it("should return documentElement for 'top' fragment case-insensitively when no element matches", () => {
      const mockDocElement = { id: "root" } as unknown as HTMLElement;
      globalThis.document = {
        documentElement: mockDocElement,
        getElementById: vi.fn(() => null),
        querySelector: vi.fn(() => null),
      } as unknown as Document;

      expect(findIndicatedElement("top")).toBe(mockDocElement);
      expect(findIndicatedElement("TOP")).toBe(mockDocElement);
    });

    it("should prioritize an element with id 'top' over documentElement", () => {
      const mockDocElement = { id: "root" } as unknown as HTMLElement;
      const mockTopElement = { id: "top" } as unknown as HTMLElement;
      globalThis.document = {
        documentElement: mockDocElement,
        getElementById: vi.fn((id: string) =>
          id === "top" ? mockTopElement : null,
        ),
        querySelector: vi.fn(() => null),
      } as unknown as Document;

      expect(findIndicatedElement("top")).toBe(mockTopElement);
    });

    it("should return element when found by ID", () => {
      const mockElement = { id: "skills" } as unknown as HTMLElement;
      globalThis.document = {
        getElementById: vi.fn((id: string) =>
          id === "skills" ? mockElement : null,
        ),
      } as unknown as Document;

      expect(findIndicatedElement("skills")).toBe(mockElement);
    });

    it("should return legacy anchor when element ID is not found", () => {
      const mockAnchor = {
        tagName: "A",
        name: "legacy-ref",
      } as unknown as HTMLElement;
      globalThis.document = {
        getElementById: vi.fn(() => null),
        querySelector: vi.fn((sel: string) =>
          sel === 'a[name="legacy-ref"]' ? mockAnchor : null,
        ),
      } as unknown as Document;
      globalThis.CSS = {
        escape: vi.fn((s: string) => s),
      } as unknown as typeof CSS;

      expect(findIndicatedElement("legacy-ref")).toBe(mockAnchor);
    });

    it("should return null when neither element ID nor legacy anchor exists", () => {
      globalThis.document = {
        getElementById: vi.fn(() => null),
        querySelector: vi.fn(() => null),
      } as unknown as Document;
      globalThis.CSS = {
        escape: vi.fn((s: string) => s),
      } as unknown as typeof CSS;

      expect(findIndicatedElement("nonexistent")).toBeNull();
    });

    it("should return null gracefully if document.querySelector throws", () => {
      globalThis.document = {
        getElementById: vi.fn(() => null),
        querySelector: vi.fn(() => {
          throw new Error("Invalid selector syntax");
        }),
      } as unknown as Document;

      expect(findIndicatedElement("invalid[syntax")).toBeNull();
    });
  });
});
