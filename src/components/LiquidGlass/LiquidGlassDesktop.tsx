"use client";

import { useMemo, useCallback, type CSSProperties } from "react";
import {
  motion,
  useReducedMotion,
  type MotionStyle,
  type MotionValue,
} from "motion/react";

import Ripple from "./Ripple";
import { useRipple } from "./useRipple";
import { useLiquidGlassPhysics } from "./useLiquidGlassPhysics";
import {
  type LiquidGlassPropsWithRef,
  type LiquidGlassProps,
  DEFAULT_STYLE,
} from "./types";
import {
  hoverDelta,
  scaleDeltas,
  scaleVertical,
  getInnerGlassStyle,
} from "./config";
import {
  SCALE_TRANSITION,
  assignRef,
  getContentTagAndClasses,
  useKeyboardClick,
  getGlassClasses,
  TAG_MAP,
  setupTagProps,
} from "./liquidGlassUtils";
import {
  InnerBorderOverlay,
  DesktopEffectsOverlay,
} from "./LiquidGlassOverlays";

interface MotionFlagOptions {
  magnetic: boolean;
  tilt: boolean;
  springScale: boolean;
  ripple: boolean;
}

function getEffectiveMotionFlags(
  prefersReducedMotion: boolean | null,
  options: MotionFlagOptions,
) {
  const isReduced = Boolean(prefersReducedMotion);
  return {
    isMotionReduced: isReduced,
    effectiveMagnetic: options.magnetic && !isReduced,
    effectiveTilt: options.tilt && !isReduced,
    effectiveSpringScale: options.springScale && !isReduced,
    effectiveRipple: options.ripple && !isReduced,
  };
}

