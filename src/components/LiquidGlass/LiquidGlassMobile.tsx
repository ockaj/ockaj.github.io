"use client";

import {
  useState,
  useRef,
  useCallback,
  useMemo,
  type CSSProperties,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import { useResizeObserver } from "../../hooks/useResizeObserver";

import Ripple from "./Ripple";
import { useRipple } from "./useRipple";
import { type InteractiveGlassPropsWithRef, DEFAULT_STYLE } from "./types";
import { glassFeel } from "./config";
import {
  TAP_PRESS_TRANSITION,
  TAP_RELEASE_TRANSITION,
  assignRef,
  getContentTagAndClasses,
  useKeyboardClick,
  getGlassClasses,
  TAG_MAP,
  setupTagProps,
  getEntryDimensions,
  computeInnerGlassStyle,
  computeGlisseBaseScale,
} from "./liquidGlassUtils";
import { InnerBorderOverlay } from "./LiquidGlassOverlays";

export default function LiquidGlassMobile(
  props: Readonly<InteractiveGlassPropsWithRef>,
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

  const elementRef = useRef<HTMLElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 120, height: 36 });

  const handleRef = useCallback(
    (node: HTMLElement | null) => {
      elementRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  useResizeObserver(effectiveSpringScale ? elementRef : null, (entry) => {
    const { width: newWidth, height: newHeight } = getEntryDimensions(entry);
    if (newWidth > 0 && newHeight > 0) {
      setDimensions((prev) =>
        prev.width === newWidth && prev.height === newHeight
          ? prev
          : { width: newWidth, height: newHeight },
      );
    }
  });

  const {
    rippleX,
    rippleY,
    rippleScale,
    rippleOpacity,
    onPointerDown: handlePointerDown,
  } = useRipple(effectiveSpringScale && effectiveRipple);

  const handleKeyDown = useKeyboardClick(onClick);

  const { borderActiveClasses, baseClasses } = getGlassClasses({
    active,
    as,
    href,
    onClick,
    roundedClass,
    className,
  });

  const innerGlassStyle = useMemo<CSSProperties>(
    () => computeInnerGlassStyle(variant, active, specularGlow),
    [variant, active, specularGlow],
  );

  const tagStyle = useMemo<CSSProperties>(() => {
    return {
      WebkitBackfaceVisibility: effectiveSpringScale ? "hidden" : undefined,
      backfaceVisibility: effectiveSpringScale ? "hidden" : undefined,
      willChange:
        style?.willChange ?? (effectiveSpringScale ? "transform" : undefined),
      ...style,
    };
  }, [effectiveSpringScale, style]);

  const tapScale = computeGlisseBaseScale(
    dimensions.width,
    dimensions.height,
    glassFeel.touch.grow,
  );

  const sharedAnimationProps = useMemo(
    () => ({
      whileTap: effectiveSpringScale
        ? {
            scaleX: tapScale,
            scaleY: tapScale,
            transition: TAP_PRESS_TRANSITION,
          }
        : undefined,
      transition: effectiveSpringScale ? TAP_RELEASE_TRANSITION : undefined,
      onPointerDown: handlePointerDown,
    }),
    [effectiveSpringScale, handlePointerDown, tapScale],
  );

  const { isInline, contentClasses } = getContentTagAndClasses(
    href ? "a" : as,
    innerClassName,
  );
  const ContentTag = isInline ? "span" : "div";

  const rendersRipple = effectiveSpringScale && effectiveRipple;

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
          rippleScale={rippleScale}
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
