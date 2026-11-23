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
    stiffness: 640,
    damping: 42,
    mass: 0.7,
    restDelta: 0.001,
  },
  /** Critically damped spring for smooth tab width morphing during drag */
  dragWidth: {
    type: "spring" as const,
    stiffness: 600,
    damping: 34.5,
    mass: 0.5,
    restDelta: 0.01,
  },
  /** Drag stretch & fluid blob relaxation when pointer motion stops (Apple Design fluid blob) */
  fluidDragStretch: {
    type: "spring" as const,
    stiffness: 280,
    damping: 28,
    mass: 0.9,
    restDelta: 0.001,
  },
  /** Highlight pill wall collision damped harmonic snap-back recoil (iOS SwiftUI .snappy 300/30) */
  pillWallRecoil: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
    mass: 1,
    restDelta: 0.001,
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
  /** Out-of-phase tab hover wobble (X leads faster, Y follows softer) */
  glassHoverX: {
    type: "spring" as const,
    stiffness: 174,
    damping: 8.6,
    mass: 0.6,
  },
  glassHoverY: {
    type: "spring" as const,
    stiffness: 86,
    damping: 4.9,
    mass: 0.6,
  },
  glassRipple: {
    type: "spring" as const,
    stiffness: 85,
    damping: 14,
    mass: 0.5,
  },
  /** LiquidGlass dual-stage hold & recoil physics */
  glassPress: {
    stiffness: 417.6,
    damping: 29.2,
    mass: 0.6,
  },
  glassRelease: {
    stiffness: 230,
    damping: 14.5,
    mass: 0.6,
  },
  glassReleaseY: {
    stiffness: 150,
    damping: 10.5,
    mass: 0.6,
  },
  glassTouchPress: {
    stiffness: 515,
    damping: 27.3,
    mass: 0.6,
  },
  glassTouchRelease: {
    stiffness: 250,
    damping: 11.8,
    mass: 0.6,
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
    duration: 0.36,
    bounce: 0,
    restDelta: 0.001,
  },
  stageExit: {
    type: "spring" as const,
    duration: 0.24,
    bounce: 0,
    restDelta: 0.001,
  },
} as const;
