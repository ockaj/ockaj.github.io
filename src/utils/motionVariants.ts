import { EASE } from "./springConfig";

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

export const SECTION_ANIMATE = { opacity: 1, y: 0 };
export const SECTION_VIEWPORT = { once: true, margin: "0px 0px -40px 0px" };
export const SECTION_TRANSITION = {
  duration: 0.45,
  ease: EASE.out,
};
