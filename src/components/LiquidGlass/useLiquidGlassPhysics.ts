"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type MouseEvent,
} from "react";
import { useMotionValue, useSpring, useTransform } from "motion/react";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import { SPRING } from "../../utils/springConfig";
import { tilt as tiltConfig } from "./config";
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

function computeTiltAngle(
  offset: number,
  dimension: number,
  strength: number,
): number {
  if (!dimension) return 0;
  return (offset / (dimension / 2)) * strength;
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

  useEffect(() => {
    return () => {
      if (settleTimerRef.current !== null) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
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

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const opacity = useMotionValue(0);

  const springX = useSpring(mouseX, SPRING.glassMouse);
  const springY = useSpring(mouseY, SPRING.glassMouse);
  const springOpacity = useSpring(opacity, SPRING.glassOpacity);

  const lagX = useSpring(mouseX, SPRING.glassLag);
  const lagY = useSpring(mouseY, SPRING.glassLag);

  const effectiveTiltStrength = computeEffectiveTiltStrength(
    dimensions.width,
    tiltStrength,
  );

  const springPullX = useTransform(springX, (x) =>
    effectiveMagnetic ? x * magneticStrength : 0,
  );
  const springPullY = useTransform(springY, (y) =>
    effectiveMagnetic ? y * magneticStrength : 0,
  );

  const springTiltX = useTransform(springY, (y) =>
    effectiveTilt
      ? -computeTiltAngle(
          y,
          liveDimensionsRef.current.height,
          effectiveTiltStrength,
        )
      : 0,
  );

  const springTiltY = useTransform(springX, (x) =>
    effectiveTilt
      ? computeTiltAngle(
          x,
          liveDimensionsRef.current.width,
          effectiveTiltStrength,
        )
      : 0,
  );

  const borderGradient = useTransform(
    [springX, springY],
    ([x, y]) =>
      `radial-gradient(180px circle at calc(50% + ${x}px) calc(50% + ${y}px), rgba(255, 255, 255, 0.06) 0%, transparent 80%)`,
  );

  const handleMouseEnter = useCallback(() => {
    if (!interactive) return;
    opacity.set(1);
    setIsHovered(true);
  }, [interactive, opacity]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!interactive) return;
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        liveDimensionsRef.current = { width: rect.width, height: rect.height };
      }
      mouseX.set(e.clientX - rect.left - rect.width / 2);
      mouseY.set(e.clientY - rect.top - rect.height / 2);
    },
    [interactive, mouseX, mouseY],
  );

  const handleMouseLeave = useCallback(() => {
    if (!interactive) return;
    opacity.set(0);
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  }, [interactive, opacity, mouseX, mouseY]);

  const setElementRef = useCallback((node: HTMLElement | null) => {
    elementRef.current = node;
  }, []);

  return {
    setElementRef,
    dimensions,
    isHovered,
    springX,
    springY,
    lagX,
    lagY,
    springOpacity,
    springPullX,
    springPullY,
    springTiltX,
    springTiltY,
    borderGradient,
    handleMouseEnter,
    handleMouseMove,
    handleMouseLeave,
  };
}
