/** Standardized easing curves for consistent motion */
export const EASE = {
  /** Responsive ease-out curve for UI entrances (350ms) */
  out: [0.16, 1, 0.3, 1] as const,
  /** Immediate accelerated curve for UI exits (160ms) */
  exit: [0.4, 0, 1, 1] as const,
  /** Smooth in-out curve for continuous animations */
  inOut: [0.45, 0, 0.55, 1] as const,
} as const;

/** Standardized spring configs for consistent motion across all components */
export const SPRING = {
  /** Highlight pill sliding between nav/tab items */
  highlight: {
    type: "spring" as const,
    stiffness: 380,
    damping: 24,
    mass: 0.6,
  },
  /** Micro-interactions like accordion chevrons, toggles & layout morphs */
  snappy: {
    type: "spring" as const,
    stiffness: 480,
    damping: 32,
    mass: 0.5,
  },
  /** Drawers sliding in from edge (Smooth 350ms physical spring) */
  drawer: {
    type: "spring" as const,
    duration: 0.35,
    bounce: 0.08,
    restDelta: 0.5,
  },
  /** Modals scaling in (Smooth 350ms physical spring) */
  modal: {
    type: "spring" as const,
    duration: 0.35,
    bounce: 0.08,
    restDelta: 0.005,
  },
  /** Responsive interruptible exit spring for modals, drawers & backdrops */
  exit: {
    type: "spring" as const,
    duration: 0.22,
    bounce: 0,
    restDelta: 0.005,
  },
  /** Hero elements & scroll indicator */
  hero: {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
  },
  /** Navbar hamburger morphing */
  snappyMenu: {
    type: "spring" as const,
    duration: 0.3,
    bounce: 0,
  },
  /** LiquidGlass scale & ripple physics */
  glassScale: {
    type: "spring" as const,
    stiffness: 400,
    damping: 15,
    mass: 0.6,
  },
  glassRipple: {
    type: "spring" as const,
    stiffness: 85,
    damping: 14,
    mass: 0.5,
  },
  /** LiquidGlass mouse tracking physics for useSpring hooks */
  glassMouse: {
    damping: 28,
    stiffness: 180,
    mass: 0.6,
  },
  glassOpacity: {
    damping: 20,
    stiffness: 120,
  },
  glassLag: {
    damping: 38,
    stiffness: 110,
    mass: 1.0,
  },
  /** Mobile swipe initial entrance nudge */
  nudge: {
    type: "spring" as const,
    stiffness: 320,
    damping: 18,
    mass: 0.8,
  },
  /** Process model diagram & stage crossfade transition */
  stage: {
    type: "spring" as const,
    duration: 0.45,
    bounce: 0.04,
    restDelta: 0.005,
  },
  stageExit: {
    type: "spring" as const,
    duration: 0.32,
    bounce: 0,
    restDelta: 0.005,
  },
} as const;
