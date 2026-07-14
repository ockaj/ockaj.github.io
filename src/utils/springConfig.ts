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
} as const;
