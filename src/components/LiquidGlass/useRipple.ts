import { useCallback, type PointerEvent } from "react";
import { useMotionValue, animate } from "motion/react";
import { SPRING } from "../../utils/springConfig";
import { ripple as rippleCfg } from "./config";

export function useRipple(enabled: boolean) {
  const rippleX = useMotionValue(0);
  const rippleY = useMotionValue(0);
  const rippleScale = useMotionValue(0);
  const rippleOpacity = useMotionValue(0);

  const triggerAt = useCallback(
    (x: number, y: number, width: number, height: number) => {
      if (!enabled) return;

      rippleX.set(x);
      rippleY.set(y);

      const maxRadius =
        Math.max(width, height) * rippleCfg.maxRadiusMultiplier;
      const targetScale = maxRadius / 96;

      animate(rippleScale, [0, targetScale], SPRING.glassRipple);

      animate(rippleOpacity, [rippleCfg.initialOpacity, 0], {
        duration: rippleCfg.opacityDuration,
        ease: "easeOut",
      });
    },
    [enabled, rippleX, rippleY, rippleScale, rippleOpacity],
  );

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!enabled) return;

      const rect = e.currentTarget.getBoundingClientRect();
      triggerAt(
        e.clientX - rect.left,
        e.clientY - rect.top,
        rect.width,
        rect.height,
      );
    },
    [enabled, triggerAt],
  );

  return {
    rippleX,
    rippleY,
    rippleScale,
    rippleOpacity,
    onPointerDown: handlePointerDown,
    triggerAt,
  };
}
