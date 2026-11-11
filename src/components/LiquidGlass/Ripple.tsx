import { memo } from "react";
import { motion, type MotionValue } from "motion/react";

interface RippleProps {
  rippleX: MotionValue<number>;
  rippleY: MotionValue<number>;
  rippleScale: MotionValue<number>;
  rippleOpacity: MotionValue<number>;
  rippleScaleX?: MotionValue<number>;
  rippleScaleY?: MotionValue<number>;
}

// memoize Ripple to prevent unnecessary virtual DOM reconstruction when parent scale/dimensions re-render
function Ripple({
  rippleX,
  rippleY,
  rippleScale,
  rippleOpacity,
  rippleScaleX,
  rippleScaleY,
}: Readonly<RippleProps>) {
  return (
    <motion.span
      className="pointer-events-none absolute z-10 size-24 rounded-full bg-white blur-subtle mix-blend-screen"
      style={
        rippleScaleX && rippleScaleY
          ? {
              left: rippleX,
              top: rippleY,
              scaleX: rippleScaleX,
              scaleY: rippleScaleY,
              x: "-50%",
              y: "-50%",
              opacity: rippleOpacity,
            }
          : {
              left: rippleX,
              top: rippleY,
              scale: rippleScale,
              x: "-50%",
              y: "-50%",
              opacity: rippleOpacity,
            }
      }
    />
  );
}

Ripple.displayName = "Ripple";

export default memo(Ripple);
