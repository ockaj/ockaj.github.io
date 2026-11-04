import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SPRING } from "../../../utils/springConfig";
import {
  computeTargetScales,
  computeVelocityScales,
  REF_VELOCITY,
  resolveContextHighlightClass,
} from "../liquidGlassUtils";
import {
  createActiveTabStore,
  createHoverTabStore,
  FLIGHT_SETTLE_MS,
  LANDING_PULSE_MS,
  TRAVEL_IMPULSE_MS,
} from "../liquidGlassStore";

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

    it("stretches immediately beyond hover width and streamlines height during hover-glide", () => {
      const hoverScaleX = 1 + 5 / 120;
      const hoverScaleY = 1 + 5 / 36;
      const hoverGlide = computeTargetScales(
        false, // isPressed
        true, // isHoverActive
        true, // isTraveling
        "horizontal",
        false, // isMobileNav
        dimensions,
        1, // tabDistance = 1
        false,
      );
      expect(hoverGlide.targetScaleX).toBeCloseTo(hoverScaleX * 1.04, 4);
      expect(hoverGlide.targetScaleY).toBeCloseTo(
        1 + (hoverScaleY - 1) * 0.45 * 0.992,
        4,
      );
    });

    it("activates hover expansion baseline during scroll travel and blooms into hover scale upon arrival", () => {
      const expectedHoverX = 1 + 5 / 120;
      const expectedHoverY = 1 + 5 / 36;

      // 1. In-flight on scroll (traveling with isHoverActive = true via scroll hover)
      const inFlight = computeTargetScales(
        false,
        true, // isHoverActive (scroll hover activated)
        true, // isTraveling
        "horizontal",
        false,
        dimensions,
        2, // 2-section hop
        false,
      );
      // In-flight has hover scale composed with travel stretch
      expect(inFlight.targetScaleX).toBeGreaterThan(expectedHoverX);
      expect(inFlight.targetScaleY).toBeGreaterThan(1.0);

      // 2. Arrival docking / dwell on destination tab (isTraveling = false, isHoverActive = true)
      const arrivalBloom = computeTargetScales(
        false,
        true, // isHoverActive (dwell active)
        false, // arrived at destination
        "horizontal",
        false,
        dimensions,
        0,
        false,
      );
      // Destination tab holds the exact hover geometry
      expect(arrivalBloom.targetScaleX).toBeCloseTo(expectedHoverX, 4);
      expect(arrivalBloom.targetScaleY).toBeCloseTo(expectedHoverY, 4);

      // 3. Settled stationary idle (isHoverActive = false, isTraveling = false)
      const settled = computeTargetScales(
        false,
        false,
        false,
        "horizontal",
        false,
        dimensions,
        0,
        false,
      );
      expect(settled).toEqual({ targetScaleX: 1, targetScaleY: 1 });
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
      expect(resolveContextHighlightClass(undefined, true)).toBe("");
      expect(resolveContextHighlightClass(undefined, false)).toBe("");
      expect(resolveContextHighlightClass("custom-accent", true)).toBe(
        "custom-accent",
      );
    });
  });

  describe("computeVelocityScales continuous velocity chain", () => {
    const baseResting = { scaleX: 1, scaleY: 1 };
    const baseHovered = { scaleX: 1.04, scaleY: 1.14 };

    it("returns resting scale when stationary (|velocity| < 5)", () => {
      expect(computeVelocityScales(0, "horizontal", 4, baseResting)).toEqual(
        baseResting,
      );

      expect(computeVelocityScales(4.9, "horizontal", 4, baseResting)).toEqual(
        baseResting,
      );

      expect(computeVelocityScales(-3, "vertical", 4, baseHovered)).toEqual(
        baseHovered,
      );
    });

    it("stretches horizontal tabs along X (+8%) and compresses along Y (-1.5%) at peak velocity with volume preservation", () => {
      const peak = computeVelocityScales(
        REF_VELOCITY,
        "horizontal",
        4,
        baseResting,
      );
      expect(peak.scaleX).toBeCloseTo(1.08, 4);
      expect(peak.scaleY).toBeCloseTo(0.985, 4);

      // Symmetrical for negative velocity (traveling in opposite direction)
      const negPeak = computeVelocityScales(
        -REF_VELOCITY,
        "horizontal",
        4,
        baseResting,
      );
      expect(negPeak.scaleX).toBeCloseTo(1.08, 4);
      expect(negPeak.scaleY).toBeCloseTo(0.985, 4);

      // Fractional velocity scales proportionally
      const halfSpeed = computeVelocityScales(
        REF_VELOCITY / 2,
        "horizontal",
        4,
        baseResting,
      );
      expect(halfSpeed.scaleX).toBeCloseTo(1 + 0.08 * 0.5, 4);
      expect(halfSpeed.scaleY).toBeCloseTo(1 - 0.015 * 0.5, 4);
    });

    it("stretches vertical tabs along Y (+6.5%) and compresses along X (-1.5%) at peak velocity with volume preservation", () => {
      const peakVertical = computeVelocityScales(
        REF_VELOCITY,
        "vertical",
        4,
        baseResting,
      );
      expect(peakVertical.scaleY).toBeCloseTo(1.065, 4);
      expect(peakVertical.scaleX).toBeCloseTo(0.985, 4);

      const negVertical = computeVelocityScales(
        -REF_VELOCITY,
        "vertical",
        4,
        baseResting,
      );
      expect(negVertical.scaleY).toBeCloseTo(1.065, 4);
      expect(negVertical.scaleX).toBeCloseTo(0.985, 4);
    });

    it("dampens stretch and eliminates transverse squish for binary toggles (tabCount <= 2)", () => {
      // Horizontal binary toggle (tabCount = 2): maxX = 0.02, maxYCompress = 0, countMult = 0.4
      const binaryHoriz = computeVelocityScales(
        REF_VELOCITY,
        "horizontal",
        2,
        baseResting,
      );
      expect(binaryHoriz.scaleX).toBeCloseTo(1 + 0.02 * 0.4, 4); // 1.008
      expect(binaryHoriz.scaleY).toBe(1.0); // Zero vertical squish

      // Vertical binary toggle (tabCount = 2): maxY = 0.02, maxXCompress = 0, countMult = 0.4
      const binaryVert = computeVelocityScales(
        REF_VELOCITY,
        "vertical",
        2,
        baseResting,
      );
      expect(binaryVert.scaleY).toBeCloseTo(1 + 0.02 * 0.4, 4); // 1.008
      expect(binaryVert.scaleX).toBe(1.0); // Zero horizontal squish
    });

    it("streamlines transverse expansion during hovered flight", () => {
      // Horizontal hover flight
      const horizFlight = computeVelocityScales(
        REF_VELOCITY,
        "horizontal",
        4,
        baseHovered,
      );
      // Stretches along X beyond hover
      expect(horizFlight.scaleX).toBeCloseTo(1.04 * 1.08, 4);
      // Streamlines Y hover bloom
      expect(horizFlight.scaleY).toBeCloseTo(1 + (1.14 - 1) * 0.45 * 0.985, 4);

      // Vertical hover flight
      const vertFlight = computeVelocityScales(
        REF_VELOCITY,
        "vertical",
        4,
        baseHovered,
      );
      expect(vertFlight.scaleY).toBeCloseTo(1.14 * 1.065, 4);
      expect(vertFlight.scaleX).toBeCloseTo(1 + (1.04 - 1) * 0.45 * 0.985, 4);
    });

    it("suppresses velocity stretch entirely under reduced motion", () => {
      const reducedHoriz = computeVelocityScales(
        REF_VELOCITY,
        "horizontal",
        4,
        baseHovered,
        REF_VELOCITY,
        true, // prefersReducedMotion
      );
      expect(reducedHoriz).toEqual(baseHovered);

      const reducedVert = computeVelocityScales(
        REF_VELOCITY,
        "vertical",
        4,
        baseResting,
        REF_VELOCITY,
        true,
      );
      expect(reducedVert).toEqual(baseResting);
    });

    it("clamps ratio to 1.0 when velocity exceeds REF_VELOCITY (extreme trackpad/flick speeds)", () => {
      const normalPeak = computeVelocityScales(
        REF_VELOCITY,
        "horizontal",
        4,
        baseResting,
      );
      const extremeVelocity = computeVelocityScales(
        8000,
        "horizontal",
        4,
        baseResting,
      );
      expect(extremeVelocity.scaleX).toBeCloseTo(normalPeak.scaleX, 4);
      expect(extremeVelocity.scaleY).toBeCloseTo(normalPeak.scaleY, 4);
    });

    it("uses default resting baseScales if baseScales argument is omitted", () => {
      const defaultScales = computeVelocityScales(0, "horizontal", 4);
      expect(defaultScales).toEqual({ scaleX: 1, scaleY: 1 });

      const movingDefault = computeVelocityScales(
        REF_VELOCITY,
        "horizontal",
        4,
      );
      expect(movingDefault.scaleX).toBeCloseTo(1.08, 4);
      expect(movingDefault.scaleY).toBeCloseTo(0.985, 4);
    });

    it("handles boundary tab count values (tabCount = 0 and tabCount = 1)", () => {
      const singleTab = computeVelocityScales(
        REF_VELOCITY,
        "horizontal",
        1,
        baseResting,
      );
      // tabCount = 1 is binary (isBinary: true, countMult: 0.4)
      expect(singleTab.scaleX).toBeCloseTo(1 + 0.02 * 0.4, 4);
      expect(singleTab.scaleY).toBe(1.0);

      const zeroTab = computeVelocityScales(
        REF_VELOCITY,
        "horizontal",
        0,
        baseResting,
      );
      // tabCount = 0 defaults countMult = 1.0, isBinary = false
      expect(zeroTab.scaleX).toBeCloseTo(1.08, 4);
    });
  });

  describe("ActiveTabStore & HoverTabStore lifecycle state machine", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("initializes in idle phase with zero distance", () => {
      const store = createActiveTabStore("tab1");
      expect(store.get()).toBe("tab1");
      expect(store.getPhase()).toBe("idle");
      expect(store.getDistance()).toBe(0);
      expect(store.isMoving()).toBe(false);
      store.destroy();
    });

    it("transitions flight -> landing -> idle upon distance navigation", () => {
      const store = createActiveTabStore("tab1");
      let notifications = 0;
      store.subscribe(() => {
        notifications++;
      });

      // 1. Flight start
      store.set("tab3", 2);
      expect(store.get()).toBe("tab3");
      expect(store.getPhase()).toBe("flight");
      expect(store.getDistance()).toBe(2);
      expect(store.isMoving()).toBe(true);
      expect(notifications).toBe(1);

      // 2. Flight fallback timer transitions to landing
      vi.advanceTimersByTime(FLIGHT_SETTLE_MS);
      expect(store.getPhase()).toBe("landing");
      expect(store.getDistance()).toBe(0);
      expect(store.isMoving()).toBe(true);
      expect(notifications).toBe(2);

      // 3. Landing pulse (dwell) transitions to idle
      vi.advanceTimersByTime(LANDING_PULSE_MS);
      expect(store.getPhase()).toBe("idle");
      expect(store.getDistance()).toBe(0);
      expect(store.isMoving()).toBe(false);
      expect(notifications).toBe(3);

      store.destroy();
    });

    it("supports beginLanding when layout animation completes early", () => {
      const store = createActiveTabStore("tab1");
      store.set("tab2", 1);
      expect(store.getPhase()).toBe("flight");

      // Layout animation completes at 80ms (before FLIGHT_SETTLE_MS = 150ms)
      vi.advanceTimersByTime(80);
      store.beginLanding();
      expect(store.getPhase()).toBe("landing");
      expect(store.getDistance()).toBe(0);

      // Complete dwell
      vi.advanceTimersByTime(LANDING_PULSE_MS);
      expect(store.getPhase()).toBe("idle");
      store.destroy();
    });

    it("completeFlight immediately forces idle transition and resets distance", () => {
      const store = createActiveTabStore("tab1");
      store.set("tab4", 3);
      expect(store.getPhase()).toBe("flight");

      store.completeFlight();
      expect(store.getPhase()).toBe("idle");
      expect(store.getDistance()).toBe(0);
      expect(store.isMoving()).toBe(false);
      store.destroy();
    });

    it("resets to idle when set to the same value with 0 distance", () => {
      const store = createActiveTabStore("tab1");
      store.set("tab2", 1);
      expect(store.getPhase()).toBe("flight");

      store.set("tab2", 0);
      expect(store.getPhase()).toBe("idle");
      expect(store.getDistance()).toBe(0);
      store.destroy();
    });

    it("HoverTabStore tracks moving state during impulse window and settles", () => {
      const hover = createHoverTabStore();
      expect(hover.get()).toBeNull();
      expect(hover.isMoving()).toBe(false);
      expect(hover.getDistance()).toBe(0);

      hover.set("tab2", 2);
      expect(hover.get()).toBe("tab2");
      expect(hover.isMoving()).toBe(true);
      expect(hover.getDistance()).toBe(2);

      vi.advanceTimersByTime(TRAVEL_IMPULSE_MS);
      expect(hover.isMoving()).toBe(false);
      // Value remains hovered
      expect(hover.get()).toBe("tab2");

      hover.set(null);
      expect(hover.get()).toBeNull();
      expect(hover.isMoving()).toBe(false);
      expect(hover.getDistance()).toBe(0);
      hover.destroy();
    });
  });
});
