import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SPRING } from "../../../utils/springConfig";
import { resolveContextHighlightClass } from "../liquidGlassUtils";
import {
  createTabsController,
  computeVelocityScales,
  computeDragVelocityScaleX,
  computeDragVelocityScaleY,
  projectMomentum,
  clampCenterWithRubberBand,
  interpolateTabField,
  resolveNearestTab,
  createVelocitySampler,
  APPLE_DECELERATION_RATE,
  DRAG_THRESHOLD_PX,
  REF_VELOCITY,
  SETTLE_SPRING,
  FLIGHT_SETTLE_MS,
  LANDING_PULSE_MS,
  TRAVEL_IMPULSE_MS,
  type TabGeometry,
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

      const initial = controller.store.getState();
      expect(initial.activeValue).toBe("home");
      expect(initial.activePhase).toBe("idle");
      expect(initial.activeDistance).toBe(0);

      const homeSnap = controller.getTabSnapshot("home", dimensions);
      expect(homeSnap.isActive).toBe(true);
      expect(homeSnap.showHighlight).toBe(true);
      expect(homeSnap.targetScaleX).toBe(1);
      expect(homeSnap.targetScaleY).toBe(1);
      expect(homeSnap.scaleSpring).toBe(SETTLE_SPRING);

      const workSnap = controller.getTabSnapshot("work", dimensions);
      expect(workSnap.isActive).toBe(false);
      expect(workSnap.showHighlight).toBe(false);
      expect(
        controller.getTabStateMaskFromState(initial, "work"),
      ).toBe(0);
      expect(
        controller.getTabStateMaskFromState(
          controller.store.getInitialState(),
          "home",
        ),
      ).toBeGreaterThan(0);
      expect(
        controller.getTabStateMaskFromState(
          controller.store.getInitialState(),
          "work",
        ),
      ).toBe(0);

      controller.destroy();
    });

    it("transitions flight -> landing -> idle and scales stretch with tab hop distance", () => {
      const controller = createTabsController({ initialValue: "t1" });
      for (const id of ["t1", "t2", "t3", "t4", "t5"]) {
        controller.registerTab(id);
      }

      let notifications = 0;
      controller.store.subscribe(() => {
        notifications++;
      });

      // 1-tab hop (t1 -> t2)
      controller.setActiveValue("t2");
      expect(controller.store.getState().activePhase).toBe("flight");
      expect(controller.store.getState().activeDistance).toBe(1);
      expect(notifications).toBe(1);

      const hop1 = controller.getTabSnapshot("t2", dimensions);
      expect(hop1.isNavbarActive).toBe(true);
      expect(hop1.targetScaleX).toBeGreaterThan(1);
      expect(hop1.targetScaleY).toBeGreaterThan(1);
      expect(hop1.scaleSpring).toBe(SPRING.glassScale);

      // 3-tab hop (t2 -> t5) stretches wider along X than 1-tab hop
      controller.setActiveValue("t5");
      expect(controller.store.getState().activeDistance).toBe(3);
      const hop3 = controller.getTabSnapshot("t5", dimensions);
      expect(hop3.targetScaleX).toBeGreaterThan(hop1.targetScaleX);

      // Flight timer transitions to landing bloom (hover geometry with SETTLE_SPRING)
      vi.advanceTimersByTime(FLIGHT_SETTLE_MS);
      expect(controller.store.getState().activePhase).toBe("landing");
      expect(controller.store.getState().activeDistance).toBe(0);

      const landingSnap = controller.getTabSnapshot("t5", dimensions);
      expect(landingSnap.isNavbarActive).toBe(true);
      expect(landingSnap.targetScaleX).toBeCloseTo(1 + 5 / 120, 4);
      expect(landingSnap.targetScaleY).toBeCloseTo(1 + 5 / 36, 4);
      expect(landingSnap.scaleSpring).toBe(SETTLE_SPRING);

      // Landing dwell settles to resting 1.0 idle state
      vi.advanceTimersByTime(LANDING_PULSE_MS);
      expect(controller.store.getState().activePhase).toBe("idle");
      const settledSnap = controller.getTabSnapshot("t5", dimensions);
      expect(settledSnap.isNavbarActive).toBe(false);
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
      });
      binary.registerTab("a");
      binary.registerTab("b");

      const multi = createTabsController({
        initialValue: "a",
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

      controller.hoverTab("t2");
      expect(controller.store.getState().hoverMoving).toBe(true);
      const fastGlide = controller.getTabSnapshot("t2", dimensions);
      expect(fastGlide.showHighlight).toBe(true);
      expect(fastGlide.targetScaleX).toBeGreaterThan(1 + 5 / 120);
      expect(fastGlide.targetScaleY).toBeLessThan(1 + 5 / 36);

      // After impulse window expires, settles to resting hover expansion
      vi.advanceTimersByTime(TRAVEL_IMPULSE_MS);
      expect(controller.store.getState().hoverMoving).toBe(false);
      const restingHover = controller.getTabSnapshot("t2", dimensions);
      expect(restingHover.targetScaleX).toBeCloseTo(1 + 5 / 120, 4);
      expect(restingHover.targetScaleY).toBeCloseTo(1 + 5 / 36, 4);

      // Leaving tabs container resets velocity and returns highlight to active tab t1
      controller.leaveTabs();
      expect(controller.store.getState().hoveredValue).toBeNull();
      expect(controller.getTabSnapshot("t1", dimensions).showHighlight).toBe(
        true,
      );
      expect(controller.getTabSnapshot("t2", dimensions).showHighlight).toBe(
        false,
      );

      // Re-hovering t2 without new pointer movement uses reset 0 velocity (distance stretch, not 1800px/s)
      controller.hoverTab("t2");
      const zeroVelHover = controller.getTabSnapshot("t2", dimensions);
      expect(zeroVelHover.targetScaleX).toBeLessThan(fastGlide.targetScaleX);

      controller.destroy();
    });

    it("applies even 4-sided press expansion without squish and handles touch release", () => {
      const desktop = createTabsController({ initialValue: "t1" });
      desktop.registerTab("t1");
      desktop.registerTab("t2");

      desktop.pressTab("t2", "mouse");
      expect(desktop.store.getState().pressedValue).toBe("t2");
      const pressedDesktop = desktop.getTabSnapshot("t2", dimensions);
      expect(pressedDesktop.targetScaleX).toBeGreaterThan(1);
      expect(pressedDesktop.targetScaleY).toBeGreaterThan(1);
      expect(pressedDesktop.willChange).toBe(true);

      desktop.releaseTab("t2", "mouse");
      expect(desktop.store.getState().pressedValue).toBeNull();

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
      expect(mobile.store.getState().hoveredValue).toBeNull();
      expect(mobile.store.getState().pressedValue).toBeNull();

      desktop.destroy();
      mobile.destroy();
    });

    it("supports early notifyLayoutComplete, landing completion, cancelTabPress, and unregistering tabs", () => {
      const controller = createTabsController({ initialValue: "t1" });
      const unregisterT1 = controller.registerTab("t1");
      const unregisterT2 = controller.registerTab("t2");
      const unregisterT3 = controller.registerTab("t3");

      controller.setActiveValue("t3");
      expect(controller.store.getState().activePhase).toBe("flight");
      expect(controller.store.getState().activeDistance).toBe(2);

      // Layout completes early at 60ms -> transitions to landing
      vi.advanceTimersByTime(60);
      controller.notifyLayoutComplete();
      expect(controller.store.getState().activePhase).toBe("landing");

      // Landing pulse timer settles to idle
      vi.advanceTimersByTime(LANDING_PULSE_MS);
      expect(controller.store.getState().activePhase).toBe("idle");

      // Cancel press clears both press and hover
      controller.pressTab("t2", "mouse");
      controller.cancelTabPress();
      expect(controller.store.getState().hoveredValue).toBeNull();
      expect(controller.store.getState().pressedValue).toBeNull();

      // Unregistering middle tab t2 reduces hop distance between t3 and t1 from 2 to 1
      unregisterT2();
      controller.setActiveValue("t1");
      expect(controller.store.getState().activeDistance).toBe(1);

      unregisterT1();
      unregisterT3();
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
      ).toBe(
        controller.getTabStateMaskFromState(controller.store.getState(), "t1"),
      );
      expect(
        controller.getTabStateMaskFromState(
          controller.store.getInitialState(),
          "t2",
        ),
      ).toBe(0);

      // No-op operations must not notify subscribers
      controller.setActiveValue("t1");
      controller.leaveTabs();
      controller.hoverTab(null);
      expect(notifications).toBe(0);

      // Hovering t2 starts impulse; re-hovering same tab during or after impulse is a no-op
      controller.hoverTab("t2");
      expect(notifications).toBe(1);
      controller.hoverTab("t2");
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
      expect(controller.store.getState().activePhase).toBe("flight");

      controller.destroy();
      vi.advanceTimersByTime(FLIGHT_SETTLE_MS + LANDING_PULSE_MS);

      controller.hoverTab("t1");
      controller.pressTab("t1", "mouse");
      expect(notifications).toBe(1);
      expect(controller.store.getState().activePhase).toBe("flight");
      expect(controller.store.getState().hoveredValue).toBeNull();
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

      // Re-activating from idle emits 0 notifications
      controller.activate();
      expect(notifications).toBe(0);
      expect(controller.store.getState().activeValue).toBe("t1");
      expect(controller.store.getState().activePhase).toBe("idle");

      // Subsequent mutations work normally
      controller.hoverTab("t2");
      expect(notifications).toBe(1);
      expect(controller.store.getState().hoveredValue).toBe("t2");

      controller.setActiveValue("t2");
      expect(notifications).toBe(2);
      expect(controller.store.getState().activeValue).toBe("t2");
      expect(controller.store.getState().activePhase).toBe("flight");

      vi.advanceTimersByTime(FLIGHT_SETTLE_MS + LANDING_PULSE_MS);
      expect(controller.store.getState().activePhase).toBe("idle");

      controller.destroy();
    });

    it("resets transient fields while preserving activeValue on mid-interaction destroy() -> activate()", () => {
      const controller = createTabsController({ initialValue: "t1" });
      for (const id of ["t1", "t2", "t3"]) {
        controller.registerTab(id);
      }

      controller.recordPointerMove(0, 10, 100);
      controller.recordPointerMove(90, 10, 150);

      controller.setActiveValue("t2");
      controller.hoverTab("t3");
      controller.pressTab("t3", "mouse");

      expect(controller.store.getState().activeValue).toBe("t2");
      expect(controller.store.getState().activePhase).toBe("flight");
      expect(controller.store.getState().activeDistance).toBe(1);
      expect(controller.store.getState().hoveredValue).toBe("t3");
      expect(controller.store.getState().pressedValue).toBe("t3");

      let notifications = 0;
      controller.store.subscribe(() => {
        notifications++;
      });

      controller.destroy();

      controller.activate();
      expect(notifications).toBe(1);
      const resetState = controller.store.getState();
      expect(resetState.activeValue).toBe("t2");
      expect(resetState.activePhase).toBe("idle");
      expect(resetState.activeDistance).toBe(0);
      expect(resetState.hoveredValue).toBeNull();
      expect(resetState.hoverDistance).toBe(0);
      expect(resetState.hoverMoving).toBe(false);
      expect(resetState.pressedValue).toBeNull();

      // Subsequent interactions work after mid-interaction reactivation
      controller.setActiveValue("t3");
      expect(controller.store.getState().activeValue).toBe("t3");
      expect(controller.store.getState().activePhase).toBe("flight");

      vi.advanceTimersByTime(FLIGHT_SETTLE_MS + LANDING_PULSE_MS);
      expect(controller.store.getState().activePhase).toBe("idle");

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
      expect(controller.store.getState().activePhase).toBe("flight");
      expect(controller.store.getState().hoveredValue).toBe("t1");

      vi.advanceTimersByTime(FLIGHT_SETTLE_MS);
      expect(controller.store.getState().activePhase).toBe("landing");

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

      // Simulate StrictMode remount: children register before parent activate() runs
      const remountUnreg1 = controller.registerTab("t1");
      const remountUnreg2 = controller.registerTab("t2");
      const remountUnreg3 = controller.registerTab("t3");

      controller.activate();
      controller.setActiveValue("t3");
      expect(controller.store.getState().activePhase).toBe("flight");
      expect(controller.store.getState().activeDistance).toBe(2);

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

  describe("Draggable Navbar Pill Physics, Momentum Projection, Rubber-Banding, & Velocity Ring Buffer", () => {
    const mockTabs: TabGeometry[] = [
      {
        value: "home",
        left: 0,
        top: 0,
        width: 200,
        height: 42,
        centerX: 100,
      },
      {
        value: "work",
        left: 204,
        top: 0,
        width: 120,
        height: 42,
        centerX: 264,
      },
      {
        value: "faq",
        left: 328,
        top: 0,
        width: 68,
        height: 42,
        centerX: 362,
      },
      {
        value: "contact",
        left: 400,
        top: 0,
        width: 92,
        height: 42,
        centerX: 446,
      },
    ];

    it("projects Apple 0.998 exponential momentum and handles invalid inputs safely", () => {
      expect(DRAG_THRESHOLD_PX).toBe(10);
      expect(APPLE_DECELERATION_RATE).toBeCloseTo(0.998, 5);
      expect(projectMomentum(1000)).toBeCloseTo(499, 2);
      expect(projectMomentum(-1000)).toBeCloseTo(-499, 2);
      expect(projectMomentum(0)).toBe(0);
      expect(projectMomentum(NaN)).toBe(0);
      expect(projectMomentum(Infinity)).toBe(0);
      expect(projectMomentum(500, 1)).toBe(0);
      expect(projectMomentum(500, 0)).toBe(0);
    });

    it("clamps center with progressive rubber-band resistance at both bar edges", () => {
      expect(clampCenterWithRubberBand(264, mockTabs)).toBe(264);

      const leftPullSmall = clampCenterWithRubberBand(80, mockTabs);
      const leftPullLarge = clampCenterWithRubberBand(-100, mockTabs);
      expect(leftPullSmall).toBeLessThan(100);
      expect(leftPullSmall).toBeGreaterThan(80);
      expect(leftPullLarge).toBeLessThan(leftPullSmall);
      expect(leftPullLarge).toBeGreaterThan(60);

      const rightPullSmall = clampCenterWithRubberBand(466, mockTabs);
      const rightPullLarge = clampCenterWithRubberBand(700, mockTabs);
      expect(rightPullSmall).toBeGreaterThan(446);
      expect(rightPullSmall).toBeLessThan(466);
      expect(rightPullLarge).toBeGreaterThan(rightPullSmall);
      expect(rightPullLarge).toBeLessThan(486);

      expect(clampCenterWithRubberBand(100, [])).toBe(0);
      expect(clampCenterWithRubberBand(NaN, mockTabs)).toBe(0);
    });

    it("continuously interpolates width across unequal tabs and resolves nearest tab", () => {
      expect(interpolateTabField(100, mockTabs, "width", 120)).toBe(200);
      expect(interpolateTabField(182, mockTabs, "width", 120)).toBeCloseTo(
        160,
        4,
      );
      expect(interpolateTabField(264, mockTabs, "width", 120)).toBe(120);
      expect(interpolateTabField(362, mockTabs, "width", 120)).toBe(68);
      expect(interpolateTabField(0, mockTabs, "width", 120)).toBe(200);
      expect(interpolateTabField(999, mockTabs, "width", 120)).toBe(92);
      expect(interpolateTabField(100, [], "width", 120)).toBe(120);
      expect(interpolateTabField(NaN, mockTabs, "width", 120)).toBe(120);

      expect(resolveNearestTab(150, mockTabs)).toBe("home");
      expect(resolveNearestTab(240, mockTabs)).toBe("work");
      expect(resolveNearestTab(355, mockTabs)).toBe("faq");
      expect(resolveNearestTab(500, mockTabs)).toBe("contact");
      expect(resolveNearestTab(100, [])).toBeNull();
      expect(resolveNearestTab(NaN, mockTabs)).toBe("home");
    });

    it("samples recent pointer velocity in a zero-allocation ring buffer and zeros on pause", () => {
      const sampler = createVelocitySampler();
      sampler.reset(100, 1000);
      expect(sampler.sample(1010)).toBe(0);

      for (let i = 1; i <= 15; i++) {
        sampler.push(100 + i * 16, 1000 + i * 16);
      }
      expect(sampler.sample(1240)).toBeCloseTo(1000, 0);

      // Paused > 80ms before release drops release velocity to 0
      expect(sampler.sample(1350)).toBe(0);

      // Extreme spike caps at 4000 px/s
      sampler.reset(0, 2000);
      sampler.push(1000, 2010);
      expect(sampler.sample(2010)).toBe(4000);

      // Invalid/NaN inputs are safely ignored
      sampler.reset(NaN, 3000);
      sampler.push(NaN, 3010);
      expect(sampler.sample(3010)).toBe(0);
    });

    it("preserves expanded drag scaleY while stretching X and respects reduced motion", () => {
      const expandedY = 1.214;
      const sx = computeDragVelocityScaleX(REF_VELOCITY, 7, 1.05, false);
      const sy = computeDragVelocityScaleY(REF_VELOCITY, 7, expandedY, false);
      expect(sx).toBeGreaterThan(1.05);
      expect(sy).toBeGreaterThan(1.18);
      expect(sy).toBeLessThan(expandedY);

      expect(
        computeDragVelocityScaleX(REF_VELOCITY, 7, 1.05, true),
      ).toBeCloseTo(1.05, 5);
      expect(
        computeDragVelocityScaleY(REF_VELOCITY, 7, expandedY, true),
      ).toBeCloseTo(expandedY, 5);
    });

    it("enforces drag origin rules, maintains press expansion during drag, and settles cleanly to idle", () => {
      const controller = createTabsController({ initialValue: "home" });
      for (const tab of mockTabs) {
        controller.registerTab(tab.value);
      }

      // Mouse cannot grab unhovered inactive tab, but can grab active or hovered tab
      expect(controller.canGrabTab("faq", false, "mouse")).toBe(false);
      expect(controller.canGrabTab("home", false, "mouse")).toBe(true);

      controller.hoverTab("work");
      expect(controller.canGrabTab("work", false, "mouse")).toBe(true);

      // Touch (768px+ touchscreen) only allows grabbing active tab, unless live mid-flight hit
      expect(controller.canGrabTab("work", false, "touch")).toBe(false);
      expect(controller.canGrabTab("home", false, "touch")).toBe(true);
      expect(controller.canGrabTab("faq", true, "touch")).toBe(true);

      // Start press + drag from home -> work -> faq
      controller.pressTab("home", "mouse");
      controller.startDrag("home");

      let notifications = 0;
      const unsub = controller.store.subscribe(() => {
        notifications++;
      });

      // Deduplicates identical drag preview updates (no per-frame re-renders)
      controller.setDragPreview("home");
      expect(notifications).toBe(0);

      controller.setDragPreview("faq");
      expect(notifications).toBe(1);

      // Hover events during drag are ignored
      controller.hoverTab("work");
      expect(controller.store.getState().hoveredValue).toBeNull();

      // Expanded press state persists on dragPreviewValue ("faq")
      expect(
        controller.getTabStateMaskFromState(controller.store.getState(), "faq") &
          64,
      ).toBe(64);
      const faqDragSnap = controller.getTabSnapshot("faq", {
        width: 68,
        height: 42,
      });
      expect(faqDragSnap.isDragPreview).toBe(true);
      expect(faqDragSnap.targetScaleY).toBeGreaterThan(1.15);

      // Commit drag and verify setActiveValue("faq") from React sync does NOT kill flightTimer
      controller.commitDrag("faq");
      controller.setActiveValue("faq");
      expect(controller.store.getState().activeValue).toBe("faq");
      expect(controller.store.getState().activePhase).toBe("flight");

      // Post-release synthetic hoverTab is suppressed until real mouse movement
      controller.hoverTab("work");
      expect(controller.store.getState().hoveredValue).toBeNull();
      controller.recordPointerMove(250, 20, 100);
      controller.hoverTab("work");
      expect(controller.store.getState().hoveredValue).toBe("work");

      // Flight -> landing -> idle lifecycle completes cleanly
      vi.advanceTimersByTime(FLIGHT_SETTLE_MS);
      expect(controller.store.getState().activePhase).toBe("landing");
      vi.advanceTimersByTime(LANDING_PULSE_MS);
      expect(controller.store.getState().activePhase).toBe("idle");

      // Cancel drag resets drag/preview/press without changing activeValue
      controller.pressTab("work", "mouse");
      controller.startDrag("work");
      controller.cancelDrag();
      expect(controller.store.getState().activeValue).toBe("faq");
      expect(controller.store.getState().isDragging).toBe(false);
      expect(controller.store.getState().dragPreviewValue).toBeNull();
      expect(controller.store.getState().pressedValue).toBeNull();

      // Explicit 0-distance commit (slow/paused release at target) avoids fake flight stretch
      controller.pressTab("faq", "mouse");
      controller.startDrag("contact");
      controller.commitDrag("contact", 0);
      expect(controller.store.getState().activeValue).toBe("contact");
      expect(controller.store.getState().activePhase).toBe("idle");
      expect(controller.store.getState().activeDistance).toBe(0);

      unsub();
      controller.destroy();
    });
  });
});
