/** Standardized spring configs for consistent motion across all components */
export const SPRING = {
  /** Highlight pill sliding between nav/tab items */
  highlight: {
    type: "spring" as const,
    stiffness: 380,
    damping: 24,
    mass: 0.6,
  },
  /** Drawers sliding in from edge */
  drawer: { type: "spring" as const, damping: 28, stiffness: 220 },
  drawerMobile: { type: "spring" as const, damping: 26, stiffness: 240 },
  /** Modals scaling in */
  modal: { type: "spring" as const, damping: 25, stiffness: 220 },
  modalMobile: { type: "spring" as const, damping: 24, stiffness: 240 },
  /** Tooltips entrance */
  tooltip: {
    type: "spring" as const,
    stiffness: 400,
    damping: 25,
    mass: 0.8,
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
} as const;
