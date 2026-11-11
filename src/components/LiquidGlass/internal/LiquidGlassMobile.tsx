import { useRef, useMemo, useCallback, useLayoutEffect } from "react";
import {
  animate,
  motion,
  useComposedRefs,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControlsWithThen,
  type MotionStyle,
} from "motion/react";
import { useResizeObserver } from "../../../hooks/useResizeObserver";

import Ripple from "./Ripple";
import { useRipple } from "./useRipple";
import { type InteractiveGlassPropsWithRef, DEFAULT_STYLE } from "./types";
import { glassFeel } from "./config";
import {
  TAP_PRESS_TRANSITION,
  TAP_RELEASE_TRANSITION,
  SEMANTIC_CONTAINERS,
  useKeyboardClick,
  TAG_MAP,
  resolveGlassSurfaceProps,
  getEntryDimensions,
  computeGlisseBaseScale,
} from "./liquidGlassUtils";
import { InnerBorderOverlay } from "./LiquidGlassOverlays";

type LiquidGlassMobileProps = Omit<
  InteractiveGlassPropsWithRef,
  "magnetic" | "tilt" | "magneticStrength"
>;

function useMobileTapScale(
  elementRef: React.RefObject<HTMLElement | null>,
  enableTapGestures: boolean,
) {
  const dimensionsRef = useRef({ width: 120, height: 36 });
  const isTappingRef = useRef(false);
  const animationsRef = useRef<{
    x: AnimationPlaybackControlsWithThen | null;
    y: AnimationPlaybackControlsWithThen | null;
  }>({ x: null, y: null });

  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  const tapWillChange = useMotionValue<"auto" | "transform">("auto");

  useResizeObserver(enableTapGestures ? elementRef : null, (entry) => {
    const { width: newWidth, height: newHeight } = getEntryDimensions(entry);
    if (newWidth > 0 && newHeight > 0) {
      dimensionsRef.current.width = newWidth;
      dimensionsRef.current.height = newHeight;
    }
  });

  const stopScaleAnimations = useCallback(() => {
    animationsRef.current.x?.stop();
    animationsRef.current.y?.stop();
    animationsRef.current.x = null;
    animationsRef.current.y = null;
  }, []);

  useLayoutEffect(() => {
    if (!enableTapGestures) {
      isTappingRef.current = false;
      stopScaleAnimations();
      scaleX.set(1);
      scaleY.set(1);
      tapWillChange.set("auto");
    }
    return () => {
      stopScaleAnimations();
    };
  }, [enableTapGestures, scaleX, scaleY, stopScaleAnimations, tapWillChange]);

  const handleTapStart = useCallback(() => {
    isTappingRef.current = true;
    tapWillChange.set("transform");
    stopScaleAnimations();
    const tapScale = computeGlisseBaseScale(
      dimensionsRef.current.width,
      dimensionsRef.current.height,
      glassFeel.touch.grow,
    );
    animationsRef.current.x = animate(
      scaleX,
      tapScale,
      TAP_PRESS_TRANSITION.scaleX,
    );
    animationsRef.current.y = animate(
      scaleY,
      tapScale,
      TAP_PRESS_TRANSITION.scaleY,
    );
  }, [scaleX, scaleY, stopScaleAnimations, tapWillChange]);

  const handleTapEnd = useCallback(() => {
    isTappingRef.current = false;
    stopScaleAnimations();
    animationsRef.current.x = animate(scaleX, 1, {
      ...TAP_RELEASE_TRANSITION.scaleX,
      onComplete: () => {
        if (!isTappingRef.current) {
          tapWillChange.set("auto");
        }
      },
    });
    animationsRef.current.y = animate(
      scaleY,
      1,
      TAP_RELEASE_TRANSITION.scaleY,
    );
  }, [scaleX, scaleY, stopScaleAnimations, tapWillChange]);

  return {
    scaleX,
    scaleY,
    tapWillChange,
    handleTapStart,
    handleTapEnd,
  };
}

export default function LiquidGlassMobile(
  props: Readonly<LiquidGlassMobileProps>,
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
    ref,
    ...domProps
  } = props;

  const prefersReducedMotion = useReducedMotion();
  const isMotionReduced = !!prefersReducedMotion;
  const effectiveSpringScale = springScale && !isMotionReduced;
  const isDisabled = Boolean(
    domProps.disabled ||
      domProps["aria-disabled"] === true ||
      domProps["aria-disabled"] === "true",
  );
  const enableTapGestures =
    effectiveSpringScale && !isDisabled && !SEMANTIC_CONTAINERS.has(as);

  const elementRef = useRef<HTMLElement | null>(null);
  const handleRef = useComposedRefs(elementRef, ref);

  const { scaleX, scaleY, tapWillChange, handleTapStart, handleTapEnd } =
    useMobileTapScale(elementRef, enableTapGestures);

  const rendersRipple = effectiveSpringScale && !isDisabled;

  const {
    rippleX,
    rippleY,
    rippleScale,
    rippleOpacity,
    onPointerDown: handlePointerDown,
  } = useRipple(rendersRipple);

  const handleKeyDown = useKeyboardClick(onClick);

  const tagStyle = useMemo<MotionStyle>(() => {
    return {
      WebkitBackfaceVisibility: enableTapGestures ? "hidden" : undefined,
      backfaceVisibility: enableTapGestures ? "hidden" : undefined,
      willChange:
        style?.willChange ?? (enableTapGestures ? tapWillChange : undefined),
      scaleX: enableTapGestures ? scaleX : undefined,
      scaleY: enableTapGestures ? scaleY : undefined,
      ...style,
    };
  }, [enableTapGestures, scaleX, scaleY, style, tapWillChange]);

  const sharedAnimationProps = useMemo(
    () => ({
      onTapStart: enableTapGestures ? handleTapStart : undefined,
      onTap: enableTapGestures ? handleTapEnd : undefined,
      onTapCancel: enableTapGestures ? handleTapEnd : undefined,
      onPointerDown: rendersRipple ? handlePointerDown : undefined,
    }),
    [
      enableTapGestures,
      handlePointerDown,
      handleTapEnd,
      handleTapStart,
      rendersRipple,
    ],
  );

  const {
    isInline,
    tagProps,
    contentClasses,
    borderActiveClasses,
    innerGlassStyle,
  } = resolveGlassSurfaceProps({
    as,
    href,
    download,
    target,
    rel,
    ariaLabel,
    onClick,
    onKeyDown: handleKeyDown,
    className,
    innerClassName,
    roundedClass,
    tagStyle,
    animationProps: sharedAnimationProps,
    domProps,
  });

  const ContentTag = isInline ? "span" : "div";
  const Tag = href ? motion.a : (TAG_MAP[as] ?? motion.div);

  return (
    <Tag ref={handleRef} {...tagProps}>
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

LiquidGlassMobile.displayName = "LiquidGlassMobile";
