import { describe, it, expect } from "vitest";
import { SPRING } from "../../../utils/springConfig";
import {
  computeTargetScales,
  resolveContextHighlightClass,
} from "../liquidGlassUtils";

describe("LiquidGlassTabs Spring & Anisotropic Dynamics", () => {
  it("tunes SPRING.highlight to the Apple physics preset", () => {
    expect(SPRING.highlight.type).toBe("spring");
    expect(SPRING.highlight.stiffness).toBe(640);
    expect(SPRING.highlight.damping).toBe(42);
    expect(SPRING.highlight.mass).toBeCloseTo(0.7, 2);
    expect(SPRING.highlight.restDelta).toBeCloseTo(0.001, 3);
  });

  describe("computeTargetScales anisotropic stretching", () => {
    const dimensions = { width: 120, height: 36 };

    it("returns 1.0 resting scale when stationary and unpressed", () => {
      const result = computeTargetScales(
        false, // isPressed
        false, // isHoverActive
        false, // isTransitioning
        "horizontal",
        false, // isMobileNav
        dimensions,
        1,
        false,
      );
      expect(result).toEqual({ targetScaleX: 1, targetScaleY: 1 });
    });

    it("stretches horizontal tabs along X and compresses along Y with volume preservation", () => {
      // 1-step adjacent jump (distance = 1) -> +4% stretch, -0.8% compress
      const step1 = computeTargetScales(
        false,
        false,
        true, // isTransitioning
        "horizontal",
        false,
        dimensions,
        1,
        false,
      );
      expect(step1.targetScaleX).toBeCloseTo(1 + 0.04, 4); // 1.04
      expect(step1.targetScaleY).toBeCloseTo(1 - 0.008, 4); // 0.992

      // 2-step jump (distance = 2) -> +5.5% stretch, -1.1% compress
      const step2 = computeTargetScales(
        false,
        false,
        true,
        "horizontal",
        false,
        dimensions,
        2,
        false,
      );
      expect(step2.targetScaleX).toBeCloseTo(1 + 0.055, 4); // 1.055
      expect(step2.targetScaleY).toBeCloseTo(1 - 0.011, 4); // 0.989

      // 4-step jump (distance = 4: reaches 8% clamp)
      const step4 = computeTargetScales(
        false,
        false,
        true,
        "horizontal",
        false,
        dimensions,
        4,
        false,
      );
      expect(step4.targetScaleX).toBeCloseTo(1.08, 4); // capped at +8%
      expect(step4.targetScaleY).toBeCloseTo(1 - 0.015, 4); // capped at -1.5%
    });

    it("dampens stretch and eliminates height squish for 2-card toggles (Idea 1: tabCount <= 2)", () => {
      // 2-card toggle: tabCount = 2, distance = 1 -> dampened to +1.6% stretch and 1.0 height (zero squish)
      const binaryToggle = computeTargetScales(
        false, // isPressed
        false, // isHoverActive
        true, // isTraveling
        "horizontal",
        false, // isMobileNav
        dimensions,
        1, // tabDistance
        false, // prefersReducedMotion
        2, // tabCount = 2
      );
      expect(binaryToggle.targetScaleX).toBeCloseTo(1 + 0.016, 4); // +1.6% dampened
      expect(binaryToggle.targetScaleY).toBe(1.0); // ZERO vertical compression
    });

    it("stretches vertical tabs along Y and compresses along X with volume preservation", () => {
      // 1-step jump (distance = 1) -> +3.2% stretch, -0.8% compress
      const step1 = computeTargetScales(
        false,
        false,
        true,
        "vertical",
        false,
        dimensions,
        1,
        false,
      );
      expect(step1.targetScaleY).toBeCloseTo(1 + 0.032, 4); // 1.032
      expect(step1.targetScaleX).toBeCloseTo(1 - 0.008, 4); // 0.992

      // 2-step jump (distance = 2) -> +4.4% stretch, -1.1% compress
      const step2 = computeTargetScales(
        false,
        false,
        true,
        "vertical",
        false,
        dimensions,
        2,
        false,
      );
      expect(step2.targetScaleY).toBeCloseTo(1 + 0.044, 4); // 1.044
      expect(step2.targetScaleX).toBeCloseTo(1 - 0.011, 4); // 0.989

      // Wide jump (distance = 5: capped at +6.5%)
      const step5 = computeTargetScales(
        false,
        false,
        true,
        "vertical",
        false,
        dimensions,
        5,
        false,
      );
      expect(step5.targetScaleY).toBeCloseTo(1.065, 4); // capped at +6.5%
      expect(step5.targetScaleX).toBeCloseTo(1 - 0.015, 4); // capped at -1.5%
    });

    it("returns even pixel expansion with ZERO squish when pressed", () => {
      // Desktop press scale: tapDelta = 4.5px. scaleX = 1 + 9/120 = 1.075, scaleY = 1 + 9/36 = 1.25
      const pressedDesktop = computeTargetScales(
        true, // isPressed
        true, // isHoverActive
        true, // isTraveling
        "horizontal",
        false, // isMobileNav
        dimensions,
        3, // tabDistance > 0
        false,
      );
      expect(pressedDesktop.targetScaleX).toBeCloseTo(1 + 9 / 120, 4);
      expect(pressedDesktop.targetScaleY).toBeCloseTo(1 + 9 / 36, 4);

      // Mobile press scale: tapDelta = 2.5px. scaleX = 1 + 5/120 = 1.0417, scaleY = 1 + 5/36 = 1.1389
      const pressedMobile = computeTargetScales(
        true, // isPressed
        false,
        false,
        "horizontal",
        true, // isMobileNav
        dimensions,
        1,
        false,
      );
      expect(pressedMobile.targetScaleX).toBeCloseTo(1 + 5 / 120, 4);
      expect(pressedMobile.targetScaleY).toBeCloseTo(1 + 5 / 36, 4);
    });

    it("returns resting hover scale using old good formula (even pixel growth on all 4 sides)", () => {
      // Desktop hover: delta = 2.5px. scaleX = 1 + 5/120 = 1.0417, scaleY = 1 + 5/36 = 1.1389
      const hoveredDesktop = computeTargetScales(
        false, // isPressed
        true, // isHoverActive
        false, // isTraveling
        "horizontal",
        false, // isMobileNav
        dimensions,
        0,
        false,
      );
      expect(hoveredDesktop.targetScaleX).toBeCloseTo(1 + 5 / 120, 4);
      expect(hoveredDesktop.targetScaleY).toBeCloseTo(1 + 5 / 36, 4);
    });

    it("respects reduced motion preference by suppressing stretch entirely", () => {
      const reduced = computeTargetScales(
        false,
        true,
        true,
        "horizontal",
        false,
        dimensions,
        5,
        true, // prefersReducedMotion
      );
      expect(reduced).toEqual({ targetScaleX: 1, targetScaleY: 1 });
    });
  });

  describe("resolveContextHighlightClass", () => {
    it("returns navbar-highlight-active when active (hovered or transitioning)", () => {
      const result = resolveContextHighlightClass(
        "navbar-highlight-flat",
        true, // isNavbarActive
      );
      expect(result).toBe("navbar-highlight-active");
    });

    it("returns navbar-highlight-flat when stationary and idle", () => {
      const result = resolveContextHighlightClass(
        "navbar-highlight-flat",
        false, // isNavbarActive
      );
      expect(result).toBe("navbar-highlight-flat");
    });

    it("handles absent or custom highlight class cleanly", () => {
      expect(resolveContextHighlightClass(undefined, true)).toBe(
        "",
      );
      expect(resolveContextHighlightClass(undefined, false)).toBe("");
      expect(
        resolveContextHighlightClass("custom-accent", true),
      ).toBe("custom-accent");
    });
  });
});
