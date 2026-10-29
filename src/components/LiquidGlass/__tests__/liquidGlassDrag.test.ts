import { describe, it, expect, vi } from "vitest";
import {
  setupTagProps,
  TAP_PRESS_TRANSITION,
  TAP_RELEASE_TRANSITION,
  computeGlisseBaseScale,
  computeInnerGlassStyle,
  computeReactiveSheenBoxShadow,
} from "../liquidGlassUtils";
import { computeAnisotropicStretch } from "../useLiquidGlassPhysics";
import { glassFeel } from "../config";
import { SPRING } from "../../../utils/springConfig";

describe("LiquidGlass hold, drag, and click suppression", () => {
  it("defines dual-stage mouse and touch spring profiles matching Apple physical specifications", () => {
    expect(SPRING.glassPress.stiffness).toBeCloseTo(417.6, 1);
    expect(SPRING.glassPress.damping).toBeCloseTo(29.2, 1);
    expect(SPRING.glassPress.mass).toBeCloseTo(0.6, 2);

    expect(SPRING.glassRelease.stiffness).toBeCloseTo(230, 1);
    expect(SPRING.glassRelease.damping).toBeCloseTo(23.7, 1);
    expect(SPRING.glassRelease.mass).toBeCloseTo(0.6, 2);

    expect(SPRING.glassTouchPress.stiffness).toBeCloseTo(515, 1);
    expect(SPRING.glassTouchPress.damping).toBeCloseTo(27.3, 1);
    expect(SPRING.glassTouchPress.mass).toBeCloseTo(0.6, 2);

    expect(SPRING.glassTouchRelease.stiffness).toBeCloseTo(250, 1);
    expect(SPRING.glassTouchRelease.damping).toBeCloseTo(11.8, 1);
    expect(SPRING.glassTouchRelease.mass).toBeCloseTo(0.6, 2);

    expect(TAP_PRESS_TRANSITION.scaleX).toBe(SPRING.glassTouchPress);
    expect(TAP_PRESS_TRANSITION.scaleY).toBe(SPRING.glassTouchPress);
    expect(TAP_RELEASE_TRANSITION.scaleX).toBe(SPRING.glassTouchRelease);
    expect(TAP_RELEASE_TRANSITION.scaleY).toBe(SPRING.glassTouchRelease);
  });

  it("configures glassFeel for mouse and touch interactions", () => {
    expect(glassFeel.pointer.grow).toBe(6);
    expect(glassFeel.pointer.press).toBe(SPRING.glassPress);
    expect(glassFeel.pointer.release).toBe(SPRING.glassRelease);

    expect(glassFeel.touch.grow).toBe(14);
    expect(glassFeel.touch.press).toBe(SPRING.glassTouchPress);
    expect(glassFeel.touch.release).toBe(SPRING.glassTouchRelease);
  });
  it("marks tagProps as draggable=false and prevents default onDragStart to prevent native link drag", () => {
    const onKeyDown = vi.fn();
    const onClick = vi.fn();
    const domOnDragStart = vi.fn();

    const tagProps = setupTagProps(
      "#work",
      "a",
      undefined,
      undefined,
      undefined,
      onClick,
      onKeyDown,
      "base-class",
      {},
      "View Case Studies",
      undefined,
      { onDragStart: domOnDragStart },
    );

    expect(tagProps.draggable).toBe(false);
    expect(typeof tagProps.onDragStart).toBe("function");

    const mockEvent = {
      preventDefault: vi.fn(),
    };

    tagProps.onDragStart?.(mockEvent as unknown as React.DragEvent<HTMLElement>);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(domOnDragStart).toHaveBeenCalledWith(mockEvent);
  });

  it("attaches wrapped onClick handler to anchor elements with href", () => {
    const onKeyDown = vi.fn();
    const onClick = vi.fn();

    const tagProps = setupTagProps(
      "#work",
      "a",
      undefined,
      undefined,
      undefined,
      onClick,
      onKeyDown,
      "base-class",
      {},
      "View Case Studies",
    );

    expect(tagProps.onClick).toBe(onClick);
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
      // buttonWidth = 140, buttonHeight = 44, max(140, 44) = 140
      // pointer grow = 6: base = 1 + 6 / 140
      const pointerResult = computeAnisotropicStretch(
        0,
        0,
        buttonWidth,
        buttonHeight,
        6,
      );
      const expectedPointerBase = 1 + 6 / 140;
      expect(pointerResult.scaleX).toBeCloseTo(expectedPointerBase, 5);
      expect(pointerResult.scaleY).toBeCloseTo(expectedPointerBase, 5);

      // touch grow = 14: base = 1 + 14 / 140
      const touchResult = computeAnisotropicStretch(
        0,
        0,
        buttonWidth,
        buttonHeight,
        14,
      );
      const expectedTouchBase = 1 + 14 / 140;
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
      // Volume preservation invariant: (scaleX * scaleY) / (base * base) === 1
      expect((result.scaleX * result.scaleY) / (base * base)).toBeCloseTo(1, 5);
    });

    it("stretches scaleX and compresses scaleY on horizontal drag", () => {
      const result = computeAnisotropicStretch(40, 0, buttonWidth, buttonHeight);
      expect(result.scaleX).toBeGreaterThan(1);
      expect(result.scaleY).toBeLessThan(1);
      // Volume preservation invariant: scaleX * scaleY is approximately 1
      expect(result.scaleX * result.scaleY).toBeCloseTo(1, 5);
    });

    it("stretches scaleY and compresses scaleX on vertical drag", () => {
      const result = computeAnisotropicStretch(0, 40, buttonWidth, buttonHeight);
      expect(result.scaleY).toBeGreaterThan(1);
      expect(result.scaleX).toBeLessThan(1);
      // Volume preservation invariant: scaleX * scaleY is approximately 1
      expect(result.scaleX * result.scaleY).toBeCloseTo(1, 5);
    });

    it("handles zero, negative, or degenerate dimensions gracefully without producing NaN", () => {
      const zeroResult = computeAnisotropicStretch(20, 20, 0, 0, 6);
      expect(Number.isFinite(zeroResult.scaleX)).toBe(true);
      expect(Number.isFinite(zeroResult.scaleY)).toBe(true);
      expect(Number.isFinite(zeroResult.rubber)).toBe(true);
      const baseZero = 1 + 6 / 20; // safeHeight is 20
      expect((zeroResult.scaleX * zeroResult.scaleY) / (baseZero * baseZero)).toBeCloseTo(1, 4);

      const nanResult = computeAnisotropicStretch(NaN, NaN, NaN, NaN, 6);
      expect(Number.isFinite(nanResult.scaleX)).toBe(true);
      expect(Number.isFinite(nanResult.scaleY)).toBe(true);
      expect(Number.isFinite(nanResult.rubber)).toBe(true);
      expect(nanResult.scaleX).toBeCloseTo(1 + 6 / 20, 4);
      expect(nanResult.scaleY).toBeCloseTo(1 + 6 / 20, 4);
    });

    it("yields minimal anisotropic stretch on equal diagonal pull (aspect normalized)", () => {
      // With equal aspect 1 (width = height), 45-degree drag has nx == ny, so ||nx| - |ny|| == 0
      const grow = 6;
      const base = 1 + grow / 100;
      const result = computeAnisotropicStretch(30, 30, 100, 100, grow);
      expect(result.scaleX).toBeCloseTo(base, 2);
      expect(result.scaleY).toBeCloseTo(base, 2);
    });

    it("supports mutable output buffer to guarantee zero-allocation in hot path", () => {
      const buffer = { scaleX: 0, scaleY: 0, rubber: 0, nx: 0, ny: 0 };
      const returned = computeAnisotropicStretch(
        40,
        0,
        buttonWidth,
        buttonHeight,
        6,
        buffer,
      );

      const base = 1 + 6 / buttonWidth;
      expect(returned).toBe(buffer);
      expect(buffer.scaleX).toBeGreaterThan(base);
      expect(buffer.scaleY).toBeLessThan(base);
      expect((buffer.scaleX * buffer.scaleY) / (base * base)).toBeCloseTo(1, 5);
    });

    it("supports mutable output buffer in stationary hold bloom (zero length)", () => {
      const buffer = { scaleX: 0, scaleY: 0, rubber: 1, nx: 1, ny: 1 };
      const returned = computeAnisotropicStretch(
        0,
        0,
        buttonWidth,
        buttonHeight,
        14,
        buffer,
      );

      const base = 1 + 14 / buttonWidth;
      expect(returned).toBe(buffer);
      expect(buffer.scaleX).toBeCloseTo(base, 5);
      expect(buffer.scaleY).toBeCloseTo(base, 5);
      expect(buffer.rubber).toBe(0);
      expect(buffer.nx).toBe(0);
      expect(buffer.ny).toBe(0);
    });

    it("preserves volume and applies asymptotic rubberband resistance", () => {
      const smallDrag = computeAnisotropicStretch(20, 0, buttonWidth, buttonHeight);
      const largeDrag = computeAnisotropicStretch(200, 0, buttonWidth, buttonHeight);

      expect(largeDrag.rubber).toBeGreaterThan(smallDrag.rubber);
      expect(largeDrag.rubber).toBeLessThan(1);
      expect(largeDrag.scaleX).toBeGreaterThan(smallDrag.scaleX);
    });
  });

  describe("setupTagProps onDragStart fallback", () => {
    it("safely calls preventDefault when domProps does not supply onDragStart", () => {
      const tagProps = setupTagProps(
        undefined,
        "button",
        undefined,
        undefined,
        undefined,
        vi.fn(),
        vi.fn(),
        "btn",
        {},
      );

      const mockEvent = { preventDefault: vi.fn() };
      tagProps.onDragStart?.(mockEvent as unknown as React.DragEvent<HTMLElement>);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe("computeGlisseBaseScale", () => {
    it("computes uniform scale from dimension and grow count", () => {
      // 140 width, 44 height, grow 6 => max is 140 => 1 + 6/140
      expect(computeGlisseBaseScale(140, 44, 6)).toBeCloseTo(1 + 6 / 140, 5);
      // touch grow 14
      expect(computeGlisseBaseScale(140, 44, 14)).toBeCloseTo(1 + 14 / 140, 5);
    });

    it("falls back safely to 20 for non-finite or zero dimensions", () => {
      expect(computeGlisseBaseScale(0, 0, 6)).toBeCloseTo(1 + 6 / 20, 5);
      expect(computeGlisseBaseScale(NaN, NaN, 6)).toBeCloseTo(1 + 6 / 20, 5);
      expect(computeGlisseBaseScale(100, 40, NaN)).toBe(1);
    });
  });

  describe("computeInnerGlassStyle", () => {
    it("adds specular glow shadow when variant is flat, active is true, and specularGlow is true", () => {
      const style = computeInnerGlassStyle("flat", true, true);
      expect(style.boxShadow).toContain("inset 0 1px 2px rgba(255, 255, 255, 0.24)");
      expect(style.boxShadow).toContain("inset 0 8px 16px rgba(255, 255, 255, 0.06)");
    });

    it("returns base style without extra glow when specularGlow is false", () => {
      const style = computeInnerGlassStyle("flat", true, false);
      expect(style.boxShadow).not.toContain("inset 0 1px 2px rgba(255, 255, 255, 0.24)");
      expect(style.boxShadow).toContain("var(--color-dispersion-cyan)");
    });
  });

  describe("computeReactiveSheenBoxShadow", () => {
    const width = 140;
    const height = 44;

    it("returns stock hover luminance and full range when holding = 0", () => {
      // x = 70 (at right edge, normX = 1)
      const shadow = computeReactiveSheenBoxShadow(70, 0, 0, width, height);
      expect(shadow).toContain("oklch(100% 0 0 / 0.18)");
      expect(shadow).toContain("oklch(100% 0 0 / 0.08)");
      expect(shadow).toContain("-1.20px 0.00px");
    });

    it("returns clamped travel and consistent luminance when holding = 1", () => {
      // x = 70 (holding = 1, normX is clamped to 0.65, multiplier 0.75, offset = -0.65 * 0.75 = -0.49px)
      const shadow = computeReactiveSheenBoxShadow(70, 0, 1, width, height);
      expect(shadow).toContain("oklch(100% 0 0 / 0.18)");
      expect(shadow).toContain("oklch(100% 0 0 / 0.08)");
      expect(shadow).toContain("-0.49px 0.00px");
    });

    it("smoothly clamps offset even when dragged far outside the element", () => {
      const outsideShadow = computeReactiveSheenBoxShadow(500, 500, 1, width, height);
      // normX and normY clamped to -0.65, offset is -0.49px
      expect(outsideShadow).toContain("-0.49px -0.49px");
      expect(outsideShadow).toContain("oklch(100% 0 0 / 0.18)");
      expect(outsideShadow).toContain("oklch(100% 0 0 / 0.08)");
    });
  });
});
