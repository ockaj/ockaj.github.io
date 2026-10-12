import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "../../store/useAppStore";
import {
  normalizePrefix,
  formatEntityModalId,
  resolveEntity,
  resolveEntityFallbackHash,
} from "../useEntityModal";

interface TestEntity {
  id: string;
  name: string;
}

interface NumericEntity {
  id: number;
  title: string;
}

const STRING_ITEMS = new Map<string, TestEntity>([
  ["1", { id: "1", name: "Entity One" }],
  ["alpha", { id: "alpha", name: "Entity Alpha" }],
]);

const NUMERIC_ITEMS = new Map<number, NumericEntity>([
  [1, { id: 1, title: "Item One" }],
  [2, { id: 2, title: "Item Two" }],
]);

describe("useEntityModal helpers and store integration", () => {
  beforeEach(() => {
    useAppStore.setState({
      isLoading: false,
      hasCvMounted: false,
      activeSection: "home",
      activeModal: null,
      cvLang: "en",
    });
  });

  describe("normalizePrefix", () => {
    it("ensures prefix ends with a hyphen", () => {
      expect(normalizePrefix("case-study")).toBe("case-study-");
      expect(normalizePrefix("case-study-")).toBe("case-study-");
      expect(normalizePrefix("article")).toBe("article-");
      expect(normalizePrefix("lightbox")).toBe("lightbox-");
    });
  });

  describe("formatEntityModalId", () => {
    it("formats modal ID from string identifier", () => {
      expect(formatEntityModalId("case-study", "1")).toBe("case-study-1");
      expect(formatEntityModalId("article", "sample-slug")).toBe(
        "article-sample-slug",
      );
    });

    it("formats modal ID from numeric identifier", () => {
      expect(formatEntityModalId("lightbox", 42)).toBe("lightbox-42");
    });

    it("formats modal ID from identifiable entity object", () => {
      expect(
        formatEntityModalId("case-study", { id: "project-x", name: "Test" }),
      ).toBe("case-study-project-x");
      expect(formatEntityModalId("lightbox", { id: 7, title: "Diagram" })).toBe(
        "lightbox-7",
      );
    });

    it("returns null for invalid inputs", () => {
      expect(formatEntityModalId("case-study", null)).toBeNull();
      expect(formatEntityModalId("case-study", undefined)).toBeNull();
      expect(formatEntityModalId("case-study", {})).toBeNull();
    });
  });

  describe("resolveEntity", () => {
    it("retrieves entity by string key from string map", () => {
      const entity = resolveEntity(STRING_ITEMS, "1");
      expect(entity).toEqual({ id: "1", name: "Entity One" });
    });

    it("retrieves entity by string key from numeric map", () => {
      const entity = resolveEntity(NUMERIC_ITEMS, "2");
      expect(entity).toEqual({ id: 2, title: "Item Two" });
    });

    it("returns null when key does not exist", () => {
      expect(resolveEntity(STRING_ITEMS, "999")).toBeNull();
      expect(resolveEntity(NUMERIC_ITEMS, "999")).toBeNull();
    });

    it("supports functional entity lookups", () => {
      const lookup = (id: string) =>
        id === "dynamic" ? { id: "dynamic", name: "Dynamic Item" } : null;

      expect(resolveEntity(lookup, "dynamic")).toEqual({
        id: "dynamic",
        name: "Dynamic Item",
      });
      expect(resolveEntity(lookup, "missing")).toBeNull();
    });
  });

  describe("resolveEntityFallbackHash", () => {
    it("derives parent section hash from prefix", () => {
      expect(resolveEntityFallbackHash("case-study")).toBe("#work");
      expect(resolveEntityFallbackHash("case-study-")).toBe("#work");
      expect(resolveEntityFallbackHash("article")).toBe("#journal");
      expect(resolveEntityFallbackHash("lightbox")).toBe("#processes");
    });

    it("respects custom fallback hash when provided", () => {
      expect(resolveEntityFallbackHash("case-study", "#custom-section")).toBe(
        "#custom-section",
      );
    });
  });

  describe("store interaction", () => {
    it("updates store when opening entity modal via formatted ID", () => {
      const modalId = formatEntityModalId("case-study", "1");
      expect(modalId).toBe("case-study-1");

      useAppStore.getState().openModal(modalId!);
      expect(useAppStore.getState().activeModal).toBe("case-study-1");

      useAppStore.getState().closeModal();
      expect(useAppStore.getState().activeModal).toBeNull();
    });
  });
});
