"use client";

import {
  useMemo,
  useCallback,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  motion,
  useReducedMotion,
  useTransform,
  type MotionStyle,
  type MotionValue,
} from "motion/react";

import Ripple from "./Ripple";
import { useRipple } from "./useRipple";
import { useLiquidGlassPhysics } from "./useLiquidGlassPhysics";
import {
  type InteractiveGlassPropsWithRef,
  type InteractiveGlassProps,
  DEFAULT_STYLE,
} from "./types";
import {
  hoverDelta,
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
  variant: InteractiveGlassProps["variant"],
  isActive: boolean,
  specularGlow: boolean,
): CSSProperties {
  const baseStyle = getInnerGlassStyle(variant, isActive);
  if (specularGlow && isActive && variant === "flat") {
    return {
      boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.24), inset 0 8px 16px rgba(255, 255, 255, 0.06), ${baseStyle.boxShadow ?? ""}`,
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
  springScaleX: MotionValue<number>,
  springScaleY: MotionValue<number>,
): MotionStyle {
  const hasTransform =
    effectiveMagnetic || effectiveTilt || effectiveSpringScale;
  return {
    WebkitBackfaceVisibility: hasTransform ? "hidden" : undefined,
    backfaceVisibility: hasTransform ? "hidden" : undefined,
    willChange: style?.willChange ?? (hasTransform ? "transform" : undefined),
    x: effectiveMagnetic ? springPullX : undefined,
    y: effectiveMagnetic ? springPullY : undefined,
    scaleX: effectiveSpringScale ? springScaleX : undefined,
    scaleY: effectiveSpringScale ? springScaleY : undefined,
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
      transition: undefined,
    };
  }

  const delta = hoverDelta.desktop;

  return {
    whileHover: {
      scaleX: 1 + (2 * delta) / dimensions.width,
      scaleY: 1 + (2 * delta) / dimensions.height,
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
}: Readonly<InteractiveGlassPropsWithRef>) {
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
    interactive: true,
    effectiveMagnetic,
    effectiveTilt,
    magneticStrength,
    tiltStrength,
  });

  const {
    setElementRef,
    handlePointerDown: physicsHandlePointerDown,
    handleMouseEnter,
    handleMouseMove,
    handleMouseLeave,
    shouldSuppressClick,
  } = physics;

  const handleRef = useCallback(
    (node: HTMLElement | null) => {
      setElementRef(node);
      assignRef(ref, node);
    },
    [ref, setElementRef],
  );

  const rendersRipple = effectiveSpringScale && effectiveRipple;
  const {
    rippleX,
    rippleY,
    rippleScale,
    rippleOpacity,
    onPointerDown: handleRipplePointerDown,
  } = useRipple(rendersRipple);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      handleRipplePointerDown(e);
      physicsHandlePointerDown(e);
    },
    [handleRipplePointerDown, physicsHandlePointerDown],
  );

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
    () => computeInnerGlassStyle(variant, active, specularGlow),
    [variant, active, specularGlow],
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
        physics.springScaleX,
        physics.springScaleY,
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
      physics.springScaleX,
      physics.springScaleY,
    ],
  );

  const scaleAnimationProps = useMemo(
    () => getScaleAnimationProps(effectiveSpringScale, physics.dimensions),
    [effectiveSpringScale, physics.dimensions],
  );

  const sharedAnimationProps = useMemo(
    () => ({
      ...scaleAnimationProps,
      onMouseEnter: handleMouseEnter,
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
      onPointerDown: handlePointerDown,
    }),
    [
      scaleAnimationProps,
      handleMouseEnter,
      handleMouseMove,
      handleMouseLeave,
      handlePointerDown,
    ],
  );

  const { isInline, contentClasses } = getContentTagAndClasses(
    href ? "a" : as,
    innerClassName,
  );
  const ContentTag = isInline ? "span" : "div";

  const rendersFullEffects = !isMotionReduced;
  const Tag = href ? motion.a : (TAG_MAP[as] ?? motion.div);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (shouldSuppressClick()) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (typeof onClick === "function") {
        (onClick as (event: React.MouseEvent<HTMLElement>) => void)(e);
      }
    },
    [onClick, shouldSuppressClick],
  );

  const handleClickCapture = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (shouldSuppressClick()) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [shouldSuppressClick],
  );

  const tagProps = setupTagProps(
    href,
    as,
    download,
    target,
    rel,
    handleClick,
    handleKeyDown,
    baseClasses,
    tagStyle,
    ariaLabel,
    sharedAnimationProps,
    domProps,
  );

  const reactiveBoxShadow = useTransform(() => {
    const x = physics.springPullX.get();
    const y = physics.springPullY.get();
    const normX = Math.max(-1, Math.min(1, x / 8));
    const normY = Math.max(-1, Math.min(1, y / 8));
    const ix = (-normX * 1.5).toFixed(2);
    const iy = (-normY * 1.5).toFixed(2);
    return `inset ${ix}px ${iy}px 2px oklch(100% 0 0 / 0.18), inset ${ix}px ${iy}px 6px oklch(100% 0 0 / 0.08)`;
  });

  return (
    <Tag ref={handleRef} onClickCapture={handleClickCapture} {...tagProps}>
      {rendersFullEffects ? (
        <DesktopEffectsOverlay
          roundedClass={roundedClass}
          boxShadow={reactiveBoxShadow}
          opacity={physics.sheenOpacity}
        />
      ) : null}
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
    </Tag>
  );
}

LiquidGlassDesktop.displayName = "LiquidGlassDesktop";