function computeInnerGlassStyle(
  variant: LiquidGlassProps["variant"],
  isActive: boolean,
  specularGlow: boolean,
): CSSProperties {
  const baseStyle = getInnerGlassStyle(variant, isActive);
  if (specularGlow && isActive && variant === "flat") {
    const defaultShadow =
      "inset 0 1px 1px rgba(255, 255, 255, 0.25), inset 0 4px 8px rgba(255, 255, 255, 0.03), 0 4px 10px rgba(0, 0, 0, 0.08)";
    return {
      boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.24), inset 0 8px 16px rgba(255, 255, 255, 0.06), ${defaultShadow}`,
    };
  }
  return baseStyle;
}

function computeTagStyle(
  style: MotionStyle | CSSProperties | undefined,
  effectiveMagnetic: boolean,
  effectiveTilt: boolean,
  effectiveSpringScale: boolean,
  springPullX: MotionValue<number>,
  springPullY: MotionValue<number>,
  springTiltX: MotionValue<number>,
  springTiltY: MotionValue<number>,
): MotionStyle {
  const hasTransform =
    effectiveMagnetic || effectiveTilt || effectiveSpringScale;
  return {
    WebkitBackfaceVisibility: hasTransform ? "hidden" : undefined,
    backfaceVisibility: hasTransform ? "hidden" : undefined,
    willChange:
      style?.willChange ??
      (hasTransform ? "transform, filter, backdrop-filter" : undefined),
    x: effectiveMagnetic ? springPullX : undefined,
    y: effectiveMagnetic ? springPullY : undefined,
    rotateX: effectiveTilt ? springTiltX : undefined,
    rotateY: effectiveTilt ? springTiltY : undefined,
    transformStyle: effectiveTilt ? "preserve-3d" : undefined,
    transformPerspective: effectiveTilt ? 1000 : undefined,
    ...style,
  };
}

function getScaleAnimationProps(
  effectiveSpringScale: boolean,
  dimensions: { width: number; height: number },
) {
  if (!effectiveSpringScale) {
    return {
      whileHover: undefined,
      whileTap: undefined,
      transition: undefined,
    };
  }

  const delta = hoverDelta.desktop;
  const tapDeltaX = scaleDeltas.tap.desktop;

  return {
    whileHover: {
      scaleX: 1 + (2 * delta) / dimensions.width,
      scaleY: 1 + (2 * delta) / dimensions.height,
    },
    whileTap: {
      scaleX: 1 + tapDeltaX / dimensions.width,
      scaleY: scaleVertical.tap.desktop,
    },
    transition: SCALE_TRANSITION,
  };
}

export default function LiquidGlassDesktop({
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
  magnetic = false,
  tilt = false,
  magneticStrength = 0.02,
  tiltStrength = 2,
  ripple = true,
  variant = "flat",
  active = false,
  specularGlow = false,
  ref,
  ...domProps
}: Readonly<LiquidGlassPropsWithRef>) {
  const prefersReducedMotion = useReducedMotion();
  const {
    isMotionReduced,
    effectiveMagnetic,
    effectiveTilt,
    effectiveSpringScale,
    effectiveRipple,
  } = getEffectiveMotionFlags(prefersReducedMotion, {
    magnetic,
    tilt,
    springScale,
    ripple,
  });

  const physics = useLiquidGlassPhysics({
    interactive,
    effectiveMagnetic,
    effectiveTilt,
    magneticStrength,
    tiltStrength,
  });

  const { setElementRef } = physics;

  const handleRef = useCallback(
    (node: HTMLElement | null) => {
      setElementRef(node);
      assignRef(ref, node);
    },
    [ref, setElementRef],
  );

  const rendersRipple = interactive && effectiveSpringScale && effectiveRipple;
  const {
    rippleX,
    rippleY,
    rippleRadius,
    rippleOpacity,
    onPointerDown: handlePointerDown,
  } = useRipple(rendersRipple);

  const handleKeyDown = useKeyboardClick(onClick);

  const { borderActiveClasses, baseClasses } = getGlassClasses({
    active,
    as,
    href,
    onClick,
    roundedClass,
    className,
    isHovered: physics.isHovered,
  });

  const innerGlassStyle = useMemo(
    () =>
      computeInnerGlassStyle(
        variant,
        active || physics.isHovered,
        specularGlow,
      ),
    [variant, active, physics.isHovered, specularGlow],
  );

  const tagStyle = useMemo(
    () =>
      computeTagStyle(
        style,
        effectiveMagnetic,
        effectiveTilt,
        effectiveSpringScale,
        physics.springPullX,
        physics.springPullY,
        physics.springTiltX,
        physics.springTiltY,
      ),
    [
      style,
      effectiveMagnetic,
      effectiveTilt,
      effectiveSpringScale,
      physics.springPullX,
      physics.springPullY,
      physics.springTiltX,
      physics.springTiltY,
    ],
  );

  const scaleAnimationProps = useMemo(
    () => getScaleAnimationProps(effectiveSpringScale, physics.dimensions),
    [effectiveSpringScale, physics.dimensions],
  );

  const sharedAnimationProps = useMemo(
    () => ({
      ...scaleAnimationProps,
      onMouseEnter: physics.handleMouseEnter,
      onMouseMove: physics.handleMouseMove,
      onMouseLeave: physics.handleMouseLeave,
      onPointerDown: handlePointerDown,
    }),
    [
      scaleAnimationProps,
      physics.handleMouseEnter,
      physics.handleMouseMove,
      physics.handleMouseLeave,
      handlePointerDown,
    ],
  );

  const { isInline, contentClasses } = getContentTagAndClasses(
    as,
    innerClassName,
  );
  const ContentTag = isInline ? "span" : "div";

  const rendersFullEffects = interactive && !isMotionReduced;
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
      <InnerBorderOverlay
        borderActiveClasses={borderActiveClasses}
        roundedClass={roundedClass}
        style={innerGlassStyle}
      />
      {rendersFullEffects ? (
        <DesktopEffectsOverlay
          roundedClass={roundedClass}
          springX={physics.springX}
          springY={physics.springY}
          lagX={physics.lagX}
          lagY={physics.lagY}
          springOpacity={physics.springOpacity}
          borderGradient={physics.borderGradient}
          isHovered={physics.isHovered}
        />
      ) : null}
      {rendersRipple ? (
        <Ripple
          rippleX={rippleX}
          rippleY={rippleY}
          rippleRadius={rippleRadius}
          rippleOpacity={rippleOpacity}
        />
      ) : null}
      <ContentTag className={contentClasses}>{children}</ContentTag>
    </Tag>
  );
}

LiquidGlassDesktop.displayName = "LiquidGlassDesktop";
