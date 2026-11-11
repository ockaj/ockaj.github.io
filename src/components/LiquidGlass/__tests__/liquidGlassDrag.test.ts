import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { LiquidGlassDomProps } from "../internal/types";
import {
  resolveGlassSurfaceProps,
  TAP_PRESS_TRANSITION,
  TAP_RELEASE_TRANSITION,
  computeGlisseBaseScale,
  computeReactiveSheenBoxShadow,
} from "../internal/liquidGlassUtils";
import {
  computeAnisotropicStretch,
  createGlassGestureEngine,
} from "../internal/useLiquidGlassPhysics";
import { glassFeel, INNER_GLASS_STYLE } from "../internal/config";
import { SPRING } from "../../../utils/springConfig";

describe("LiquidGlass gesture physics engine, surface resolution, and stretch math", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("defines dual-stage mouse and touch spring profiles matching physical specifications", () => {
    for (const spring of [
      SPRING.glassPress,
      SPRING.glassRelease,
      SPRING.glassTouchPress,
      SPRING.glassTouchRelease,
    ]) {
      expect(spring.stiffness).toBeGreaterThan(0);
      expect(spring.damping).toBeGreaterThan(0);
      expect(spring.mass).toBeGreaterThan(0);
    }

    expect(TAP_PRESS_TRANSITION.scaleX).toBe(SPRING.glassTouchPress);
    expect(TAP_PRESS_TRANSITION.scaleY).toBe(SPRING.glassTouchPress);
    expect(TAP_RELEASE_TRANSITION.scaleX).toBe(SPRING.glassTouchRelease);
    expect(TAP_RELEASE_TRANSITION.scaleY).toBe(SPRING.glassTouchRelease);
  });

  it("configures glassFeel for mouse and touch interactions", () => {
    expect(glassFeel.pointer.grow).toBeGreaterThan(0);
    expect(glassFeel.touch.grow).toBeGreaterThanOrEqual(glassFeel.pointer.grow);

    expect(glassFeel.pointer.press).toBe(SPRING.glassPress);
    expect(glassFeel.pointer.release).toBe(SPRING.glassRelease);
    expect(glassFeel.touch.press).toBe(SPRING.glassTouchPress);
    expect(glassFeel.touch.release).toBe(SPRING.glassTouchRelease);
  });

  describe("createGlassGestureEngine hold, drag threshold, click suppression, and hover-on-release", () => {
    const rect = { left: 100, top: 50, width: 140, height: 44 };

    it("expands on pointerDown and does NOT suppress click when movement stays <= 5px", () => {
      const engine = createGlassGestureEngine({
        effectiveMagnetic: true,
        effectiveTilt: true,
        effectiveSpringScale: true,
        magneticStrength: 0.02,
      });

      const downState = engine.pointerDown({
        pointerId: 1,
        pointerType: "mouse",
        button: 0,
        isPrimary: true,
        clientX: 170,
        clientY: 72,
        rect,
      });

      expect(downState).not.toBeNull();
      expect(downState?.isHolding).toBe(true);
      expect(downState?.holding).toBe(1);
      expect(downState?.scaleX).toBeCloseTo(
        1 + glassFeel.pointer.grow / 140,
        5,
      );
      expect(downState?.scaleY).toBeCloseTo(
        1 + glassFeel.pointer.grow / 140,
        5,
      );
      expect(downState?.sheenOpacity).toBe(1);

      // Small jitter <= 5px (dx = 3, dy = 4 -> length = 5)
      engine.pointerMove({
        pointerId: 1,
        clientX: 173,
        clientY: 76,
      });

      const releaseState = engine.pointerUpOrCancel({
        pointerId: 1,
        clientX: 173,
        clientY: 76,
        liveRect: rect,
      });

      expect(releaseState?.isHolding).toBe(false);
      expect(releaseState?.holding).toBe(0);
      expect(releaseState?.scaleX).toBe(1);
      expect(releaseState?.scaleY).toBe(1);
      expect(releaseState?.isHovered).toBe(true);
      expect(releaseState?.sheenOpacity).toBe(1);
      expect(engine.consumeClickSuppression()).toBe(false);

      engine.destroy();
    });

    it("suppresses synthetic click after dragging > 5px and expires suppression after 100ms", () => {
      const engine = createGlassGestureEngine({
        effectiveMagnetic: true,
        effectiveTilt: true,
        effectiveSpringScale: true,
        magneticStrength: 0.02,
      });

      engine.pointerDown({
        pointerId: 1,
        pointerType: "mouse",
        button: 0,
        clientX: 170,
        clientY: 72,
        rect,
      });

      // Drag 30px horizontally (> 5px threshold)
      const moveState = engine.pointerMove({
        pointerId: 1,
        clientX: 200,
        clientY: 72,
      });
      expect(moveState?.scaleX).toBeGreaterThan(moveState?.scaleY ?? 1);
      expect(moveState?.pullX).toBeGreaterThan(0);
      expect(moveState?.tiltY).toBeGreaterThan(0);

      // Release outside element bounds (clientX = 400)
      const releaseState = engine.pointerUpOrCancel({
        pointerId: 1,
        clientX: 400,
        clientY: 72,
        liveRect: rect,
      });
      expect(releaseState?.isHovered).toBe(false);
      expect(releaseState?.sheenOpacity).toBe(0);

      // First synthetic click is suppressed; second is not
      expect(engine.consumeClickSuppression()).toBe(true);
      expect(engine.consumeClickSuppression()).toBe(false);

      // Drag again and let 100ms timer expire without click firing
      engine.pointerDown({
        pointerId: 2,
        pointerType: "touch",
        button: 0,
        clientX: 170,
        clientY: 72,
        rect,
      });
      engine.pointerMove({
        pointerId: 2,
        clientX: 170,
        clientY: 95,
      });
      engine.pointerUpOrCancel({
        pointerId: 2,
        clientX: 170,
        clientY: 95,
        liveRect: rect,
      });

      vi.advanceTimersByTime(100);
      expect(engine.consumeClickSuppression()).toBe(false);

      engine.destroy();
    });

    it("keeps scale at 1 when effectiveSpringScale is false while preserving magnetic pull and tilt", () => {
      const engine = createGlassGestureEngine({
        effectiveMagnetic: true,
        effectiveTilt: true,
        effectiveSpringScale: false,
        magneticStrength: 0.02,
      });

      const downState = engine.pointerDown({
        pointerId: 1,
        pointerType: "mouse",
        button: 0,
        clientX: 170,
        clientY: 72,
        rect,
      });
      expect(downState?.scaleX).toBe(1);
      expect(downState?.scaleY).toBe(1);

      const moveState = engine.pointerMove({
        pointerId: 1,
        clientX: 210,
        clientY: 72,
      });
      expect(moveState?.scaleX).toBe(1);
      expect(moveState?.scaleY).toBe(1);
      expect(moveState?.pullX).toBeGreaterThan(0);
      expect(moveState?.tiltY).toBeGreaterThan(0);

      engine.destroy();
    });

    it("tracks hover mouseEnter/mouseMove/mouseLeave and debounces height-only resizes", () => {
      const engine = createGlassGestureEngine({
        effectiveMagnetic: false,
        effectiveTilt: false,
        effectiveSpringScale: true,
        magneticStrength: 0.02,
      });

      const enter = engine.mouseEnter({ clientX: 180, clientY: 72, rect });
      expect(enter?.isHovered).toBe(true);
      expect(enter?.mouseX).toBe(10);
      expect(enter?.mouseY).toBe(0);
      expect(enter?.sheenOpacity).toBe(1);

      const move = engine.mouseMove({ clientX: 195, clientY: 80, rect });
      expect(move?.mouseX).toBe(25);
      expect(move?.mouseY).toBe(8);

      // Width change commits immediately
      expect(engine.resize(200, 44)).toEqual({ width: 200, height: 44 });

      // Height-only change debounces for 100ms
      const onDebounced = vi.fn();
      expect(engine.resize(200, 80, onDebounced)).toBeNull();
      expect(onDebounced).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(onDebounced).toHaveBeenCalledWith({ width: 200, height: 80 });

      const leave = engine.mouseLeave();
      expect(leave?.isHovered).toBe(false);
      expect(leave?.sheenOpacity).toBe(0);

      // Non-primary or right-click pointerDown is ignored
      expect(
        engine.pointerDown({
          pointerId: 5,
          pointerType: "mouse",
          button: 2,
          clientX: 170,
          clientY: 72,
          rect,
        }),
      ).toBeNull();

      engine.destroy();
    });
  });

  describe("resolveGlassSurfaceProps unified surface seam", () => {
    it("marks tagProps as draggable=false and prevents default onDragStart to prevent native link drag", () => {
      const onKeyDown = vi.fn();
      const onClick = vi.fn();
      const domOnDragStart = vi.fn();

      const { tagProps } = resolveGlassSurfaceProps({
        href: "#work",
        as: "a",
        onClick,
        onKeyDown,
        className: "base-class",
        ariaLabel: "View Case Studies",
        domProps: { onDragStart: domOnDragStart },
      });

      expect(tagProps.draggable).toBe(false);
      expect(tagProps.href).toBe("#work");
      expect(tagProps.onClick).toBe(onClick);
      expect(typeof tagProps.onDragStart).toBe("function");

      const mockEvent = {
        preventDefault: vi.fn(),
      };

      tagProps.onDragStart?.(
        mockEvent as unknown as React.DragEvent<HTMLElement>,
      );
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(domOnDragStart).toHaveBeenCalledWith(mockEvent);
    });

    it("composes internal and external onPointerDown handlers and resolves inline vs block surface tags", () => {
      const internalOnPointerDown = vi.fn();
      const externalOnPointerDown = vi.fn();

      const { isInline, tagProps } = resolveGlassSurfaceProps({
        as: "button",
        onClick: vi.fn(),
        onKeyDown: vi.fn(),
        className: "btn",
        animationProps: { onPointerDown: internalOnPointerDown },
        domProps: {
          onPointerDown: externalOnPointerDown,
        } as unknown as LiquidGlassDomProps,
      });

      expect(isInline).toBe(true);
      expect(tagProps.type).toBe("button");

      const mockEvent = {
        pointerId: 1,
      } as unknown as React.PointerEvent<HTMLElement>;
      tagProps.onPointerDown?.(mockEvent);

      expect(internalOnPointerDown).toHaveBeenCalledWith(mockEvent);
      expect(externalOnPointerDown).toHaveBeenCalledWith(mockEvent);
    });

    it("assigns role=button and tabIndex=0 on clickable non-semantic divs while skipping semantic containers", () => {
      const onKeyDown = vi.fn();
      const divSurface = resolveGlassSurfaceProps({
        as: "div",
        onClick: vi.fn(),
        onKeyDown,
      });
      expect(divSurface.tagProps.role).toBe("button");
      expect(divSurface.tagProps.tabIndex).toBe(0);
      expect(divSurface.tagProps.onKeyDown).toBe(onKeyDown);

      const articleSurface = resolveGlassSurfaceProps({
        as: "article",
        onClick: vi.fn(),
        onKeyDown,
      });
      expect(articleSurface.tagProps.role).toBeUndefined();
      expect(articleSurface.tagProps.tabIndex).toBeUndefined();
    });
  });

  describe("computeAnisotropicStretch", () => {
    const buttonWidth = 140;
    const buttonHeight = 44;

    it("returns scale 1 when there is no movement and grow is 0", () => {
      const result = computeAnisotropicStretch(0, 0, buttonWidth, buttonHeight);
      expect(result.scaleX).toBe(1);
      expect(result.scaleY).toBe(1);
    });

    it("returns isotropic bloom base when there is no movement and grow > 0 (Glisse formula)", () => {
      const pointerGrow = glassFeel.pointer.grow;
      const pointerResult = computeAnisotropicStretch(
        0,
        0,
        buttonWidth,
        buttonHeight,
        pointerGrow,
      );
      const expectedPointerBase = 1 + pointerGrow / buttonWidth;
      expect(pointerResult.scaleX).toBeCloseTo(expectedPointerBase, 5);
      expect(pointerResult.scaleY).toBeCloseTo(expectedPointerBase, 5);

      const touchGrow = glassFeel.touch.grow;
      const touchResult = computeAnisotropicStretch(
        0,
        0,
        buttonWidth,
        buttonHeight,
        touchGrow,
      );
      const expectedTouchBase = 1 + touchGrow / buttonWidth;
      expect(touchResult.scaleX).toBeCloseTo(expectedTouchBase, 5);
      expect(touchResult.scaleY).toBeCloseTo(expectedTouchBase, 5);
    });

    it("compounds anisotropic stretch with base growth during drag while preserving volume ratio", () => {
      const grow = 6;
      const base = 1 + grow / buttonWidth;
      const result = computeAnisotropicStretch(
        40,
        0,
        buttonWidth,
        buttonHeight,
        grow,
      );

      expect(result.scaleX).toBeGreaterThan(base);
      expect(result.scaleY).toBeLessThan(base);
      expect((result.scaleX * result.scaleY) / (base * base)).toBeCloseTo(1, 5);
    });

    it("stretches scaleX on horizontal drag and scaleY on vertical drag", () => {
      const horiz = computeAnisotropicStretch(40, 0, buttonWidth, buttonHeight);
      expect(horiz.scaleX).toBeGreaterThan(1);
      expect(horiz.scaleY).toBeLessThan(1);
      expect(horiz.scaleX * horiz.scaleY).toBeCloseTo(1, 5);

      const vert = computeAnisotropicStretch(0, 40, buttonWidth, buttonHeight);
      expect(vert.scaleY).toBeGreaterThan(1);
      expect(vert.scaleX).toBeLessThan(1);
      expect(vert.scaleX * vert.scaleY).toBeCloseTo(1, 5);
    });

    it("handles zero, negative, or NaN dimensions gracefully without producing NaN", () => {
      const zeroResult = computeAnisotropicStretch(20, 20, 0, 0, 6);
      expect(Number.isFinite(zeroResult.scaleX)).toBe(true);
      expect(Number.isFinite(zeroResult.scaleY)).toBe(true);
      expect(Number.isFinite(zeroResult.rubber)).toBe(true);

      const nanResult = computeAnisotropicStretch(NaN, NaN, NaN, NaN, 6);
      expect(Number.isFinite(nanResult.scaleX)).toBe(true);
      expect(Number.isFinite(nanResult.scaleY)).toBe(true);
      expect(nanResult.scaleX).toBeCloseTo(1 + 6 / 20, 4);
    });

    it("supports mutable output buffer in both drag and stationary states", () => {
      const buffer = { scaleX: 0, scaleY: 0, rubber: 0, nx: 0, ny: 0 };
      const returned = computeAnisotropicStretch(
        40,
        0,
        buttonWidth,
        buttonHeight,
        6,
        buffer,
      );
      expect(returned).toBe(buffer);
      expect(buffer.scaleX).toBeGreaterThan(1);

      computeAnisotropicStretch(0, 0, buttonWidth, buttonHeight, 14, buffer);
      expect(buffer.rubber).toBe(0);
      expect(buffer.nx).toBe(0);
      expect(buffer.ny).toBe(0);
    });
  });

  describe("computeGlisseBaseScale, INNER_GLASS_STYLE, and computeReactiveSheenBoxShadow", () => {
    it("computes uniform scale and falls back safely for NaN/zero dimensions", () => {
      expect(computeGlisseBaseScale(140, 44, 6)).toBeCloseTo(1 + 6 / 140, 5);
      expect(computeGlisseBaseScale(0, 0, 6)).toBeCloseTo(1 + 6 / 20, 5);
      expect(computeGlisseBaseScale(NaN, NaN, 6)).toBeCloseTo(1 + 6 / 20, 5);
      expect(computeGlisseBaseScale(100, 40, NaN)).toBe(1);
    });

    it("provides a hoisted flat inner glass boxShadow with chromatic dispersion", () => {
      expect(INNER_GLASS_STYLE.boxShadow).toContain(
        "inset 0 1px 1px rgba(255, 255, 255, 0.18)",
      );
      expect(INNER_GLASS_STYLE.boxShadow).toContain("--color-dispersion-cyan");
    });

    it("clamps reactive sheen travel when holding = 1 vs stock hover holding = 0", () => {
      const hoverShadow = computeReactiveSheenBoxShadow(70, 0, 0, 140, 44);
      expect(hoverShadow).toContain("-1.20px 0.00px");

      const holdShadow = computeReactiveSheenBoxShadow(70, 0, 1, 140, 44);
      expect(holdShadow).toContain("-0.49px 0.00px");

      const outsideShadow = computeReactiveSheenBoxShadow(500, 500, 1, 140, 44);
      expect(outsideShadow).toContain("-0.49px -0.49px");
    });
  });
});
