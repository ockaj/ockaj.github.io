import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SPRING } from "../../../utils/springConfig";
import { springs } from "../config";
import { resolveContextHighlightClass } from "../liquidGlassUtils";
import {
  createTabsController,
  computeVelocityScales,
  REF_VELOCITY,
  SETTLE_SPRING,
  FLIGHT_SETTLE_MS,
  LANDING_PULSE_MS,
  TRAVEL_IMPULSE_MS,
} from "../liquidGlassStore";

describe("LiquidGlassTabs Physics Controller & Anisotropic Dynamics", () => {
  const dimensions = { width: 120, height: 36 };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("tunes SPRING.highlight to a valid spring preset", () => {
    expect(SPRING.highlight.type).toBe("spring");
    expect(SPRING.highlight.stiffness).toBeGreaterThan(0);
    expect(SPRING.highlight.damping).toBeGreaterThan(0);
    expect(SPRING.highlight.mass).toBeGreaterThan(0);
    expect(SPRING.highlight.restDelta).toBeGreaterThan(0);
  });

  describe("TabsPhysicsController flight, hover, press, and landing lifecycle", () => {
    it("initializes in idle phase with resting 1.0 scale on the active tab", () => {
      const controller = createTabsController({ initialValue: "home" });
      controller.registerTab("home");
      controller.registerTab("work");

      expect(controller.getActiveValue()).toBe("home");
      expect(controller.getActivePhase()).toBe("idle");
      expect(controller.getActiveDistance()).toBe(0);

      const homeSnap = controller.getTabSnapshot("home", dimensions);
      expect(homeSnap.isActive).toBe(true);
      expect(homeSnap.showHighlight).toBe(true);
      expect(homeSnap.targetScaleX).toBe(1);
      expect(homeSnap.targetScaleY).toBe(1);
      expect(homeSnap.scaleSpring).toBe(SETTLE_SPRING);

      const workSnap = controller.getTabSnapshot("work", dimensions);
      expect(workSnap.isActive).toBe(false);
      expect(workSnap.showHighlight).toBe(false);
      expect(controller.getTabStateMask("work")).toBe(0);
      expect(controller.getServerTabStateMask("home")).toBeGreaterThan(0);
      expect(controller.getServerTabStateMask("work")).toBe(0);

      controller.destroy();
    });

    it("transitions flight -> landing -> idle and scales stretch with tab hop distance", () => {
      const controller = createTabsController({ initialValue: "t1" });
      for (const id of ["t1", "t2", "t3", "t4", "t5"]) {
        controller.registerTab(id);
      }

      let notifications = 0;
      controller.subscribe(() => {
        notifications++;
      });

      // 1-tab hop (t1 -> t2)
      controller.setActiveValue("t2");
      expect(controller.getActivePhase()).toBe("flight");
      expect(controller.getActiveDistance()).toBe(1);
      expect(notifications).toBe(1);

      const hop1 = controller.getTabSnapshot("t2", dimensions);
      expect(hop1.isTransitioning).toBe(true);
      expect(hop1.targetScaleX).toBeGreaterThan(1);
      expect(hop1.targetScaleY).toBeGreaterThan(1);
      expect(hop1.scaleSpring).toBe(springs.scale);

      // 3-tab hop (t2 -> t5) stretches wider along X than 1-tab hop
      controller.setActiveValue("t5");
      expect(controller.getActiveDistance()).toBe(3);
      const hop3 = controller.getTabSnapshot("t5", dimensions);
      expect(hop3.targetScaleX).toBeGreaterThan(hop1.targetScaleX);

      // Flight timer transitions to landing bloom (hover geometry with SETTLE_SPRING)
      vi.advanceTimersByTime(FLIGHT_SETTLE_MS);
      expect(controller.getActivePhase()).toBe("landing");
      expect(controller.getActiveDistance()).toBe(0);

      const landingSnap = controller.getTabSnapshot("t5", dimensions);
      expect(landingSnap.isLanding).toBe(true);
      expect(landingSnap.targetScaleX).toBeCloseTo(1 + 5 / 120, 4);
      expect(landingSnap.targetScaleY).toBeCloseTo(1 + 5 / 36, 4);
      expect(landingSnap.scaleSpring).toBe(SETTLE_SPRING);

      // Landing dwell settles to resting 1.0 idle state
      vi.advanceTimersByTime(LANDING_PULSE_MS);
      expect(controller.getActivePhase()).toBe("idle");
      const settledSnap = controller.getTabSnapshot("t5", dimensions);
      expect(settledSnap.isLanding).toBe(false);
      expect(settledSnap.targetScaleX).toBe(1);
      expect(settledSnap.targetScaleY).toBe(1);
      expect(settledSnap.scaleSpring).toBe(SETTLE_SPRING);

      controller.destroy();
    });

    it("stretches vertical tabs along Y during flight and hover glide", () => {
      const controller = createTabsController({
        initialValue: "v1",
        orientation: "vertical",
      });
      for (const id of ["v1", "v2", "v3", "v4"]) {
        controller.registerTab(id);
      }

      controller.hoverTab("v1");
      const hoverIdle = controller.getTabSnapshot("v1", dimensions);

      controller.hoverTab("v3");
      const hoverGlide = controller.getTabSnapshot("v3", dimensions);
      expect(hoverGlide.targetScaleY).toBeGreaterThan(hoverIdle.targetScaleY);
      expect(hoverGlide.targetScaleX).toBeLessThan(hoverIdle.targetScaleX);

      controller.destroy();
    });

    it("dampens stretch for binary 2-tab toggles compared to multi-tab bars", () => {
      const binary = createTabsController({
        initialValue: "a",
        hoverSlide: false,
      });
      binary.registerTab("a");
      binary.registerTab("b");

      const multi = createTabsController({
        initialValue: "a",
        hoverSlide: false,
      });
      for (const id of ["a", "b", "c", "d"]) {
        multi.registerTab(id);
      }

      binary.setActiveValue("b");
      multi.setActiveValue("b");

      const binarySnap = binary.getTabSnapshot("b", dimensions);
      const multiSnap = multi.getTabSnapshot("b", dimensions);
      expect(binarySnap.targetScaleX).toBeLessThan(multiSnap.targetScaleX);

      binary.destroy();
      multi.destroy();
    });

    it("drives hover-glide stretch from pointer velocity and resets on leaveTabs", () => {
      const controller = createTabsController({ initialValue: "t1" });
      for (const id of ["t1", "t2", "t3", "t4"]) {
        controller.registerTab(id);
      }

      // Record fast horizontal pointer movement (90px over 50ms = 1800 px/s)
      controller.recordPointerMove(0, 10, 100);
      controller.recordPointerMove(90, 10, 150);
      expect(controller.getVelocity()).toBeGreaterThan(1000);

      controller.hoverTab("t2");
      const fastGlide = controller.getTabSnapshot("t2", dimensions);
      expect(fastGlide.showHighlight).toBe(true);
      expect(fastGlide.isHoverMoving).toBe(true);
      expect(fastGlide.targetScaleX).toBeGreaterThan(1 + 5 / 120);
      expect(fastGlide.targetScaleY).toBeLessThan(1 + 5 / 36);

      // After impulse window expires, settles to resting hover expansion
      vi.advanceTimersByTime(TRAVEL_IMPULSE_MS);
      const restingHover = controller.getTabSnapshot("t2", dimensions);
      expect(restingHover.isHoverMoving).toBe(false);
      expect(restingHover.targetScaleX).toBeCloseTo(1 + 5 / 120, 4);
      expect(restingHover.targetScaleY).toBeCloseTo(1 + 5 / 36, 4);

      // Leaving tabs container resets velocity and returns highlight to active tab t1
      controller.leaveTabs();
      expect(controller.getVelocity()).toBe(0);
      expect(controller.getHoveredValue()).toBeNull();
      expect(controller.getTabSnapshot("t1", dimensions).showHighlight).toBe(
        true,
      );
      expect(controller.getTabSnapshot("t2", dimensions).showHighlight).toBe(
        false,
      );

      controller.destroy();
    });

    it("applies even 4-sided press expansion without squish and handles touch release", () => {
      const desktop = createTabsController({ initialValue: "t1" });
      desktop.registerTab("t1");
      desktop.registerTab("t2");

      desktop.pressTab("t2", "mouse");
      const pressedDesktop = desktop.getTabSnapshot("t2", dimensions);
      expect(pressedDesktop.isPressed).toBe(true);
      expect(pressedDesktop.targetScaleX).toBeGreaterThan(1);
      expect(pressedDesktop.targetScaleY).toBeGreaterThan(1);
      expect(pressedDesktop.willChange).toBe(true);

      desktop.releaseTab("t2", "mouse");
      expect(desktop.getTabSnapshot("t2", dimensions).isPressed).toBe(false);

      // Mobile / touch press and release
      const mobile = createTabsController({
        initialValue: "t1",
        isMobileNav: true,
        isTouchDevice: true,
      });
      mobile.registerTab("t1");
      mobile.registerTab("t2");

      mobile.pressTab("t1", "touch");
      const pressedMobile = mobile.getTabSnapshot("t1", dimensions);
      expect(pressedMobile.targetScaleX).toBeGreaterThan(1);
      expect(pressedMobile.targetScaleY).toBeGreaterThan(1);
      expect(pressedMobile.targetScaleX).toBeLessThan(
        pressedDesktop.targetScaleX,
      );

      mobile.releaseTab("t1", "touch");
      expect(mobile.getHoveredValue()).toBeNull();
      expect(mobile.getTabSnapshot("t1", dimensions).isPressed).toBe(false);

      desktop.destroy();
      mobile.destroy();
    });

    it("supports early notifyLayoutComplete, completeFlight, cancelTabPress, and unregistering tabs", () => {
      const controller = createTabsController({ initialValue: "t1" });
      const unregisterT1 = controller.registerTab("t1");
      const unregisterT2 = controller.registerTab("t2");
      expect(controller.getTabCount()).toBe(2);

      controller.setActiveValue("t2");
      expect(controller.getActivePhase()).toBe("flight");

      // Layout completes early at 60ms
      vi.advanceTimersByTime(60);
      controller.notifyLayoutComplete();
      expect(controller.getActivePhase()).toBe("landing");

      // Force immediate flight completion
      controller.completeFlight();
      expect(controller.getActivePhase()).toBe("idle");

      // Setting same active value with explicit 0 distance resets flight
      controller.setActiveValue("t1");
      expect(controller.getActivePhase()).toBe("flight");
      controller.setActiveValue("t1", 0);
      expect(controller.getActivePhase()).toBe("idle");

      // Cancel press clears both press and hover
      controller.pressTab("t2", "mouse");
      controller.cancelTabPress();
      expect(controller.getHoveredValue()).toBeNull();
      expect(controller.getTabSnapshot("t2", dimensions).isPressed).toBe(false);

      unregisterT1();
      unregisterT2();
      expect(controller.getTabCount()).toBe(0);
      controller.destroy();
    });

    it("suppresses all scale expansion when prefersReducedMotion is enabled", () => {
      const controller = createTabsController({
        initialValue: "t1",
        prefersReducedMotion: true,
      });
      controller.registerTab("t1");
      controller.registerTab("t2");

      controller.setActiveValue("t2");
      const snap = controller.getTabSnapshot("t2", dimensions);
      expect(snap.targetScaleX).toBe(1);
      expect(snap.targetScaleY).toBe(1);

      controller.pressTab("t2", "mouse");
      const pressedSnap = controller.getTabSnapshot("t2", dimensions);
      expect(pressedSnap.targetScaleX).toBe(1);
      expect(pressedSnap.targetScaleY).toBe(1);

      controller.destroy();
    });

    it("exposes a Zustand store with consistent state selectors and skips no-op notifications", () => {
      const controller = createTabsController({ initialValue: "t1" });
      controller.registerTab("t1");
      controller.registerTab("t2");

      let notifications = 0;
      const unsubscribe = controller.store.subscribe(() => {
        notifications++;
      });

      expect(
        controller.getTabStateMaskFromState(
          controller.store.getInitialState(),
          "t1",
        ),
      ).toBe(controller.getServerTabStateMask("t1"));
      expect(
        controller.getTabStateMaskFromState(
          controller.store.getInitialState(),
          "t2",
        ),
      ).toBe(0);

      // No-op operations must not notify subscribers
      controller.setActiveValue("t1");
      controller.leaveTabs();
      controller.completeFlight();
      controller.hoverTab(null);
      expect(notifications).toBe(0);

      // Hovering t2 starts impulse; passing non-zero distance or re-hovering after settle is a no-op
      controller.hoverTab("t2");
      expect(notifications).toBe(1);
      controller.hoverTab("t2", 1);
      expect(notifications).toBe(1);
      vi.advanceTimersByTime(TRAVEL_IMPULSE_MS);
      expect(notifications).toBe(2);
      controller.hoverTab("t2");
      expect(notifications).toBe(2);
      expect(controller.store.getState().hoveredValue).toBe("t2");

      unsubscribe();
      controller.destroy();
    });

    it("prevents pending timers and late mutations after destroy()", () => {
      const controller = createTabsController({ initialValue: "t1" });
      controller.registerTab("t1");
      controller.registerTab("t2");

      let notifications = 0;
      controller.store.subscribe(() => {
        notifications++;
      });

      controller.setActiveValue("t2");
      expect(notifications).toBe(1);
      expect(controller.getActivePhase()).toBe("flight");

      controller.destroy();
      vi.advanceTimersByTime(FLIGHT_SETTLE_MS + LANDING_PULSE_MS);

      controller.hoverTab("t1");
      controller.pressTab("t1", "mouse");
      expect(notifications).toBe(1);
      expect(controller.getActivePhase()).toBe("flight");
      expect(controller.getHoveredValue()).toBeNull();
    });

    it("reactivates cleanly after idle destroy() with zero notifications and restores mutations", () => {
      const controller = createTabsController({ initialValue: "t1" });
      controller.registerTab("t1");
      controller.registerTab("t2");

      let notifications = 0;
      controller.store.subscribe(() => {
        notifications++;
      });

      controller.destroy();

      // Pointer moves while destroyed are ignored
      controller.recordPointerMove(0, 10, 100);
      controller.recordPointerMove(90, 10, 150);
      expect(controller.getVelocity()).toBe(0);

      // Re-activating from idle emits 0 notifications
      controller.activate();
      expect(notifications).toBe(0);
      expect(controller.getActiveValue()).toBe("t1");
      expect(controller.getActivePhase()).toBe("idle");

      // Subsequent mutations work normally
      controller.hoverTab("t2");
      expect(notifications).toBe(1);
      expect(controller.getHoveredValue()).toBe("t2");

      controller.setActiveValue("t2");
      expect(notifications).toBe(2);
      expect(controller.getActiveValue()).toBe("t2");
      expect(controller.getActivePhase()).toBe("flight");

      vi.advanceTimersByTime(FLIGHT_SETTLE_MS + LANDING_PULSE_MS);
      expect(controller.getActivePhase()).toBe("idle");

      controller.destroy();
    });

    it("resets transient fields while preserving activeValue on mid-interaction destroy() -> activate()", () => {
      const controller = createTabsController({ initialValue: "t1" });
      for (const id of ["t1", "t2", "t3"]) {
        controller.registerTab(id);
      }

      controller.recordPointerMove(0, 10, 100);
      controller.recordPointerMove(90, 10, 150);
      expect(controller.getVelocity()).toBeGreaterThan(0);

      controller.setActiveValue("t2");
      controller.hoverTab("t3");
      controller.pressTab("t3", "mouse");

      expect(controller.getActiveValue()).toBe("t2");
      expect(controller.getActivePhase()).toBe("flight");
      expect(controller.getActiveDistance()).toBe(1);
      expect(controller.getHoveredValue()).toBe("t3");
      expect(controller.store.getState().pressedValue).toBe("t3");

      let notifications = 0;
      controller.store.subscribe(() => {
        notifications++;
      });

      controller.destroy();
      expect(controller.getVelocity()).toBe(0);

      controller.activate();
      expect(notifications).toBe(1);
      expect(controller.getActiveValue()).toBe("t2");
      expect(controller.getActivePhase()).toBe("idle");
      expect(controller.getActiveDistance()).toBe(0);
      expect(controller.getHoveredValue()).toBeNull();
      expect(controller.getHoverDistance()).toBe(0);
      expect(controller.isHoverMoving()).toBe(false);
      expect(controller.store.getState().pressedValue).toBeNull();
      expect(controller.getVelocity()).toBe(0);

      // Subsequent interactions work after mid-interaction reactivation
      controller.setActiveValue("t3");
      expect(controller.getActiveValue()).toBe("t3");
      expect(controller.getActivePhase()).toBe("flight");

      vi.advanceTimersByTime(FLIGHT_SETTLE_MS + LANDING_PULSE_MS);
      expect(controller.getActivePhase()).toBe("idle");

      controller.destroy();
    });

    it("treats activate() as an idempotent no-op when already active", () => {
      const controller = createTabsController({ initialValue: "t1" });
      controller.registerTab("t1");
      controller.registerTab("t2");

      let notifications = 0;
      controller.store.subscribe(() => {
        notifications++;
      });

      controller.activate();
      expect(notifications).toBe(0);

      controller.setActiveValue("t2");
      controller.hoverTab("t1");
      expect(notifications).toBe(2);

      // Must not clear in-flight/hover state or notify when already active
      controller.activate();
      expect(notifications).toBe(2);
      expect(controller.getActivePhase()).toBe("flight");
      expect(controller.getHoveredValue()).toBe("t1");

      vi.advanceTimersByTime(FLIGHT_SETTLE_MS);
      expect(controller.getActivePhase()).toBe("landing");

      controller.destroy();
    });

    it("preserves tab registration across StrictMode unregister -> re-register -> activate() order", () => {
      const controller = createTabsController({ initialValue: "t1" });
      const unreg1 = controller.registerTab("t1");
      const unreg2 = controller.registerTab("t2");
      const unreg3 = controller.registerTab("t3");

      // Simulate StrictMode unmount cleanup (children unregister, parent destroys)
      unreg1();
      unreg2();
      unreg3();
      controller.destroy();
      expect(controller.getTabCount()).toBe(0);

      // Simulate StrictMode remount: children register before parent activate() runs
      const remountUnreg1 = controller.registerTab("t1");
      const remountUnreg2 = controller.registerTab("t2");
      const remountUnreg3 = controller.registerTab("t3");
      expect(controller.getTabCount()).toBe(3);

      controller.activate();
      controller.setActiveValue("t3");
      expect(controller.getActivePhase()).toBe("flight");
      expect(controller.getActiveDistance()).toBe(2);

      remountUnreg1();
      remountUnreg2();
      remountUnreg3();
      controller.destroy();
    });
  });

  describe("resolveContextHighlightClass", () => {
    it("returns navbar-highlight-active when active (hovered or transitioning)", () => {
      expect(resolveContextHighlightClass("navbar-highlight-flat", true)).toBe(
        "navbar-highlight-active",
      );
    });

    it("returns navbar-highlight-flat when stationary and idle", () => {
      expect(resolveContextHighlightClass("navbar-highlight-flat", false)).toBe(
        "navbar-highlight-flat",
      );
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

    it("stretches horizontal and vertical tabs symmetrically for positive and negative velocity", () => {
      const peakH = computeVelocityScales(
        REF_VELOCITY,
        "horizontal",
        4,
        baseResting,
      );
      const negPeakH = computeVelocityScales(
        -REF_VELOCITY,
        "horizontal",
        4,
        baseResting,
      );
      expect(peakH.scaleX).toBeGreaterThan(1);
      expect(peakH.scaleY).toBeLessThan(1);
      expect(negPeakH.scaleX).toBeCloseTo(peakH.scaleX, 4);
      expect(negPeakH.scaleY).toBeCloseTo(peakH.scaleY, 4);

      const peakV = computeVelocityScales(
        REF_VELOCITY,
        "vertical",
        4,
        baseResting,
      );
      const negPeakV = computeVelocityScales(
        -REF_VELOCITY,
        "vertical",
        4,
        baseResting,
      );
      expect(peakV.scaleY).toBeGreaterThan(1);
      expect(peakV.scaleX).toBeLessThan(1);
      expect(negPeakV.scaleY).toBeCloseTo(peakV.scaleY, 4);
      expect(negPeakV.scaleX).toBeCloseTo(peakV.scaleX, 4);
    });

    it("eliminates transverse squish for binary toggles (tabCount <= 2) and clamps extreme speeds", () => {
      const binaryHoriz = computeVelocityScales(
        REF_VELOCITY,
        "horizontal",
        2,
        baseResting,
      );
      expect(binaryHoriz.scaleX).toBeGreaterThan(1);
      expect(binaryHoriz.scaleY).toBe(1.0);

      const binaryVert = computeVelocityScales(
        REF_VELOCITY,
        "vertical",
        2,
        baseResting,
      );
      expect(binaryVert.scaleY).toBeGreaterThan(1);
      expect(binaryVert.scaleX).toBe(1.0);

      const normalPeak = computeVelocityScales(
        REF_VELOCITY,
        "horizontal",
        4,
        baseResting,
      );
      const extremePeak = computeVelocityScales(
        9000,
        "horizontal",
        4,
        baseResting,
      );
      expect(extremePeak.scaleX).toBeCloseTo(normalPeak.scaleX, 4);
      expect(extremePeak.scaleY).toBeCloseTo(normalPeak.scaleY, 4);
    });

    it("streamlines transverse expansion during hovered flight and respects reduced motion", () => {
      const horizFlight = computeVelocityScales(
        REF_VELOCITY,
        "horizontal",
        4,
        baseHovered,
      );
      expect(horizFlight.scaleX).toBeGreaterThan(baseHovered.scaleX);
      expect(horizFlight.scaleY).toBeLessThan(baseHovered.scaleY);

      const vertFlight = computeVelocityScales(
        REF_VELOCITY,
        "vertical",
        4,
        baseHovered,
      );
      expect(vertFlight.scaleY).toBeGreaterThan(baseHovered.scaleY);
      expect(vertFlight.scaleX).toBeLessThan(baseHovered.scaleX);

      expect(
        computeVelocityScales(
          REF_VELOCITY,
          "horizontal",
          4,
          baseHovered,
          REF_VELOCITY,
          true,
        ),
      ).toEqual(baseHovered);
    });
  });
});
