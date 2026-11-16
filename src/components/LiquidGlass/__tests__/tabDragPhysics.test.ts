import { describe, it, expect } from "vitest";
import { SPRING } from "../../../utils/springConfig";
import {
  BASE_PILL_WIDTH,
  computeBoundarySquish,
  resolveReleaseRecoilVelocity,
  MAX_BOUNDARY_SQUISH_SCALE_X,
} from "../internal/tabDragPhysics";
import type { TabGeometry } from "../internal/liquidGlassStore";

describe("tabDragPhysics boundary collision squish & recoil oscillator", () => {
  const mockTabs: readonly TabGeometry[] = [
    { value: "overview", left: 10, width: 90, centerX: 55, height: 40, top: 4 },
    {
      value: "experience",
      left: 105,
      width: 110,
      centerX: 160,
      height: 40,
      top: 4,
    },
    { value: "skills", left: 220, width: 80, centerX: 260, height: 40, top: 4 },
  ];

  describe("SPRING.pillWallRecoil & SPRING.fluidDragStretch", () => {
    it("configures damped harmonic recoil spring matching iOS Segmented Control specification", () => {
      expect(SPRING.pillWallRecoil.type).toBe("spring");
      expect(SPRING.pillWallRecoil.stiffness).toBe(300);
      expect(SPRING.pillWallRecoil.damping).toBe(30);
      expect(SPRING.pillWallRecoil.mass).toBe(1);
      expect(SPRING.pillWallRecoil.restDelta).toBeCloseTo(0.001, 3);
    });

    it("configures fluid drag stretch spring calibrated for smooth fluid blob relaxation", () => {
      expect(SPRING.fluidDragStretch.type).toBe("spring");
      expect(SPRING.fluidDragStretch.stiffness).toBe(280);
      expect(SPRING.fluidDragStretch.damping).toBe(28);
      expect(SPRING.fluidDragStretch.mass).toBeCloseTo(0.9, 2);
      expect(SPRING.fluidDragStretch.restDelta).toBeCloseTo(0.001, 3);
    });
  });

  describe("computeBoundarySquish", () => {
    it("returns identity (scale 1.0) and unshifted center when rawCenterX is strictly in-bounds", () => {
      // Exactly at first tab center
      const atFirst = computeBoundarySquish(55, BASE_PILL_WIDTH, mockTabs);
      expect(atFirst.centerX).toBe(55);
      expect(atFirst.squishScaleX).toBe(1);
      expect(atFirst.squishScaleY).toBe(1);

      // In the middle
      const middle = computeBoundarySquish(160, BASE_PILL_WIDTH, mockTabs);
      expect(middle.centerX).toBe(160);
      expect(middle.squishScaleX).toBe(1);
      expect(middle.squishScaleY).toBe(1);

      // Exactly at last tab center
      const atLast = computeBoundarySquish(260, BASE_PILL_WIDTH, mockTabs);
      expect(atLast.centerX).toBe(260);
      expect(atLast.squishScaleX).toBe(1);
      expect(atLast.squishScaleY).toBe(1);
    });

    it("pins the outer edge against the left wall and squishes only the trailing side (rawCenterX < first.centerX)", () => {
      const firstCenter = mockTabs[0].centerX; // 55
      const firstLeft = mockTabs[0].left; // 10
      const firstWidth = mockTabs[0].width; // 90
      const smallOverdrag = computeBoundarySquish(
        firstCenter - 20,
        BASE_PILL_WIDTH,
        mockTabs,
      );
      const largeOverdrag = computeBoundarySquish(
        firstCenter - 80,
        BASE_PILL_WIDTH,
        mockTabs,
      );
      const extremeOverdrag = computeBoundarySquish(
        firstCenter - 500,
        BASE_PILL_WIDTH,
        mockTabs,
      );

      // Center position adjusts so the left edge stays pinned against the wall
      expect(smallOverdrag.centerX).toBeLessThan(firstCenter);
      expect(largeOverdrag.centerX).toBeLessThan(smallOverdrag.centerX);

      // Verify the rendered left edge remains pinned at firstLeft (within <= 1.8px cushion)
      const leftEdgeSmall =
        smallOverdrag.centerX - (firstWidth * smallOverdrag.squishScaleX) / 2;
      const leftEdgeLarge =
        largeOverdrag.centerX - (firstWidth * largeOverdrag.squishScaleX) / 2;
      expect(leftEdgeSmall).toBeCloseTo(firstLeft, 0);
      expect(leftEdgeLarge).toBeCloseTo(firstLeft, 0);
      expect(leftEdgeLarge).toBeGreaterThanOrEqual(firstLeft - 1.8);

      // Horizontal squish: subtle and restrained (compressing down to ~88% max, NOT excessive)
      expect(smallOverdrag.squishScaleX).toBeLessThan(1.0);
      expect(largeOverdrag.squishScaleX).toBeLessThan(
        smallOverdrag.squishScaleX,
      );
      expect(extremeOverdrag.squishScaleX).toBeGreaterThanOrEqual(
        1 - MAX_BOUNDARY_SQUISH_SCALE_X,
      );
      expect(extremeOverdrag.squishScaleX).toBeCloseTo(0.88, 1);

      // Vertical scale stays flat without ballooning
      expect(smallOverdrag.squishScaleY).toBe(1);
      expect(extremeOverdrag.squishScaleY).toBe(1);
    });

    it("pins the outer edge against the right wall and squishes only the trailing side (rawCenterX > last.centerX)", () => {
      const lastTab = mockTabs[mockTabs.length - 1];
      const lastCenter = lastTab.centerX; // 260
      const lastRight = lastTab.left + lastTab.width; // 300
      const lastWidth = lastTab.width; // 80
      const smallOverdrag = computeBoundarySquish(
        lastCenter + 20,
        BASE_PILL_WIDTH,
        mockTabs,
      );
      const largeOverdrag = computeBoundarySquish(
        lastCenter + 80,
        BASE_PILL_WIDTH,
        mockTabs,
      );
      const extremeOverdrag = computeBoundarySquish(
        lastCenter + 500,
        BASE_PILL_WIDTH,
        mockTabs,
      );

      // Center position adjusts so the right edge stays pinned against the wall
      expect(smallOverdrag.centerX).toBeGreaterThan(lastCenter);
      expect(largeOverdrag.centerX).toBeGreaterThan(smallOverdrag.centerX);

      // Verify the rendered right edge remains pinned at lastRight (within <= 1.8px cushion)
      const rightEdgeSmall =
        smallOverdrag.centerX + (lastWidth * smallOverdrag.squishScaleX) / 2;
      const rightEdgeLarge =
        largeOverdrag.centerX + (lastWidth * largeOverdrag.squishScaleX) / 2;
      expect(rightEdgeSmall).toBeCloseTo(lastRight, 0);
      expect(rightEdgeLarge).toBeCloseTo(lastRight, 0);
      expect(rightEdgeLarge).toBeLessThanOrEqual(lastRight + 1.8);

      // Horizontal squish compresses subtly
      expect(smallOverdrag.squishScaleX).toBeLessThan(1.0);
      expect(largeOverdrag.squishScaleX).toBeLessThan(
        smallOverdrag.squishScaleX,
      );
      expect(extremeOverdrag.squishScaleX).toBeGreaterThanOrEqual(
        1 - MAX_BOUNDARY_SQUISH_SCALE_X,
      );
      expect(extremeOverdrag.squishScaleX).toBeCloseTo(0.88, 1);

      // Vertical scale stays flat
      expect(smallOverdrag.squishScaleY).toBe(1);
      expect(extremeOverdrag.squishScaleY).toBe(1);
    });

    it("gracefully handles empty tabs or non-finite inputs", () => {
      expect(computeBoundarySquish(100, BASE_PILL_WIDTH, [])).toEqual({
        centerX: 100,
        squishScaleX: 1,
        squishScaleY: 1,
      });

      expect(computeBoundarySquish(NaN, BASE_PILL_WIDTH, mockTabs)).toEqual({
        centerX: 0,
        squishScaleX: 1,
        squishScaleY: 1,
      });

      const fallbackResult = computeBoundarySquish(-50, 0, mockTabs);
      expect(fallbackResult.squishScaleX).toBeLessThan(1.0);
      expect(fallbackResult.squishScaleY).toBe(1.0);
    });
  });

  describe("resolveReleaseRecoilVelocity", () => {
    it("zeros outward release velocity so spring accelerates inward naturally", () => {
      // User was pulling outward into left wall (overdragPx < 0, releaseVelocity < 0)
      expect(resolveReleaseRecoilVelocity(-40, -250)).toBe(0);

      // User was pulling outward into right wall (overdragPx > 0, releaseVelocity > 0)
      expect(resolveReleaseRecoilVelocity(40, 250)).toBe(0);
    });

    it("preserves inward release velocity to assist spring return", () => {
      // User flicking inward back to track from left wall (overdragPx < 0, releaseVelocity > 0)
      expect(resolveReleaseRecoilVelocity(-40, 300)).toBe(300);

      // User flicking inward back to track from right wall (overdragPx > 0, releaseVelocity < 0)
      expect(resolveReleaseRecoilVelocity(40, -300)).toBe(-300);
    });

    it("returns unmodified release velocity when in-bounds (overdragPx === 0)", () => {
      expect(resolveReleaseRecoilVelocity(0, 350)).toBe(350);
      expect(resolveReleaseRecoilVelocity(0, -420)).toBe(-420);
      expect(resolveReleaseRecoilVelocity(0, 0)).toBe(0);
    });

    it("clamps recoil velocity within safety boundaries and handles invalid inputs", () => {
      expect(resolveReleaseRecoilVelocity(0, 10000)).toBe(4000);
      expect(resolveReleaseRecoilVelocity(0, -10000)).toBe(-4000);
      expect(resolveReleaseRecoilVelocity(NaN, 200)).toBe(200);
      expect(resolveReleaseRecoilVelocity(0, NaN)).toBe(0);
    });
  });
});
