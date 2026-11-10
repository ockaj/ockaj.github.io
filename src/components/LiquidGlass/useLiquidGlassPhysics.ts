"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { clamp, frame, useMotionValue, useSpring } from "motion/react";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import { SPRING } from "../../utils/springConfig";
import { tilt as tiltConfig, glassFeel } from "./config";
import { getEntryDimensions } from "./liquidGlassUtils";

interface LiquidGlassPhysicsParams {
  interactive: boolean;
  effectiveMagnetic: boolean;
  effectiveTilt: boolean;
  effectiveSpringScale?: boolean;
  magneticStrength: number;
  tiltStrength: number;
}

function computeEffectiveTiltStrength(width: number, strength: number): number {
  const raw = strength * (tiltConfig.referenceWidth / Math.max(width, 1));
  return Math.min(raw, tiltConfig.maxStrength);
}

interface StretchMetrics {
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
  const safeWidth = Number.isFinite(width) && width > 0 ? width : safeHeight;
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

interface GlassPhysicsTargets {
  isHovered: boolean;
  isHolding: boolean;
  pointerType: "mouse" | "touch";
  dimensions: { width: number; height: number };
  pullX: number;
  pullY: number;
  tiltX: number;
  tiltY: number;
  scaleX: number;
  scaleY: number;
  mouseX: number;
  mouseY: number;
  sheenOpacity: number;
  holding: number;
}

interface GlassGestureEngine {
  configure: (config: LiquidGlassPhysicsParams) => void;
  getState: () => GlassPhysicsTargets;
  pointerDown: (input: {
    pointerId: number;
    pointerType: string;
    button: number;
    isPrimary?: boolean;
    clientX: number;
    clientY: number;
    rect: CachedRect;
  }) => GlassPhysicsTargets | null;
  pointerMove: (input: {
    pointerId: number;
    clientX: number;
    clientY: number;
  }) => GlassPhysicsTargets | null;
  pointerUpOrCancel: (input?: {
    pointerId?: number;
    clientX?: number;
    clientY?: number;
    liveRect?: CachedRect | null;
  }) => GlassPhysicsTargets | null;
  mouseEnter: (input: {
    clientX: number;
    clientY: number;
    rect: CachedRect;
  }) => GlassPhysicsTargets | null;
  mouseMove: (input: {
    clientX: number;
    clientY: number;
    rect: CachedRect;
  }) => GlassPhysicsTargets | null;
  mouseLeave: () => GlassPhysicsTargets | null;
  resize: (
    width: number,
    height: number,
    onDebouncedCommit?: (dimensions: { width: number; height: number }) => void,
  ) => { width: number; height: number } | null;
  consumeClickSuppression: () => boolean;
  destroy: () => void;
}

export function createGlassGestureEngine(
  initialConfig: LiquidGlassPhysicsParams,
): GlassGestureEngine {
  let config: Required<LiquidGlassPhysicsParams> = {
    effectiveSpringScale: true,
    ...initialConfig,
  };

  let liveDimensions = { width: 120, height: 36 };
  let committedDimensions = { width: 120, height: 36 };
  let hasMeasured = false;
  let settleTimer: ReturnType<typeof setTimeout> | null = null;

  let activePointerId: number | null = null;
  let targetRect: CachedRect | null = null;
  let startPointer: { x: number; y: number } | null = null;
  let hasDragged = false;
  let dragResetTimer: ReturnType<typeof setTimeout> | null = null;

  const stretchMetrics: StretchMetrics = {
    scaleX: 1,
    scaleY: 1,
    rubber: 0,
    nx: 0,
    ny: 0,
  };

  const state: GlassPhysicsTargets = {
    isHovered: false,
    isHolding: false,
    pointerType: "mouse",
    dimensions: { width: 120, height: 36 },
    pullX: 0,
    pullY: 0,
    tiltX: 0,
    tiltY: 0,
    scaleX: 1,
    scaleY: 1,
    mouseX: 0,
    mouseY: 0,
    sheenOpacity: 0,
    holding: 0,
  };

  const clearTimers = () => {
    if (settleTimer !== null) {
      clearTimeout(settleTimer);
      settleTimer = null;
    }
    if (dragResetTimer !== null) {
      clearTimeout(dragResetTimer);
      dragResetTimer = null;
    }
  };

  return {
    configure: (next) => {
      config = {
        effectiveSpringScale: true,
        ...next,
      };
    },

    getState: () => state,

    pointerDown: ({
      pointerId,
      pointerType,
      button,
      isPrimary = true,
      clientX,
      clientY,
      rect,
    }) => {
      if (!config.interactive || button !== 0 || isPrimary === false) {
        return null;
      }

      const detectedType: "mouse" | "touch" =
        pointerType === "touch" || pointerType === "pen" ? "touch" : "mouse";
      state.pointerType = detectedType;
      state.isHolding = true;
      state.holding = 1;
      hasDragged = false;

      if (dragResetTimer !== null) {
        clearTimeout(dragResetTimer);
        dragResetTimer = null;
      }

      startPointer = { x: clientX, y: clientY };
      activePointerId = pointerId;

      if (rect.width > 0 && rect.height > 0) {
        targetRect = {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        };
        liveDimensions = { width: rect.width, height: rect.height };
        if (!hasMeasured) {
          hasMeasured = true;
          committedDimensions = { width: rect.width, height: rect.height };
          state.dimensions = committedDimensions;
        }
      } else {
        targetRect = {
          left: rect.left,
          top: rect.top,
          width: liveDimensions.width,
          height: liveDimensions.height,
        };
      }

      const width = targetRect.width;
      const height = targetRect.height;

      if (config.effectiveSpringScale) {
        const growPx =
          glassFeel[detectedType === "touch" ? "touch" : "pointer"].grow;
        const metrics = computeAnisotropicStretch(
          0,
          0,
          width,
          height,
          growPx,
          stretchMetrics,
        );
        state.scaleX = metrics.scaleX;
        state.scaleY = metrics.scaleY;
      } else {
        state.scaleX = 1;
        state.scaleY = 1;
      }

      state.pullX = 0;
      state.pullY = 0;
      state.tiltX = 0;
      state.tiltY = 0;
      state.mouseX = clientX - rect.left - width / 2;
      state.mouseY = clientY - rect.top - height / 2;
      state.sheenOpacity = 1;

      return state;
    },

    pointerMove: ({ pointerId, clientX, clientY }) => {
      if (
        !state.isHolding ||
        pointerId !== activePointerId ||
        !startPointer ||
        !targetRect
      ) {
        return null;
      }

      const rawDx = clientX - startPointer.x;
      const dy = clientY - startPointer.y;
      const length = Math.hypot(rawDx, dy);

      if (length > 5) {
        hasDragged = true;
      }

      const growPx =
        glassFeel[state.pointerType === "touch" ? "touch" : "pointer"].grow;
      const metrics = computeAnisotropicStretch(
        rawDx,
        dy,
        targetRect.width,
        targetRect.height,
        growPx,
        stretchMetrics,
      );

      if (config.effectiveSpringScale) {
        state.scaleX = metrics.scaleX;
        state.scaleY = metrics.scaleY;
      } else {
        state.scaleX = 1;
        state.scaleY = 1;
      }

      const effectiveTiltStrength = computeEffectiveTiltStrength(
        targetRect.width,
        config.tiltStrength,
      );
      const maxPull = config.effectiveMagnetic
        ? 8 * (config.magneticStrength / 0.02)
        : 0;
      const maxTilt = config.effectiveTilt ? effectiveTiltStrength * 4 : 0;

      state.pullX = metrics.nx * maxPull * metrics.rubber;
      state.pullY = metrics.ny * maxPull * metrics.rubber;
      state.tiltX = -metrics.ny * maxTilt * metrics.rubber;
      state.tiltY = metrics.nx * maxTilt * metrics.rubber;

      const localX = clientX - targetRect.left;
      const localY = clientY - targetRect.top;
      const halfW = Math.max(targetRect.width / 2, 1);
      const halfH = Math.max(targetRect.height / 2, 1);
      const maxExtentX = halfW * 1.5;
      const maxExtentY = halfH * 1.5;
      state.mouseX = clamp(-maxExtentX, maxExtentX, localX - halfW);
      state.mouseY = clamp(-maxExtentY, maxExtentY, localY - halfH);

      return state;
    },

    pointerUpOrCancel: (input) => {
      if (
        input?.pointerId !== undefined &&
        activePointerId !== null &&
        input.pointerId !== activePointerId
      ) {
        return null;
      }

      const cachedRect = input?.liveRect ?? targetRect;
      state.isHolding = false;
      state.holding = 0;
      activePointerId = null;
      targetRect = null;
      startPointer = null;

      if (hasDragged) {
        if (dragResetTimer !== null) {
          clearTimeout(dragResetTimer);
        }
        dragResetTimer = setTimeout(() => {
          hasDragged = false;
          dragResetTimer = null;
        }, 100);
      }

      state.pullX = 0;
      state.pullY = 0;
      state.tiltX = 0;
      state.tiltY = 0;
      state.scaleX = 1;
      state.scaleY = 1;

      const isMouse = state.pointerType === "mouse";
      const hasCoords =
        input?.clientX !== undefined && input?.clientY !== undefined;

      if (isMouse && hasCoords && cachedRect) {
        const cx = input.clientX as number;
        const cy = input.clientY as number;
        const inside =
          cx >= cachedRect.left &&
          cx <= cachedRect.left + cachedRect.width &&
          cy >= cachedRect.top &&
          cy <= cachedRect.top + cachedRect.height;

        state.isHovered = inside;
        if (inside) {
          state.mouseX = cx - cachedRect.left - cachedRect.width / 2;
          state.mouseY = cy - cachedRect.top - cachedRect.height / 2;
          state.sheenOpacity = 1;
        } else {
          state.mouseX = 0;
          state.mouseY = 0;
          state.sheenOpacity = 0;
        }
      } else {
        state.isHovered = false;
        state.mouseX = 0;
        state.mouseY = 0;
        state.sheenOpacity = 0;
      }

      return state;
    },

    mouseEnter: ({ clientX, clientY, rect }) => {
      if (!config.interactive) return null;
      state.isHovered = true;

      if (rect.width > 0 && rect.height > 0) {
        liveDimensions = { width: rect.width, height: rect.height };
        if (!hasMeasured) {
          hasMeasured = true;
          committedDimensions = { width: rect.width, height: rect.height };
          state.dimensions = committedDimensions;
        }
      }

      const width = rect.width > 0 ? rect.width : liveDimensions.width;
      const height = rect.height > 0 ? rect.height : liveDimensions.height;
      state.mouseX = clientX - rect.left - width / 2;
      state.mouseY = clientY - rect.top - height / 2;
      if (state.pointerType !== "touch") {
        state.sheenOpacity = 1;
      }

      return state;
    },

    mouseMove: ({ clientX, clientY, rect }) => {
      if (!config.interactive || state.isHolding || !state.isHovered) {
        return null;
      }
      if (rect.width > 0 && rect.height > 0) {
        liveDimensions = { width: rect.width, height: rect.height };
      }
      const width = rect.width > 0 ? rect.width : liveDimensions.width;
      const height = rect.height > 0 ? rect.height : liveDimensions.height;
      state.mouseX = clientX - rect.left - width / 2;
      state.mouseY = clientY - rect.top - height / 2;

      return state;
    },

    mouseLeave: () => {
      if (!config.interactive || state.isHolding) return null;
      state.isHovered = false;
      state.pullX = 0;
      state.pullY = 0;
      state.tiltX = 0;
      state.tiltY = 0;
      state.scaleX = 1;
      state.scaleY = 1;
      state.sheenOpacity = 0;
      state.holding = 0;
      state.mouseX = 0;
      state.mouseY = 0;
      return state;
    },

    resize: (width, height, onDebouncedCommit) => {
      if (width <= 0 || height <= 0) return null;
      liveDimensions = { width, height };

      if (!hasMeasured) {
        hasMeasured = true;
        committedDimensions = { width, height };
        state.dimensions = committedDimensions;
        return committedDimensions;
      }

      const widthChanged = Math.abs(committedDimensions.width - width) >= 1;
      const heightChanged = Math.abs(committedDimensions.height - height) >= 1;

      if (!widthChanged && !heightChanged) {
        return null;
      }

      if (widthChanged) {
        if (settleTimer !== null) {
          clearTimeout(settleTimer);
          settleTimer = null;
        }
        committedDimensions = { width, height };
        state.dimensions = committedDimensions;
        return committedDimensions;
      }

      if (settleTimer !== null) {
        clearTimeout(settleTimer);
      }

      settleTimer = setTimeout(() => {
        settleTimer = null;
        if (
          Math.abs(committedDimensions.width - liveDimensions.width) >= 1 ||
          Math.abs(committedDimensions.height - liveDimensions.height) >= 1
        ) {
          committedDimensions = {
            width: liveDimensions.width,
            height: liveDimensions.height,
          };
          state.dimensions = committedDimensions;
          onDebouncedCommit?.(committedDimensions);
        }
      }, 100);

      return null;
    },

    consumeClickSuppression: () => {
      if (hasDragged) {
        if (dragResetTimer !== null) {
          clearTimeout(dragResetTimer);
          dragResetTimer = null;
        }
        hasDragged = false;
        return true;
      }
      return false;
    },

    destroy: () => {
      clearTimers();
      state.isHovered = false;
      state.isHolding = false;
      activePointerId = null;
      targetRect = null;
      startPointer = null;
      hasDragged = false;
    },
  };
}

export function useLiquidGlassPhysics({
  interactive,
  effectiveMagnetic,
  effectiveTilt,
  effectiveSpringScale = true,
  magneticStrength,
  tiltStrength,
}: LiquidGlassPhysicsParams) {
  const elementRef = useRef<HTMLElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 120, height: 36 });
  const [isHovered, setIsHovered] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [pointerType, setPointerType] = useState<"mouse" | "touch">("mouse");

  const [engine] = useState(() =>
    createGlassGestureEngine({
      interactive,
      effectiveMagnetic,
      effectiveTilt,
      effectiveSpringScale,
      magneticStrength,
      tiltStrength,
    }),
  );

  engine.configure({
    interactive,
    effectiveMagnetic,
    effectiveTilt,
    effectiveSpringScale,
    magneticStrength,
    tiltStrength,
  });

  useEffect(() => {
    return () => {
      engine.destroy();
    };
  }, [engine]);

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
  const activeSpringConfig = isHolding ? activeFeel.press : activeFeel.release;
  const activeSheenSpring = isHolding ? activeFeel.press : SPRING.glassMouse;

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

  const syncMotionTargets = useCallback(
    (targets: GlassPhysicsTargets) => {
      rawPullX.set(targets.pullX);
      rawPullY.set(targets.pullY);
      rawTiltX.set(targets.tiltX);
      rawTiltY.set(targets.tiltY);
      rawScaleX.set(targets.scaleX);
      rawScaleY.set(targets.scaleY);
      mouseX.set(targets.mouseX);
      mouseY.set(targets.mouseY);
      rawSheenOpacity.set(targets.sheenOpacity);
      rawHolding.set(targets.holding);
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

  const handleResize = useCallback(
    (entry: ResizeObserverEntry) => {
      const { width, height } = getEntryDimensions(entry);
      const committed = engine.resize(width, height, (debounced) => {
        setDimensions(debounced);
      });
      if (committed) {
        setDimensions(committed);
      }
    },
    [engine],
  );

  useResizeObserver(interactive && isHovered ? elementRef : null, handleResize);

  const endHold = useCallback(
    (e?: Event) => {
      const pointerEvent =
        e && "pointerId" in e ? (e as PointerEvent) : undefined;
      frame.read(() => {
        const liveRect = elementRef.current?.getBoundingClientRect() ?? null;
        const next = engine.pointerUpOrCancel({
          pointerId: pointerEvent?.pointerId,
          clientX: pointerEvent?.clientX,
          clientY: pointerEvent?.clientY,
          liveRect,
        });
        if (!next) return;
        setIsHolding(false);
        setIsHovered(next.isHovered);
        syncMotionTargets(next);
      });
    },
    [engine, syncMotionTargets],
  );

  const onWindowPointerMove = useCallback(
    (e: PointerEvent) => {
      const { pointerId, clientX, clientY } = e;
      frame.read(() => {
        const next = engine.pointerMove({ pointerId, clientX, clientY });
        if (!next) return;
        syncMotionTargets(next);
      });
    },
    [engine, syncMotionTargets],
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
      const target = e.currentTarget;
      const {
        pointerId,
        pointerType: rawType,
        button,
        isPrimary,
        clientX,
        clientY,
      } = e;
      const detectedType: "mouse" | "touch" =
        rawType === "touch" || rawType === "pen" ? "touch" : "mouse";
      setPointerType(detectedType);
      setIsHolding(true);

      frame.read(() => {
        const rect = target.getBoundingClientRect();
        const next = engine.pointerDown({
          pointerId,
          pointerType: rawType,
          button,
          isPrimary,
          clientX,
          clientY,
          rect,
        });
        if (!next) return;
        setDimensions((prev) =>
          prev.width === next.dimensions.width &&
          prev.height === next.dimensions.height
            ? prev
            : next.dimensions,
        );
        syncMotionTargets(next);
      });
    },
    [engine, interactive, syncMotionTargets],
  );

  const handleMouseEnter = useCallback(
    (e: ReactMouseEvent<HTMLElement>) => {
      if (!interactive) return;
      const currentTarget = e.currentTarget;
      const { clientX, clientY } = e;
      setIsHovered(true);

      frame.read(() => {
        if (!currentTarget) return;
        const rect = currentTarget.getBoundingClientRect();
        const next = engine.mouseEnter({ clientX, clientY, rect });
        if (!next) return;
        setDimensions((prev) =>
          prev.width === next.dimensions.width &&
          prev.height === next.dimensions.height
            ? prev
            : next.dimensions,
        );
        syncMotionTargets(next);
      });
    },
    [engine, interactive, syncMotionTargets],
  );

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent<HTMLElement>) => {
      if (!interactive || isHolding) return;
      const currentTarget = e.currentTarget;
      const { clientX, clientY } = e;

      frame.read(() => {
        if (!currentTarget) return;
        const rect = currentTarget.getBoundingClientRect();
        const next = engine.mouseMove({ clientX, clientY, rect });
        if (!next) return;
        syncMotionTargets(next);
      });
    },
    [engine, interactive, isHolding, syncMotionTargets],
  );

  const handleMouseLeave = useCallback(() => {
    if (!interactive) return;
    const next = engine.mouseLeave();
    if (!next) return;
    setIsHovered(false);
    syncMotionTargets(next);
  }, [engine, interactive, syncMotionTargets]);

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
    shouldSuppressClick: engine.consumeClickSuppression,
  };
}
