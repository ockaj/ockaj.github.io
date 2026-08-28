"use client";

import {
  useState,
  useCallback,
  useMemo,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import { useResizeObserver } from "../../hooks/useResizeObserver";

import Ripple from "./Ripple";
import { useRipple } from "./useRipple";
import { type LiquidGlassPropsWithRef, DEFAULT_STYLE } from "./types";
import { scaleDeltas, scaleVertical, getInnerGlassStyle } from "./config";
import {
  SCALE_TRANSITION,
  assignRef,
  getContentTagAndClasses,
  useKeyboardClick,
  getGlassClasses,
  TAG_MAP,
  setupTagProps,
  getEntryDimensions,
} from "./liquidGlassUtils";
import { InnerBorderOverlay } from "./LiquidGlassOverlays";

export default function LiquidGlassMobile(
  props: Readonly<LiquidGlassPropsWithRef>,
) {
  const {
    children,
    as = "div",
    href,
    download,
    target,
    rel,
    ariaLabel,
    onClick,
    className = "",
    innerClassName = "",
    style = DEFAULT_STYLE,
    interactive = true,
    springScale = false,
    roundedClass = "rounded-full",
    ripple = true,
    variant = "flat",
    active = false,
    specularGlow = false,
    magnetic: _magnetic,
    tilt: _tilt,
    magneticStrength: _magneticStrength,
    tiltStrength: _tiltStrength,
    ref,
    ...domProps
  } = props;

  const prefersReducedMotion = useReducedMotion();
  const isMotionReduced = !!prefersReducedMotion;
  const effectiveSpringScale = springScale && !isMotionReduced;
  const effectiveRipple = ripple && !isMotionReduced;

  const [element, setElement] = useState<HTMLElement | null>(null);
  const [width, setWidth] = useState(120);

  const handleRef = useCallback(
    (node: HTMLElement | null) => {
      setElement(() => (effectiveSpringScale ? node : null));
      assignRef(ref, node);
    },
    [ref, effectiveSpringScale],
  );

  useResizeObserver(effectiveSpringScale ? element : null, (entry) => {
    const { width: newWidth } = getEntryDimensions(entry);
    if (newWidth > 0) {
      setWidth((prev) => (prev === newWidth ? prev : newWidth));
    }
  });

  const {
    rippleX,
    rippleY,
    rippleRadius,
    rippleOpacity,
    onPointerDown: handlePointerDown,
  } = useRipple(interactive && effectiveSpringScale && effectiveRipple);

  const handleKeyDown = useKeyboardClick(onClick);

  const { borderActiveClasses, baseClasses } = getGlassClasses({
    active,
    as,
    href,
    onClick,
    roundedClass,
    className,
  });

  const innerGlassStyle = useMemo<CSSProperties>(() => {
    const baseStyle = getInnerGlassStyle(variant, active);
    if (specularGlow && active && variant === "flat") {
      const defaultShadow =
        "inset 0 1px 1px rgba(255, 255, 255, 0.25), inset 0 4px 8px rgba(255, 255, 255, 0.03), 0 4px 10px rgba(0, 0, 0, 0.08)";
      return {
        boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.24), inset 0 8px 16px rgba(255, 255, 255, 0.06), ${defaultShadow}`,
      };
    }
    return baseStyle;
  }, [variant, active, specularGlow]);

  const tagStyle = useMemo<CSSProperties>(() => {
    return {
      WebkitBackfaceVisibility: "hidden",
      backfaceVisibility: "hidden",
      willChange: style?.willChange ?? "transform, filter, backdrop-filter",
      ...style,
    };
  }, [style]);

  const tapDeltaX = scaleDeltas.tap.mobile;
  const tapScaleX = 1 + tapDeltaX / width;
  const tapScaleY = scaleVertical.tap.mobile;

  const handlePointerDownWrapper = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      handlePointerDown(e);
    },
    [handlePointerDown],
  );

  const sharedAnimationProps = useMemo(
    () => ({
      whileTap: effectiveSpringScale
        ? { scaleX: tapScaleX, scaleY: tapScaleY }
        : undefined,
      transition: effectiveSpringScale ? SCALE_TRANSITION : undefined,
      onPointerDown: handlePointerDownWrapper,
    }),
    [effectiveSpringScale, handlePointerDownWrapper, tapScaleX, tapScaleY],
  );

  const { isInline, contentClasses } = getContentTagAndClasses(
    as,
    innerClassName,
  );
  const ContentTag = isInline ? "span" : "div";

  const rendersRipple = interactive && effectiveSpringScale && effectiveRipple;

  const innerElements = (
    <>
      <InnerBorderOverlay
        borderActiveClasses={borderActiveClasses}
        roundedClass={roundedClass}
        style={innerGlassStyle}
      />
      {rendersRipple ? (
        <Ripple
          rippleX={rippleX}
          rippleY={rippleY}
          rippleRadius={rippleRadius}
          rippleOpacity={rippleOpacity}
        />
      ) : null}

      <ContentTag className={contentClasses}>{children}</ContentTag>
    </>
  );

  const Tag = href ? motion.a : (TAG_MAP[as] ?? motion.div);
  const tagProps = setupTagProps(
    href,
    as,
    download,
    target,
    rel,
    onClick,
    handleKeyDown,
    baseClasses,
    tagStyle,
    ariaLabel,
    sharedAnimationProps,
    domProps,
  );

  return (
    <Tag ref={handleRef} {...tagProps}>
      {innerElements}
    </Tag>
  );
}

LiquidGlassMobile.displayName = "LiquidGlassMobile";
