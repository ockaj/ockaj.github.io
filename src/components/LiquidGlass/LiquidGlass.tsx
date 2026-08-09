"use client";

import {
  useRef,
  useState,
  useCallback,
  useMemo,
  memo,
  type CSSProperties,
  type PointerEvent,
  type MouseEvent,
  type KeyboardEvent,
  type MutableRefObject,
  type MouseEventHandler,
  type Ref,
  type ElementType,
} from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type MotionStyle,
  type MotionValue,
} from "motion/react";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import { cn } from "../../utils/cn";
import { SPRING } from "../../utils/springConfig";

import Ripple from "./Ripple";
import { useRipple } from "./useRipple";
import LiquidGlassStatic from "./LiquidGlassStatic";
import {
  type LiquidGlassProps,
  type LiquidGlassButtonProps,
  type LiquidGlassPropsWithRef,
  type LiquidGlassTagProps,
  DEFAULT_STYLE,
} from "./types";
import {
  hoverDelta,
  scaleDeltas,
  scaleVertical,
  springs,
  tilt as tiltConfig,
  getInnerGlassStyle,
} from "./config";

const SCALE_TRANSITION = {
  scaleX: springs.scale,
  scaleY: springs.scale,
} as const;

const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
};

function useKeyboardClick(onClick?: (e: MouseEvent<HTMLElement>) => void) {
  return useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if ((e.key === "Enter" || e.key === " ") && onClick) {
        e.preventDefault();
        onClick(e as unknown as MouseEvent<HTMLElement>);
      }
    },
    [onClick],
  );
}

function getGlassClasses({
  active = false,
  as = "div",
  href,
  onClick,
  roundedClass = "rounded-full",
  className = "",
}: {
  active?: boolean;
  as?: string;
  href?: string;
  onClick?: unknown;
  roundedClass?: string;
  className?: string;
}) {
  const borderActiveClasses = active
    ? "border-white/[0.15] bg-white/[0.04]"
    : "border-white/[0.04] group-hover:border-white/[0.08] bg-white/[0.015] group-hover:bg-white/[0.03]";

  const cursorAndFocusClasses =
    as === "button" || href || onClick
      ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      : "cursor-default";

  const baseClasses = cn(
    "group relative inline-flex items-center justify-center backdrop-blur-sm md:backdrop-blur-lg text-text-primary select-none overflow-hidden",
    cursorAndFocusClasses,
    roundedClass,
    className,
  );

  return { borderActiveClasses, baseClasses };
}

function InnerBorderOverlay({
  borderActiveClasses,
  roundedClass,
  style,
}: {
  borderActiveClasses: string;
  roundedClass: string;
  style: CSSProperties;
}) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute inset-0 z-0 border transition-[border-color,background-color,box-shadow] duration-300 ease-out",
        borderActiveClasses,
        roundedClass,
      )}
      style={style}
    />
  );
}

function SpecularGlowOverlay({
  roundedClass,
  springX,
  springY,
  lagX,
  lagY,
  springOpacity,
}: {
  roundedClass: string;
  springX: MotionValue<number>;
  springY: MotionValue<number>;
  lagX: MotionValue<number>;
  lagY: MotionValue<number>;
  springOpacity: MotionValue<number>;
}) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        roundedClass,
      )}
    >
      <motion.span
        className="pointer-events-none absolute -mt-24 -ml-24 size-48 rounded-full bg-gradient-to-r from-[#7A7BBF]/6 to-[#6667AB]/6 mix-blend-screen blur-2xl"
        style={{
          x: springX,
          y: springY,
          opacity: springOpacity,
          left: "50%",
          top: "50%",
        }}
      />
      <motion.span
        className="pointer-events-none absolute -mt-16 -ml-16 size-32 rounded-full bg-gradient-to-r from-[#F26B5B]/3 to-[#926AA6]/3 mix-blend-screen blur-xl"
        style={{
          x: lagX,
          y: lagY,
          opacity: springOpacity,
          left: "50%",
          top: "50%",
        }}
      />
    </span>
  );
}

