import type { CSSProperties } from "react";
import { SPRING } from "../../utils/springConfig";

export type LiquidGlassVariant = "flat" | "sunken" | "beveled";

export function getInnerGlassStyle(
  variant: LiquidGlassVariant = "flat",
  active = false,
): CSSProperties {
  if (variant === "sunken") {
    return {
      boxShadow: active
        ? "inset 0 3px 8px rgba(0, 0, 0, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.12), 0 4px 12px rgba(0, 0, 0, 0.2)"
        : "inset 0 2px 5px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 1px 2px rgba(255, 255, 255, 0.02)",
    };
  }
  if (variant === "beveled") {
    return {
      boxShadow: active
        ? "inset 0 1px 2px rgba(255, 255, 255, 0.4), inset 0 6px 12px rgba(255, 255, 255, 0.06), 0 8px 16px rgba(0, 0, 0, 0.15)"
        : "inset 0 1px 1px rgba(255, 255, 255, 0.25), inset 0 4px 8px rgba(255, 255, 255, 0.03), 0 4px 10px rgba(0, 0, 0, 0.08)",
    };
  }
  return {
    boxShadow:
      "inset 0 1px 1px rgba(255, 255, 255, 0.25), inset 0 4px 8px rgba(255, 255, 255, 0.03), 0 4px 10px rgba(0, 0, 0, 0.08)",
  };
}

// Spring presets — used by animate() and transition props
export const springs = {
  scale: SPRING.glassScale,
  ripple: SPRING.glassRipple,
} as const;

// Tilt
export const tilt = {
  referenceWidth: 240,
  maxStrength: 12,
} as const;

// Ripple
export const ripple = {
  maxRadiusMultiplier: 2.2,
  opacityDuration: 0.55,
  initialOpacity: 0.06,
} as const;

// Scale deltas (absolute pixel growth)
export const scaleDeltas = {
  tap: { mobile: 4, desktop: 8 },
} as const;

// Absolute hover growth (pixels per side)
export const hoverDelta = {
  mobile: 1.5,
  desktop: 2.5,
} as const;

// Vertical scale factors
export const scaleVertical = {
  tap: { mobile: 0.98, desktop: 0.96 },
} as const;
