import { SPRING } from "../../utils/springConfig";

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
