"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { frame, useMotionValue, useSpring } from "motion/react";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import { SPRING } from "../../utils/springConfig";
import { tilt as tiltConfig, glassFeel } from "./config";
import { getEntryDimensions } from "./liquidGlassUtils";

interface LiquidGlassPhysicsParams {
  interactive: boolean;
  effectiveMagnetic: boolean;
  effectiveTilt: boolean;
  magneticStrength: number;
  tiltStrength: number;
}

function computeEffectiveTiltStrength(width: number, strength: number): number {
  const raw = strength * (tiltConfig.referenceWidth / Math.max(width, 1));
  return Math.min(raw, tiltConfig.maxStrength);
}

export interface StretchMetrics {
  scaleX: number;
  scaleY: number;
  rubber: number;
  nx: number;
  ny: number;
}

export function computeAnisotropicStretch(
  rawDx: number,
  dy: number,
  width: number,
  height: number,
  grow = 0,
  out?: StretchMetrics,
): StretchMetrics {
  const target = out ?? { scaleX: 1, scaleY: 1, rubber: 0, nx: 0, ny: 0 };
  const safeHeight =
    Number.isFinite(height) && height > 0 ? Math.max(height, 20) : 20;
  const safeWidth =
    Number.isFinite(width) && width > 0 ? width : safeHeight;
  const maxDimension = Math.max(safeWidth, safeHeight);
  const safeGrow = Number.isFinite(grow) ? grow : 0;
  const base = 1 + safeGrow / maxDimension;
  const aspect = Math.max(safeWidth / safeHeight, 0.5);
  const safeDx = Number.isFinite(rawDx) ? rawDx : 0;
  const safeDy = Number.isFinite(dy) ? dy : 0;
  const dx = safeDx / aspect;
  const length = Math.hypot(dx, safeDy);

  if (length <= 0) {
    target.scaleX = base;
    target.scaleY = base;
    target.rubber = 0;
    target.nx = 0;
    target.ny = 0;
    return target;
  }

  const rubber = 1 - 1 / (1 + length / safeHeight / (5 * aspect));
  const nx = dx / length;
  const ny = safeDy / length;

  const stretch =
    1 + (6 / safeHeight) * rubber * Math.abs(Math.abs(nx) - Math.abs(ny));
  const horizontal = Math.abs(nx) > Math.abs(ny);

  target.scaleX = base * (horizontal ? stretch : 1 / stretch);
  target.scaleY = base * (horizontal ? 1 / stretch : stretch);
  target.rubber = rubber;
  target.nx = nx;
  target.ny = ny;

  return target;
}

interface CachedRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function checkHoverOnRelease(
  e: Event | undefined,
  element: HTMLElement | null,
  cachedRect: CachedRect | null,
): { isHovered: boolean; x: number; y: number } {
  if (!e || !("clientX" in e)) {
    return { isHovered: false, x: 0, y: 0 };
  }
  const clientX = (e as PointerEvent).clientX;
  const clientY = (e as PointerEvent).clientY;
  const rect = element?.getBoundingClientRect() ?? cachedRect;
  if (!rect) {
    return { isHovered: false, x: 0, y: 0 };
  }
  const isHovered =
    clientX >= rect.left &&
    clientX <= rect.left + rect.width &&
    clientY >= rect.top &&
    clientY <= rect.top + rect.height;

  return {
    isHovered,
    x: isHovered ? clientX - rect.left - rect.width / 2 : 0,
    y: isHovered ? clientY - rect.top - rect.height / 2 : 0,
  };
}

