import { memo, type CSSProperties } from "react";
import { motion, type MotionValue, type Transition } from "motion/react";
import Ripple from "./Ripple";
import { CAPSULE_HIGHLIGHT_RADIUS } from "./liquidGlassUtils";
import type { TabVariant } from "./types";

interface TabHighlightProps {
  layoutId: string;
  layoutTransition: Transition;
  outerHighlightClass: string;
  outerHighlightStyle: CSSProperties;
  scaleX: MotionValue<number>;
  scaleY: MotionValue<number>;
  innerHighlightClass: string;
  willChange: boolean;
  ripple: boolean;
  rippleX: MotionValue<number>;
  rippleY: MotionValue<number>;
  rippleScale: MotionValue<number>;
  rippleOpacity: MotionValue<number>;
  variant: TabVariant;
  onLayoutAnimationComplete?: () => void;
}

const SEGMENTED_HIGHLIGHT_RADIUS =
  "calc((var(--base-radius) + max(0px, var(--pill-h, 36px) * (var(--scale-y) - 1) / 2)) / var(--scale-x)) / calc((var(--base-radius) + max(0px, var(--pill-h, 36px) * (var(--scale-y) - 1) / 2)) / var(--scale-y))";

export const TabHighlight = memo(function TabHighlight({
  layoutId,
  layoutTransition,
  outerHighlightClass,
  outerHighlightStyle,
  scaleX,
  scaleY,
  innerHighlightClass,
  willChange,
  ripple,
  rippleX,
  rippleY,
  rippleScale,
  rippleOpacity,
  variant,
  onLayoutAnimationComplete,
}: Readonly<TabHighlightProps>) {
  return (
    <motion.span
      layoutId={layoutId}
      initial={false}
      className={outerHighlightClass}
      style={outerHighlightStyle}
      transition={layoutTransition}
      onLayoutAnimationComplete={onLayoutAnimationComplete}
    >
      <motion.span
        className={innerHighlightClass}
        style={
          {
            "--scale-x": scaleX,
            "--scale-y": scaleY,
            scaleX,
            scaleY,
            borderRadius:
              variant === "segmented"
                ? SEGMENTED_HIGHLIGHT_RADIUS
                : CAPSULE_HIGHLIGHT_RADIUS,
            transformOrigin: "center center",
            willChange: willChange ? "transform" : "auto",
          } as unknown as CSSProperties
        }
      >
        {ripple ? (
          <Ripple
            rippleX={rippleX}
            rippleY={rippleY}
            rippleScale={rippleScale}
            rippleOpacity={rippleOpacity}
          />
        ) : null}
      </motion.span>
    </motion.span>
  );
});
TabHighlight.displayName = "TabHighlight";
