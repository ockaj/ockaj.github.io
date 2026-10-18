import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  toOklch,
  unwrapHues,
  clamp,
  areStopsEqual,
  normalizeStops,
  getInitialReveal,
  extractDimensions,
  DEFAULT_COLOR_STOPS,
  MAX_STOPS,
} from "../auroraUtils";

describe("Aurora Color Pipeline & Utilities", () => {
  describe("hexToRgb", () => {
    it("converts standard 6-digit hex codes into normalized [0, 1] RGB floats", () => {
      const rgb = hexToRgb("#FFFFFF");
      expect(rgb[0]).toBeCloseTo(1.0);
      expect(rgb[1]).toBeCloseTo(1.0);
      expect(rgb[2]).toBeCloseTo(1.0);

      const black = hexToRgb("#000000");
      expect(black[0]).toBeCloseTo(0.0);
      expect(black[1]).toBeCloseTo(0.0);
      expect(black[2]).toBeCloseTo(0.0);

      const indigo = hexToRgb("#1E1B4B");
      expect(indigo[0]).toBeCloseTo(0x1e / 255);
      expect(indigo[1]).toBeCloseTo(0x1b / 255);
      expect(indigo[2]).toBeCloseTo(0x4b / 255);
    });

    it("converts 3-digit shorthand hex codes correctly", () => {
      const red = hexToRgb("#F00");
      expect(red[0]).toBeCloseTo(1.0);
      expect(red[1]).toBeCloseTo(0.0);
      expect(red[2]).toBeCloseTo(0.0);
    });

    it("parses 8-digit hex codes by taking the first 6 characters", () => {
      const parsed = hexToRgb("#1E1B4BFF");
      expect(parsed[0]).toBeCloseTo(0x1e / 255);
      expect(parsed[1]).toBeCloseTo(0x1b / 255);
      expect(parsed[2]).toBeCloseTo(0x4b / 255);
    });

    it("handles boundary, empty, and invalid hex inputs with fallback to zeros without NaN", () => {
      const emptyResult = hexToRgb("");
      expect(emptyResult).toEqual([0, 0, 0]);

      const invalidResult = hexToRgb("invalid-hex-string");
      expect(invalidResult).toEqual([0, 0, 0]);

      const unknownInput = hexToRgb(null as unknown as string);
      expect(unknownInput).toEqual([0, 0, 0]);
    });
  });

  describe("toOklch", () => {
    it("maps pure black to zero lightness, chroma, and hue", () => {
      const lch = toOklch([0, 0, 0]);
      expect(lch[0]).toBeCloseTo(0.0, 3);
      expect(lch[1]).toBeCloseTo(0.0, 3);
      expect(lch[2]).toBeCloseTo(0.0, 3);
    });

    it("maps pure white to near-unit lightness and zero chroma", () => {
      const lch = toOklch([1, 1, 1]);
      expect(lch[0]).toBeCloseTo(1.0, 2);
      expect(lch[1]).toBeCloseTo(0.0, 2);
    });

    it("calculates positive chroma and valid hues for saturated primary colors", () => {
      const redLch = toOklch([1, 0, 0]);
      expect(redLch[0]).toBeGreaterThan(0.5);
      expect(redLch[1]).toBeGreaterThan(0.2);
    });
  });

  describe("unwrapHues", () => {
    it("unwraps hue angles that cross the pi boundary to prevent interpolation spins", () => {
      const stops: [number, number, number][] = [
        [0.5, 0.2, 3.0],
        [0.5, 0.2, -3.0],
      ];
      const unwrapped = unwrapHues(stops);
      expect(unwrapped).toHaveLength(2);
      expect(Math.abs(unwrapped[1][2] - unwrapped[0][2])).toBeLessThanOrEqual(
        Math.PI,
      );
    });

    it("falls back to anchor or previous hue for neutral / reduced chroma stops", () => {
      const stops: [number, number, number][] = [
        [0.2, 0.005, 0.0],
        [0.6, 0.25, 1.2],
        [0.8, 0.001, 0.0],
      ];
      const unwrapped = unwrapHues(stops);
      expect(unwrapped[0][2]).toBeCloseTo(1.2, 2);
      expect(unwrapped[2][2]).toBeCloseTo(1.2, 2);
    });

    it("handles all-neutral stops by defaulting missing hue anchor to 0", () => {
      const neutralStops: [number, number, number][] = [
        [0.1, 0.001, 0.5],
        [0.2, 0.001, 0.9],
      ];
      const unwrapped = unwrapHues(neutralStops);
      expect(unwrapped[0][2]).toBe(0);
      expect(unwrapped[1][2]).toBe(0);
    });

    it("gracefully returns empty array on empty input", () => {
      const unwrapped = unwrapHues([]);
      expect(unwrapped).toEqual([]);
    });
  });

  describe("clamp", () => {
    it("preserves values within boundary limits", () => {
      expect(clamp(0.5, 0.0, 1.0)).toBe(0.5);
    });

    it("clamps values below the minimum boundary", () => {
      expect(clamp(-0.5, 0.0, 1.0)).toBe(0.0);
    });

    it("clamps values above the maximum boundary", () => {
      expect(clamp(1.5, 0.0, 1.0)).toBe(1.0);
    });
  });

  describe("areStopsEqual", () => {
    it("identifies identical stop arrays and reference matches", () => {
      expect(areStopsEqual(DEFAULT_COLOR_STOPS, DEFAULT_COLOR_STOPS)).toBe(
        true,
      );
      expect(areStopsEqual([...DEFAULT_COLOR_STOPS], DEFAULT_COLOR_STOPS)).toBe(
        true,
      );
    });

    it("detects differences in array length or color entries", () => {
      expect(areStopsEqual(["#000", "#FFF"], ["#000"])).toBe(false);
      expect(areStopsEqual(["#000", "#FFF"], ["#000", "#AAA"])).toBe(false);
    });

    it("handles null, undefined, or empty comparisons without throwing errors", () => {
      expect(areStopsEqual(null, undefined)).toBe(false);
      expect(areStopsEqual(undefined, undefined)).toBe(true);
      expect(areStopsEqual([], null)).toBe(false);
    });
  });

  describe("normalizeStops", () => {
    it("preserves valid stop arrays between 2 and MAX_STOPS entries", () => {
      const stops = ["#111111", "#222222", "#333333"];
      const normalized = normalizeStops(stops);
      expect(normalized).toEqual(stops);
    });

    it("duplicates the stop when only 1 stop is provided to ensure valid gradient pairs", () => {
      const single = ["#ABCDEF"];
      const normalized = normalizeStops(single);
      expect(normalized).toEqual(["#ABCDEF", "#ABCDEF"]);
    });

    it("slices arrays exceeding MAX_STOPS down to 5 stops", () => {
      const excessive = ["#1", "#2", "#3", "#4", "#5", "#6", "#7"];
      const normalized = normalizeStops(excessive);
      expect(normalized).toHaveLength(MAX_STOPS);
      expect(normalized).toEqual(["#1", "#2", "#3", "#4", "#5"]);
    });

    it("falls back to DEFAULT_COLOR_STOPS for null, undefined, empty, or all-invalid inputs", () => {
      expect(normalizeStops(null)).toEqual(DEFAULT_COLOR_STOPS);
      expect(normalizeStops()).toEqual(DEFAULT_COLOR_STOPS);
      expect(normalizeStops([])).toEqual(DEFAULT_COLOR_STOPS);
      expect(normalizeStops(["", ""])).toEqual(DEFAULT_COLOR_STOPS);
    });
  });

  describe("getInitialReveal", () => {
    it("returns 0 while paused is true regardless of reduced motion or intro flag", () => {
      expect(getInitialReveal(true, false, true)).toBe(0);
      expect(getInitialReveal(false, true, true)).toBe(0);
      expect(getInitialReveal(false, false, true)).toBe(0);
      expect(getInitialReveal(true, true, true)).toBe(0);
    });

    it("returns 1 when prefersReducedMotion is active and paused is false", () => {
      expect(getInitialReveal(true, true, false)).toBe(1);
      expect(getInitialReveal(false, true, false)).toBe(1);
    });

    it("returns 1 when intro is explicitly disabled and paused is false", () => {
      expect(getInitialReveal(false, false, false)).toBe(1);
    });

    it("returns 0 for normal unpaused startup with intro enabled", () => {
      expect(getInitialReveal(true, false, false)).toBe(0);
      expect(getInitialReveal(undefined, undefined, false)).toBe(0);
    });
  });

  describe("extractDimensions", () => {
    it("extracts inline and block dimensions from borderBoxSize array", () => {
      const mockEntry = {
        borderBoxSize: [{ inlineSize: 1280, blockSize: 720 }],
        contentRect: { width: 1000, height: 600 },
      } as unknown as ResizeObserverEntry;

      const [w, h] = extractDimensions(mockEntry);
      expect(w).toBe(1280);
      expect(h).toBe(720);
    });

    it("extracts dimensions from borderBoxSize single object fallback", () => {
      const mockEntry = {
        borderBoxSize: { inlineSize: 800, blockSize: 600 },
        contentRect: { width: 700, height: 500 },
      } as unknown as ResizeObserverEntry;

      const [w, h] = extractDimensions(mockEntry);
      expect(w).toBe(800);
      expect(h).toBe(600);
    });

    it("falls back to contentRect when borderBoxSize has zero dimensions or is missing", () => {
      const mockZero = {
        borderBoxSize: [{ inlineSize: 0, blockSize: 0 }],
        contentRect: { width: 1024, height: 768 },
      } as unknown as ResizeObserverEntry;
      expect(extractDimensions(mockZero)).toEqual([1024, 768]);

      const mockMissing = {
        contentRect: { width: 900, height: 450 },
      } as unknown as ResizeObserverEntry;
      expect(extractDimensions(mockMissing)).toEqual([900, 450]);
    });

    it("safely handles null or undefined entries by returning zeros", () => {
      expect(extractDimensions(null)).toEqual([0, 0]);
      expect(extractDimensions()).toEqual([0, 0]);
    });
  });
});

