import type { Variants } from "motion/react";
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
    let transition: Record<string, unknown> = SPRING.modal;
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
