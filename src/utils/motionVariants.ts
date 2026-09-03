import type { Variants, Transition } from "motion/react";
import { EASE, SPRING } from "./springConfig";

/** Standardized Motion Stagger & Viewport animation variants across section components */

export const containerStaggerVariants = (staggerDelay = 0.08) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerDelay,
    },
  },
});

export const cardStaggerVariants = {
  hidden: (prefersReducedMotion: boolean | null) => ({
    opacity: 0,
    y: prefersReducedMotion ? 0 : 24,
  }),
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE.out },
  },
};

export const drawerContentVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

export const drawerItemVariants = {
  hidden: (prefersReducedMotion: boolean | null) => ({
    opacity: 0,
    y: prefersReducedMotion ? 0 : 10,
  }),
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, duration: 0.22, bounce: 0 },
  },
};

export const createModalVariants = (yOffset = 15): Variants => ({
  hidden: (custom: { prefersReducedMotion: boolean; isMobile: boolean }) => {
    let scale = 0.95;
    if (custom.prefersReducedMotion) {
      scale = 1;
    } else if (custom.isMobile) {
      scale = 0.96;
    }
    return {
      opacity: 0,
      scale,
      y: custom.prefersReducedMotion ? 0 : yOffset,
      transition: custom.prefersReducedMotion
        ? { duration: 0.15 }
        : SPRING.exit,
    };
  },
  visible: (custom: { prefersReducedMotion: boolean; isMobile: boolean }) => {
    let transition: Transition = SPRING.modal;
    if (custom.prefersReducedMotion) {
      transition = { duration: 0.15 };
    } else if (custom.isMobile) {
      transition = SPRING.modalMobile;
    }
    return {
      opacity: 1,
      scale: 1,
      y: 0,
      transition,
    };
  },
});

export const SECTION_ANIMATE = { opacity: 1, y: 0 };
export const SECTION_VIEWPORT = { once: true, margin: "0px 0px -40px 0px" };
export const SECTION_TRANSITION = {
  duration: 0.45,
  ease: EASE.out,
};

export const mobileMenuBackdropVariants: Variants = {
  hidden: {
    opacity: 0,
    pointerEvents: "none",
  },
  visible: (prefersReducedMotion: boolean | null) => ({
    opacity: 1,
    pointerEvents: "auto",
    transition: prefersReducedMotion ? { duration: 0.15 } : SPRING.modalMobile,
  }),
  exit: (prefersReducedMotion: boolean | null) => ({
    opacity: 0,
    pointerEvents: "none",
    transition: prefersReducedMotion ? { duration: 0.15 } : SPRING.exit,
  }),
};

export const mobileMenuPanelVariants: Variants = {
  hidden: (prefersReducedMotion: boolean | null) =>
    prefersReducedMotion
      ? { opacity: 0 }
      : {
          y: -6,
          scale: 0.98,
          opacity: 0,
          backdropFilter: "blur(0px) saturate(100%)",
          backgroundColor: "hsla(0, 0%, 8%, 0)",
          borderColor: "hsla(0, 0%, 100%, 0)",
        },
  visible: (prefersReducedMotion: boolean | null) => ({
    y: 0,
    scale: 1,
    opacity: 1,
    backdropFilter: "blur(10px) saturate(180%)",
    backgroundColor: "hsla(0, 0%, 8%, 0.85)",
    borderColor: "hsla(0, 0%, 100%, 0.1)",
    transition: prefersReducedMotion
      ? { duration: 0.15 }
      : {
          ...SPRING.drawerMobile,
          staggerChildren: 0.035,
          delayChildren: 0.03,
        },
  }),
  exit: (prefersReducedMotion: boolean | null) =>
    prefersReducedMotion
      ? { opacity: 0, transition: { duration: 0.15 } }
      : {
          y: -6,
          scale: 0.98,
          opacity: 0,
          backdropFilter: "blur(0px) saturate(100%)",
          backgroundColor: "hsla(0, 0%, 8%, 0)",
          borderColor: "hsla(0, 0%, 100%, 0)",
          transition: SPRING.exit,
        },
};

export const mobileMenuItemVariants: Variants = {
  hidden: (prefersReducedMotion: boolean | null) =>
    prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 },
  visible: (prefersReducedMotion: boolean | null) =>
    prefersReducedMotion
      ? { opacity: 1, transition: { duration: 0.15 } }
      : {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.2,
            ease: EASE.out,
          },
        },
};
