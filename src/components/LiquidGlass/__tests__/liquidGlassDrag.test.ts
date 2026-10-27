import { describe, it, expect, vi } from "vitest";
import {
  setupTagProps,
  TAP_PRESS_TRANSITION,
  TAP_RELEASE_TRANSITION,
} from "../liquidGlassUtils";
import { computeAnisotropicStretch } from "../useLiquidGlassPhysics";
import { SPRING } from "../../../utils/springConfig";

describe("LiquidGlass hold, drag, and click suppression", () => {
  it("defines dual-stage spring profiles in SPRING config matching Apple physical specifications", () => {
    expect(SPRING.glassPress.stiffness).toBeCloseTo(417.6, 1);
    expect(SPRING.glassPress.damping).toBeCloseTo(29.2, 1);
    expect(SPRING.glassRelease.stiffness).toBeCloseTo(230, 1);
    expect(SPRING.glassRelease.damping).toBeCloseTo(23.7, 1);
    expect(TAP_PRESS_TRANSITION.scaleX).toBe(SPRING.glassPress);
    expect(TAP_RELEASE_TRANSITION.scaleX).toBe(SPRING.glassRelease);
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

    it("returns scale 1 when there is no movement", () => {
      const result = computeAnisotropicStretch(0, 0, buttonWidth, buttonHeight);
      expect(result.scaleX).toBe(1);
      expect(result.scaleY).toBe(1);
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

    it("handles zero or degenerate dimensions gracefully without producing NaN", () => {
      const result = computeAnisotropicStretch(20, 20, 0, 0);
      expect(Number.isFinite(result.scaleX)).toBe(true);
      expect(Number.isFinite(result.scaleY)).toBe(true);
      expect(Number.isFinite(result.rubber)).toBe(true);
      expect(result.scaleX * result.scaleY).toBeCloseTo(1, 4);
    });

    it("yields minimal anisotropic stretch on equal diagonal pull (aspect normalized)", () => {
      // With equal aspect 1 (width = height), 45-degree drag has nx == ny, so ||nx| - |ny|| == 0
      const result = computeAnisotropicStretch(30, 30, 100, 100);
      expect(result.scaleX).toBeCloseTo(1, 2);
      expect(result.scaleY).toBeCloseTo(1, 2);
    });

    it("supports mutable output buffer to guarantee zero-allocation in hot path", () => {
      const buffer = { scaleX: 0, scaleY: 0, rubber: 0, nx: 0, ny: 0 };
      const returned = computeAnisotropicStretch(40, 0, buttonWidth, buttonHeight, buffer);

      expect(returned).toBe(buffer);
      expect(buffer.scaleX).toBeGreaterThan(1);
      expect(buffer.scaleY).toBeLessThan(1);
      expect(buffer.scaleX * buffer.scaleY).toBeCloseTo(1, 5);
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
});