function LiquidGlassMobile(props: LiquidGlassPropsWithRef) {
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
    ref,
    ...rest
  } = props;

  const domProps = omit(rest, [
    "magnetic",
    "tilt",
    "magneticStrength",
    "tiltStrength",
  ]);

  const prefersReducedMotion = useReducedMotion();
  const isMotionReduced = !!prefersReducedMotion;
  const effectiveSpringScale = springScale && !isMotionReduced;
  const effectiveRipple = ripple && !isMotionReduced;

  const localRef = useRef<HTMLElement | null>(null);
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [width, setWidth] = useState(120);

  const handleRef = useCallback(
    (node: HTMLElement | null) => {
      localRef.current = node;
      setElement(() => node);
      if (node) {
        setWidth(node.offsetWidth);
      }
      if (!ref) return;
      if (typeof ref === "function") {
        ref(node);
      } else {
        (ref as MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    [ref],
  );

  // useResizeObserver prevents layout thrashing during interactions
  useResizeObserver(element, (entry) => {
    const el = entry.target;
    if (!(el instanceof HTMLElement)) return;
    setWidth(el.offsetWidth);
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

  const ContentTag =
    as === "a" || as === "button" || as === "span" ? "span" : "div";
  const contentClasses = cn(
    "relative z-30 w-full h-full",
    (as === "a" || as === "button" || as === "span") &&
      "flex items-center justify-center gap-2 font-semibold",
    innerClassName,
  );

  const innerElements = (
    <>
      <InnerBorderOverlay
        borderActiveClasses={borderActiveClasses}
        roundedClass={roundedClass}
        style={innerGlassStyle}
      />
      {interactive ? (
        effectiveSpringScale && effectiveRipple ? (
          <Ripple
            rippleX={rippleX}
            rippleY={rippleY}
            rippleRadius={rippleRadius}
            rippleOpacity={rippleOpacity}
          />
        ) : null
      ) : null}

      <ContentTag className={contentClasses}>{children}</ContentTag>
    </>
  );

  const Tag = href
    ? motion.a
    : as === "button"
      ? motion.button
      : (motion as unknown as Record<string, ElementType>)[as];

  const tagProps: LiquidGlassTagProps = {
    className: baseClasses,
    style: tagStyle,
    "aria-label": ariaLabel,
    ...sharedAnimationProps,
    ...domProps,
  };

  if (href) {
    tagProps.href = href;
    tagProps.download = download;
    tagProps.target = target;
    tagProps.rel = rel;
    tagProps.onClick = onClick as MouseEventHandler<HTMLAnchorElement>;
  } else if (as === "button") {
    tagProps.type = "button";
    tagProps.onClick = onClick as MouseEventHandler<HTMLButtonElement>;
  } else if (onClick) {
    tagProps.onClick = onClick;
    if (as !== "a" && (as as string) !== "button") {
      tagProps.tabIndex = 0;
      tagProps.onKeyDown = handleKeyDown;
      tagProps.role = "button";
    }
  }

  return (
    <Tag ref={handleRef} {...tagProps}>
      {innerElements}
    </Tag>
  );
}

LiquidGlassMobile.displayName = "LiquidGlassMobile";

function LiquidGlassDesktop({
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
}: LiquidGlassPropsWithRef) {
  const prefersReducedMotion = useReducedMotion();
  const isMotionReduced = !!prefersReducedMotion;
  const effectiveMagnetic = magnetic && !isMotionReduced;
  const effectiveTilt = tilt && !isMotionReduced;
  const effectiveSpringScale = springScale && !isMotionReduced;
  const effectiveRipple = ripple && !isMotionReduced;

  const localRef = useRef<HTMLElement | null>(null);
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 120, height: 36 });

  const rawTilt =
    tiltStrength * (tiltConfig.referenceWidth / Math.max(dimensions.width, 1));
  const effectiveTiltStrength = Math.min(rawTilt, tiltConfig.maxStrength);

  const handleRef = useCallback(
    (node: HTMLElement | null) => {
      localRef.current = node;
      setElement(() => node);
      if (node) {
        setDimensions({ width: node.offsetWidth, height: node.offsetHeight });
      }
      if (!ref) return;
      if (typeof ref === "function") {
        ref(node);
      } else {
        (ref as MutableRefObject<HTMLElement | null>).current = node;
      }
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

  const rectRef = useRef<DOMRect | null>(null);

  const springPullX = useTransform(springX, (x) =>
    effectiveMagnetic ? x * magneticStrength : 0,
  );
  const springPullY = useTransform(springY, (y) =>
    effectiveMagnetic ? y * magneticStrength : 0,
  );

  const springTiltX = useTransform(springY, (y) => {
    if (!effectiveTilt || !rectRef.current) return 0;
    const halfHeight = rectRef.current.height / 2;
    const pctY = y / halfHeight;
    return -pctY * effectiveTiltStrength;
  });

  const springTiltY = useTransform(springX, (x) => {
    if (!effectiveTilt || !rectRef.current) return 0;
    const halfWidth = rectRef.current.width / 2;
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

  const updateRect = useCallback(() => {
    if (localRef.current) {
      rectRef.current = localRef.current.getBoundingClientRect();
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!interactive) return;
    updateRect();
    opacity.set(1);
    setIsHovered(true);
  }, [interactive, updateRect, opacity]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!interactive) return;
      if (!rectRef.current) {
        updateRect();
      }
      const currentRect = rectRef.current;
      if (!currentRect) return;

      const x = e.clientX - currentRect.left - currentRect.width / 2;
      const y = e.clientY - currentRect.top - currentRect.height / 2;
      mouseX.set(x);
      mouseY.set(y);
    },
    [interactive, updateRect, mouseX, mouseY],
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
    updateRect();
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

  const ContentTag =
    as === "a" || as === "button" || as === "span" ? "span" : "div";
  const contentClasses = cn(
    "relative z-30 w-full h-full",
    (as === "a" || as === "button" || as === "span") &&
      "flex items-center justify-center gap-2 font-semibold",
    innerClassName,
  );

  const innerElements = (
    <>
      <InnerBorderOverlay
        borderActiveClasses={borderActiveClasses}
        roundedClass={roundedClass}
        style={innerGlassStyle}
      />
      {interactive && !isMotionReduced ? (
        <>
          <SpecularGlowOverlay
            roundedClass={roundedClass}
            springX={springX}
            springY={springY}
            lagX={lagX}
            lagY={lagY}
            springOpacity={springOpacity}
          />

          {effectiveSpringScale && effectiveRipple ? (
            <Ripple
              rippleX={rippleX}
              rippleY={rippleY}
              rippleRadius={rippleRadius}
              rippleOpacity={rippleOpacity}
            />
          ) : null}

          <motion.span
            className={cn(
              "pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
              roundedClass,
            )}
            style={{ background: borderGradient, mixBlendMode: "overlay" }}
          />
        </>
      ) : interactive && isMotionReduced ? (
        effectiveSpringScale && effectiveRipple ? (
          <Ripple
            rippleX={rippleX}
            rippleY={rippleY}
            rippleRadius={rippleRadius}
            rippleOpacity={rippleOpacity}
          />
        ) : null
      ) : null}

      <ContentTag className={contentClasses}>{children}</ContentTag>
    </>
  );

  const Tag = href
    ? motion.a
    : as === "button"
      ? motion.button
      : (motion as unknown as Record<string, ElementType>)[as];

  const tagProps: LiquidGlassTagProps = {
    className: baseClasses,
    style: tagStyle,
    "aria-label": ariaLabel,
    ...sharedAnimationProps,
    ...rest,
  };

  if (href) {
    tagProps.href = href;
    tagProps.download = download;
    tagProps.target = target;
    tagProps.rel = rel;
    tagProps.onClick = onClick as MouseEventHandler<HTMLAnchorElement>;
  } else if (as === "button") {
    tagProps.type = "button";
    tagProps.onClick = onClick as MouseEventHandler<HTMLButtonElement>;
  } else if (onClick) {
    tagProps.onClick = onClick;
    if (as !== "a" && (as as string) !== "button") {
      tagProps.tabIndex = 0;
      tagProps.onKeyDown = handleKeyDown;
      tagProps.role = "button";
    }
  }

  return (
    <Tag ref={handleRef} {...tagProps}>
      {innerElements}
    </Tag>
  );
}

LiquidGlassDesktop.displayName = "LiquidGlassDesktop";

const LiquidGlass = memo(function LiquidGlass({
  ref,
  ...props
}: LiquidGlassProps & { ref?: Ref<HTMLElement | null> }) {
  const isMobile = useIsMobile();
  const isInteractive = props.interactive ?? true;

  if (!isInteractive) {
    return <LiquidGlassStatic ref={ref} {...props} />;
  }

  if (isMobile) {
    return <LiquidGlassMobile ref={ref} {...props} />;
  }
  return <LiquidGlassDesktop ref={ref} {...props} />;
});

LiquidGlass.displayName = "LiquidGlass";

interface LiquidGlassButtonPropsWithRef extends LiquidGlassButtonProps {
  ref?: Ref<HTMLElement | null>;
}

function LiquidGlassButtonComponent({
  children,
  onClick,
  className = "",
  href,
  download,
  target,
  rel,
  ariaLabel,
  magnetic,
  tilt,
  magneticStrength,
  tiltStrength,
  ref,
  ...rest
}: LiquidGlassButtonPropsWithRef) {
  return (
    <LiquidGlass
      ref={ref}
      as={href ? "a" : "button"}
      href={href}
      download={download}
      target={target}
      rel={rel}
      onClick={onClick}
      className={className}
      ariaLabel={ariaLabel}
      springScale
      magnetic={magnetic}
      tilt={tilt}
      magneticStrength={magneticStrength}
      tiltStrength={tiltStrength}
      {...rest}
    >
      {children}
    </LiquidGlass>
  );
}

LiquidGlassButtonComponent.displayName = "LiquidGlassButtonComponent";

const LiquidGlassButton = memo(LiquidGlassButtonComponent);
LiquidGlassButton.displayName = "LiquidGlassButton";

export { LiquidGlass, LiquidGlassButton };
