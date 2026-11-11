import type { CSSProperties } from "react";
import { SPRING } from "../../utils/springConfig";

const CHROMATIC_DISPERSION =
  "inset 0 1.5px 2px -0.5px var(--color-dispersion-cyan), inset 0 -1.5px 2px -0.5px var(--color-dispersion-amber)";

export const INNER_GLASS_STYLE: CSSProperties = {
  boxShadow: `inset 0 1px 1px rgba(255, 255, 255, 0.18), inset 0 -1px 1px rgba(255, 255, 255, 0.08), inset 0 4px 8px rgba(255, 255, 255, 0.03), ${CHROMATIC_DISPERSION}, 0 4px 12px rgba(0, 0, 0, 0.12)`,
};

export const glassFeel = {
  pointer: {
    grow: 6,
    press: SPRING.glassPress,
    release: SPRING.glassRelease,
  },
  touch: {
    grow: 10,
    press: SPRING.glassTouchPress,
    release: SPRING.glassTouchRelease,
  },
} as const;

// Tilt
export const tilt = {
  referenceWidth: 240,
  maxStrength: 12,
  defaultStrength: 2,
} as const;

// Ripple
export const ripple = {
  maxRadiusMultiplier: 2.2,
  opacityDuration: 0.55,
  initialOpacity: 0.06,
} as const;

// Scale deltas (pixels per side on tap/press)
export const scaleDeltas = {
  tap: { mobile: 2.5, desktop: 4.5 },
} as const;

// Absolute hover growth (pixels per side)
export const hoverDelta = {
  mobile: 1.5,
  desktop: 2.5,
} as const;


