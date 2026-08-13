"use client";

import {
  useState,
  useCallback,
  useMemo,
  type CSSProperties,
  type PointerEvent,
  type MouseEvent,
} from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type MotionStyle,
} from "motion/react";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import { SPRING } from "../../utils/springConfig";

import Ripple from "./Ripple";
import { useRipple } from "./useRipple";
import { type LiquidGlassPropsWithRef, DEFAULT_STYLE } from "./types";
import {
  hoverDelta,
  scaleDeltas,
  scaleVertical,
  tilt as tiltConfig,
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
import { InnerBorderOverlay, SpecularGlowOverlay } from "./LiquidGlassOverlays";

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
  ...rest
}: Readonly<LiquidGlassPropsWithRef>) {
  const prefersReducedMotion = useReducedMotion();
  const isMotionReduced = !!prefersReducedMotion;
  const effectiveMagnetic = magnetic && !isMotionReduced;
  const effectiveTilt = tilt && !isMotionReduced;
  const effectiveSpringScale = springScale && !isMotionReduced;
  const effectiveRipple = ripple && !isMotionReduced;

  const [element, setElement] = useState<HTMLElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 120, height: 36 });

  const rawTilt =
    tiltStrength * (tiltConfig.referenceWidth / Math.max(dimensions.width, 1));
  const effectiveTiltStrength = Math.min(rawTilt, tiltConfig.maxStrength);

  const handleRef = useCallback(
    (node: HTMLElement | null) => {
      setElement(() => node);
      if (node) {
        setDimensions({ width: node.offsetWidth, height: node.offsetHeight });
      }
      assignRef(ref, node);
    },
    [ref],
  );

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const opacity = useMotionValue(0);

  const springX = useSpring(mouseX, SPRING.glassMouse);
  const springY = useSpring(mouseY, SPRING.glassMouse);
  const springOpacity = useSpring(opacity, SPRING.glassOpacity);

  const lagX = useSpring(mouseX, SPRING.glassLag);
  const lagY = useSpring(mouseY, SPRING.glassLag);

  const springPullX = useTransform(springX, (x) =>
    effectiveMagnetic ? x * magneticStrength : 0,
  );
  const springPullY = useTransform(springY, (y) =>
    effectiveMagnetic ? y * magneticStrength : 0,
  );

  const springTiltX = useTransform(springY, (y) => {
    if (!effectiveTilt || !dimensions.height) return 0;
    const halfHeight = dimensions.height / 2;
    const pctY = y / halfHeight;
    return -pctY * effectiveTiltStrength;
  });

  const springTiltY = useTransform(springX, (x) => {
    if (!effectiveTilt || !dimensions.width) return 0;
    const halfWidth = dimensions.width / 2;
    const pctX = x / halfWidth;
    return pctX * effectiveTiltStrength;
  });

  const [isHovered, setIsHovered] = useState(false);

  const {
    rippleX,
    rippleY,
    rippleRadius,
    rippleOpacity,
    onPointerDown: handlePointerDown,
  } = useRipple(interactive && effectiveSpringScale && effectiveRipple);

  const handleMouseEnter = useCallback(() => {
    if (!interactive) return;
    opacity.set(1);
    setIsHovered(true);
  }, [interactive, opacity]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!interactive) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      mouseX.set(x);
      mouseY.set(y);
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

  const handleKeyDown = useKeyboardClick(onClick);

  useResizeObserver(interactive && isHovered ? element : null, (entry) => {
    const el = entry.target;
    if (!(el instanceof HTMLElement)) return;
    setDimensions({
      width: el.offsetWidth,
      height: el.offsetHeight,
    });
  });

  const borderGradient = useTransform([springX, springY], ([x, y]) => {
    return `radial-gradient(180px circle at calc(50% + ${x}px) calc(50% + ${y}px), rgba(255, 255, 255, 0.06) 0%, transparent 80%)`;
  });

  const { borderActiveClasses, baseClasses } = getGlassClasses({
    active,
    as,
    href,
    onClick,
    roundedClass,
    className,
  });

  const innerGlassStyle = useMemo<CSSProperties>(() => {
    const isEffectivelyActive = active || isHovered;
    const baseStyle = getInnerGlassStyle(variant, isEffectivelyActive);
    if (specularGlow && isEffectivelyActive && variant === "flat") {
      const defaultShadow =
        "inset 0 1px 1px rgba(255, 255, 255, 0.25), inset 0 4px 8px rgba(255, 255, 255, 0.03), 0 4px 10px rgba(0, 0, 0, 0.08)";
      return {
        boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.24), inset 0 8px 16px rgba(255, 255, 255, 0.06), ${defaultShadow}`,
      };
    }
    return baseStyle;
  }, [variant, active, isHovered, specularGlow]);

  const tagStyle = useMemo<MotionStyle>(() => {
    return {
      WebkitBackfaceVisibility: "hidden",
      backfaceVisibility: "hidden",
      willChange: style?.willChange ?? "transform, filter, backdrop-filter",
      x: effectiveMagnetic ? springPullX : undefined,
      y: effectiveMagnetic ? springPullY : undefined,
      rotateX: effectiveTilt ? springTiltX : undefined,
      rotateY: effectiveTilt ? springTiltY : undefined,
      transformStyle: effectiveTilt ? "preserve-3d" : undefined,
      transformPerspective: effectiveTilt ? 1000 : undefined,
      ...style,
    };
  }, [
    style,
    effectiveMagnetic,
    springPullX,
    springPullY,
    effectiveTilt,
    springTiltX,
    springTiltY,
  ]);

  const tapDeltaX = scaleDeltas.tap.desktop;
  const tapScaleX = 1 + tapDeltaX / dimensions.width;
  const tapScaleY = scaleVertical.tap.desktop;

  const handlePointerDownWrapper = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      handlePointerDown(e);
    },
    [handlePointerDown],
  );

  const hoverTarget = useMemo(() => {
    const delta = hoverDelta.desktop;
    return {
      scaleX: 1 + (2 * delta) / dimensions.width,
      scaleY: 1 + (2 * delta) / dimensions.height,
    };
  }, [dimensions.width, dimensions.height]);

  const sharedAnimationProps = useMemo(
    () => ({
      whileHover: effectiveSpringScale ? hoverTarget : undefined,
      whileTap: effectiveSpringScale
        ? { scaleX: tapScaleX, scaleY: tapScaleY }
        : undefined,
      transition: effectiveSpringScale ? SCALE_TRANSITION : undefined,
      onMouseEnter: handleMouseEnter,
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
      onPointerDown: handlePointerDownWrapper,
    }),
    [
      effectiveSpringScale,
      hoverTarget,
      tapScaleX,
      tapScaleY,
      handleMouseEnter,
      handleMouseMove,
      handleMouseLeave,
      handlePointerDownWrapper,
    ],
  );

  const { isInline, contentClasses } = getContentTagAndClasses(
    as,
    innerClassName,
  );
  const ContentTag = isInline ? "span" : "div";

  const rendersFullEffects = interactive && !isMotionReduced;
  const rendersRipple = interactive && effectiveSpringScale && effectiveRipple;

  const innerElements = (
    <>
      <InnerBorderOverlay
        borderActiveClasses={borderActiveClasses}
        roundedClass={roundedClass}
        style={innerGlassStyle}
      />
      {rendersFullEffects ? (
        <>
          <SpecularGlowOverlay
            roundedClass={roundedClass}
            springX={springX}
            springY={springY}
            lagX={lagX}
            lagY={lagY}
            springOpacity={springOpacity}
          />

          <motion.span
            className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: borderGradient, mixBlendMode: "overlay" }}
          />
        </>
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
    rest,
  );

  return (
    <Tag ref={handleRef} {...tagProps}>
      {innerElements}
    </Tag>
  );
}

LiquidGlassDesktop.displayName = "LiquidGlassDesktop";