export function useLiquidGlassPhysics({
  interactive,
  effectiveMagnetic,
  effectiveTilt,
  magneticStrength,
  tiltStrength,
}: LiquidGlassPhysicsParams) {
  const elementRef = useRef<HTMLElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 120, height: 36 });
  const liveDimensionsRef = useRef({ width: 120, height: 36 });
  const committedDimensionsRef = useRef({ width: 120, height: 36 });
  const hasMeasuredRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isHoveredRef = useRef(false);

  const [isHolding, setIsHolding] = useState(false);
  const [pointerType, setPointerType] = useState<"mouse" | "touch">("mouse");
  const pointerTypeRef = useRef<"mouse" | "touch">("mouse");
  const activePointerIdRef = useRef<number | null>(null);
  const targetElementRef = useRef<HTMLElement | null>(null);
  const targetRectRef = useRef<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const startPointerRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);
  const dragResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stretchMetricsRef = useRef<StretchMetrics>({
    scaleX: 1,
    scaleY: 1,
    rubber: 0,
    nx: 0,
    ny: 0,
  });

  const shouldSuppressClick = useCallback(() => {
    if (hasDraggedRef.current) {
      if (dragResetTimerRef.current !== null) {
        clearTimeout(dragResetTimerRef.current);
        dragResetTimerRef.current = null;
      }
      hasDraggedRef.current = false;
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    return () => {
      isHoveredRef.current = false;
      targetElementRef.current = null;
      targetRectRef.current = null;
      activePointerIdRef.current = null;
      startPointerRef.current = null;
      hasDraggedRef.current = false;
      if (settleTimerRef.current !== null) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
      if (dragResetTimerRef.current !== null) {
        clearTimeout(dragResetTimerRef.current);
        dragResetTimerRef.current = null;
      }
    };
  }, []);

  const handleResize = useCallback((entry: ResizeObserverEntry) => {
    const { width, height } = getEntryDimensions(entry);
    if (width <= 0 || height <= 0) return;

    liveDimensionsRef.current = { width, height };

    if (!hasMeasuredRef.current) {
      hasMeasuredRef.current = true;
      committedDimensionsRef.current = { width, height };
      setDimensions({ width, height });
      return;
    }

    const current = committedDimensionsRef.current;
    const widthChanged = Math.abs(current.width - width) >= 1;
    const heightChanged = Math.abs(current.height - height) >= 1;

    if (!widthChanged && !heightChanged) {
      return;
    }

    if (widthChanged) {
      if (settleTimerRef.current !== null) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
      committedDimensionsRef.current = { width, height };
      setDimensions({ width, height });
      return;
    }

    // Only height changed: debounce state update until height settles.
    if (settleTimerRef.current !== null) {
      clearTimeout(settleTimerRef.current);
    }

    settleTimerRef.current = setTimeout(() => {
      settleTimerRef.current = null;
      const latest = liveDimensionsRef.current;
      if (
        Math.abs(committedDimensionsRef.current.width - latest.width) >= 1 ||
        Math.abs(committedDimensionsRef.current.height - latest.height) >= 1
      ) {
        committedDimensionsRef.current = {
          width: latest.width,
          height: latest.height,
        };
        setDimensions({ width: latest.width, height: latest.height });
      }
    }, 100);
  }, []);

  useResizeObserver(interactive && isHovered ? elementRef : null, handleResize);

  const rawPullX = useMotionValue(0);
  const rawPullY = useMotionValue(0);
  const rawTiltX = useMotionValue(0);
  const rawTiltY = useMotionValue(0);
  const rawScaleX = useMotionValue(1);
  const rawScaleY = useMotionValue(1);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rawSheenOpacity = useMotionValue(0);
  const rawHolding = useMotionValue(0);

  const activeFeel = glassFeel[pointerType === "touch" ? "touch" : "pointer"];
  const activeSpringConfig = isHolding
    ? activeFeel.press
    : activeFeel.release;
  const activeSheenSpring = isHolding
    ? activeFeel.press
    : SPRING.glassMouse;

  const springPullX = useSpring(rawPullX, activeSpringConfig);
  const springPullY = useSpring(rawPullY, activeSpringConfig);
  const springTiltX = useSpring(rawTiltX, activeSpringConfig);
  const springTiltY = useSpring(rawTiltY, activeSpringConfig);
  const springScaleX = useSpring(rawScaleX, activeSpringConfig);
  const springScaleY = useSpring(rawScaleY, activeSpringConfig);
  const springX = useSpring(mouseX, activeSheenSpring);
  const springY = useSpring(mouseY, activeSheenSpring);
  const sheenOpacity = useSpring(rawSheenOpacity, SPRING.glassOpacity);
  const springHolding = useSpring(rawHolding, SPRING.glassPress);

  const endHold = useCallback(
    (e?: Event) => {
      if (
        e &&
        "pointerId" in e &&
        activePointerIdRef.current !== null &&
        (e as PointerEvent).pointerId !== activePointerIdRef.current
      ) {
        return;
      }
      const cachedRect = targetRectRef.current;
      setIsHolding(false);
      rawHolding.set(0);
      activePointerIdRef.current = null;
      targetElementRef.current = null;
      targetRectRef.current = null;
      startPointerRef.current = null;
      if (hasDraggedRef.current) {
        if (dragResetTimerRef.current !== null) {
          clearTimeout(dragResetTimerRef.current);
        }
        dragResetTimerRef.current = setTimeout(() => {
          hasDraggedRef.current = false;
          dragResetTimerRef.current = null;
        }, 100);
      }
      frame.read(() => {
        rawPullX.set(0);
        rawPullY.set(0);
        rawTiltX.set(0);
        rawTiltY.set(0);
        rawScaleX.set(1);
        rawScaleY.set(1);

        const isMouse = pointerTypeRef.current === "mouse";
        const hoverResult = isMouse
          ? checkHoverOnRelease(e, elementRef.current, cachedRect)
          : { isHovered: false, x: 0, y: 0 };

        isHoveredRef.current = hoverResult.isHovered;
        setIsHovered(hoverResult.isHovered);

        if (hoverResult.isHovered) {
          mouseX.set(hoverResult.x);
          mouseY.set(hoverResult.y);
          rawSheenOpacity.set(1);
        } else {
          mouseX.set(0);
          mouseY.set(0);
          rawSheenOpacity.set(0);
        }
      });
    },
    [
      mouseX,
      mouseY,
      rawHolding,
      rawPullX,
      rawPullY,
      rawScaleX,
      rawScaleY,
      rawSheenOpacity,
      rawTiltX,
      rawTiltY,
    ],
  );

  const onWindowPointerMove = useCallback(
    (e: PointerEvent) => {
      if (e.pointerId !== activePointerIdRef.current) {
        return;
      }
      const target = targetElementRef.current;
      const start = startPointerRef.current;
      const cachedRect = targetRectRef.current;
      if (!target || !start || !cachedRect) return;
      const clientX = e.clientX;
      const clientY = e.clientY;

      const rawDx = clientX - start.x;
      const dy = clientY - start.y;
      const length = Math.hypot(rawDx, dy);

      if (length > 5) {
        hasDraggedRef.current = true;
      }

      frame.read(() => {
        const growPx =
          glassFeel[pointerTypeRef.current === "touch" ? "touch" : "pointer"]
            .grow;

        const metrics = computeAnisotropicStretch(
          rawDx,
          dy,
          cachedRect.width,
          cachedRect.height,
          growPx,
          stretchMetricsRef.current,
        );

        rawScaleX.set(metrics.scaleX);
        rawScaleY.set(metrics.scaleY);

        const effectiveTiltStrength = computeEffectiveTiltStrength(
          cachedRect.width,
          tiltStrength,
        );
        const maxPull = effectiveMagnetic
          ? 8 * (magneticStrength / 0.02)
          : 0;
        const maxTilt = effectiveTilt ? effectiveTiltStrength * 4 : 0;

        rawPullX.set(metrics.nx * maxPull * metrics.rubber);
        rawPullY.set(metrics.ny * maxPull * metrics.rubber);
        rawTiltX.set(-metrics.ny * maxTilt * metrics.rubber);
        rawTiltY.set(metrics.nx * maxTilt * metrics.rubber);

        const localX = clientX - cachedRect.left;
        const localY = clientY - cachedRect.top;
        const halfW = Math.max(cachedRect.width / 2, 1);
        const halfH = Math.max(cachedRect.height / 2, 1);
        const maxExtentX = halfW * 1.5;
        const maxExtentY = halfH * 1.5;
        const clampedX = Math.max(-maxExtentX, Math.min(maxExtentX, localX - halfW));
        const clampedY = Math.max(-maxExtentY, Math.min(maxExtentY, localY - halfH));
        mouseX.set(clampedX);
        mouseY.set(clampedY);
      });
    },
    [
      effectiveMagnetic,
      effectiveTilt,
      magneticStrength,
      mouseX,
      mouseY,
      rawPullX,
      rawPullY,
      rawScaleX,
      rawScaleY,
      rawTiltX,
      rawTiltY,
      tiltStrength,
    ],
  );

  useEffect(() => {
    if (!isHolding) return;

    window.addEventListener("pointermove", onWindowPointerMove, {
      passive: true,
    });
    window.addEventListener("pointerup", endHold);
    window.addEventListener("pointercancel", endHold);
    window.addEventListener("blur", endHold);

    return () => {
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", endHold);
      window.removeEventListener("pointercancel", endHold);
      window.removeEventListener("blur", endHold);
    };
  }, [endHold, isHolding, onWindowPointerMove]);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!interactive || e.button !== 0 || e.isPrimary === false) return;

      const detectedType: "mouse" | "touch" =
        e.pointerType === "touch" || e.pointerType === "pen"
          ? "touch"
          : "mouse";
      pointerTypeRef.current = detectedType;
      setPointerType(detectedType);
      setIsHolding(true);
      rawHolding.set(1);
      hasDraggedRef.current = false;
      if (dragResetTimerRef.current !== null) {
        clearTimeout(dragResetTimerRef.current);
        dragResetTimerRef.current = null;
      }
      startPointerRef.current = { x: e.clientX, y: e.clientY };
      activePointerIdRef.current = e.pointerId;
      const target = e.currentTarget;
      targetElementRef.current = target;

      const clientX = e.clientX;
      const clientY = e.clientY;

      frame.read(() => {
        const rect = target.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          targetRectRef.current = {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          };
          liveDimensionsRef.current = {
            width: rect.width,
            height: rect.height,
          };
          if (!hasMeasuredRef.current) {
            hasMeasuredRef.current = true;
            committedDimensionsRef.current = {
              width: rect.width,
              height: rect.height,
            };
            setDimensions({ width: rect.width, height: rect.height });
          }
        }

        const growPx =
          glassFeel[detectedType === "touch" ? "touch" : "pointer"].grow;
        const width =
          rect.width > 0 ? rect.width : liveDimensionsRef.current.width;
        const height =
          rect.height > 0 ? rect.height : liveDimensionsRef.current.height;

        const metrics = computeAnisotropicStretch(
          0,
          0,
          width,
          height,
          growPx,
          stretchMetricsRef.current,
        );

        rawPullX.set(0);
        rawPullY.set(0);
        rawTiltX.set(0);
        rawTiltY.set(0);
        rawScaleX.set(metrics.scaleX);
        rawScaleY.set(metrics.scaleY);

        const localX = clientX - rect.left;
        const localY = clientY - rect.top;
        mouseX.set(localX - rect.width / 2);
        mouseY.set(localY - rect.height / 2);
        rawSheenOpacity.set(1);
      });
    },
    [
      interactive,
      mouseX,
      mouseY,
      rawHolding,
      rawPullX,
      rawPullY,
      rawScaleX,
      rawScaleY,
      rawSheenOpacity,
      rawTiltX,
      rawTiltY,
    ],
  );

  const updateMousePositions = useCallback(
    (e: ReactMouseEvent<HTMLElement>, onUpdate?: () => void) => {
      const currentTarget = e.currentTarget;
      const clientX = e.clientX;
      const clientY = e.clientY;

      frame.read(() => {
        if (!currentTarget || !isHoveredRef.current) return;
        const rect = currentTarget.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          liveDimensionsRef.current = {
            width: rect.width,
            height: rect.height,
          };
        }
        const localX = clientX - rect.left;
        const localY = clientY - rect.top;
        mouseX.set(localX - rect.width / 2);
        mouseY.set(localY - rect.height / 2);
        onUpdate?.();
      });
    },
    [mouseX, mouseY],
  );

  const handleMouseEnter = useCallback(
    (e: ReactMouseEvent<HTMLElement>) => {
      if (!interactive) return;
      isHoveredRef.current = true;
      if (!hasMeasuredRef.current) {
        const width = e.currentTarget.offsetWidth;
        const height = e.currentTarget.offsetHeight;
        if (width > 0 && height > 0) {
          hasMeasuredRef.current = true;
          liveDimensionsRef.current = { width, height };
          committedDimensionsRef.current = { width, height };
          setDimensions({ width, height });
        }
      }
      setIsHovered(true);
      updateMousePositions(e, () => {
        if (!isHoveredRef.current || pointerTypeRef.current === "touch") return;
        rawSheenOpacity.set(1);
      });
    },
    [interactive, rawSheenOpacity, updateMousePositions],
  );

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent<HTMLElement>) => {
      if (!interactive || isHolding) return;
      updateMousePositions(e);
    },
    [interactive, isHolding, updateMousePositions],
  );

  const handleMouseLeave = useCallback(() => {
    if (!interactive) return;
    if (!isHolding) {
      isHoveredRef.current = false;
      setIsHovered(false);
      rawPullX.set(0);
      rawPullY.set(0);
      rawTiltX.set(0);
      rawTiltY.set(0);
      rawScaleX.set(1);
      rawScaleY.set(1);
      rawSheenOpacity.set(0);
      rawHolding.set(0);
      mouseX.set(0);
      mouseY.set(0);
    }
  }, [
    interactive,
    isHolding,
    mouseX,
    mouseY,
    rawHolding,
    rawPullX,
    rawPullY,
    rawScaleX,
    rawScaleY,
    rawSheenOpacity,
    rawTiltX,
    rawTiltY,
  ]);

  const setElementRef = useCallback((node: HTMLElement | null) => {
    elementRef.current = node;
  }, []);

  return {
    setElementRef,
    dimensions,
    isHovered,
    springX,
    springY,
    springScaleX,
    springScaleY,
    springHolding,
    sheenOpacity,
    springPullX,
    springPullY,
    springTiltX,
    springTiltY,
    handleMouseEnter,
    handleMouseMove,
    handleMouseLeave,
    handlePointerDown,
    shouldSuppressClick,
  };
}
