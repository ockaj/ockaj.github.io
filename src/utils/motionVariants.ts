/** Standardized Motion Stagger & Viewport animation variants across section components */

export const containerStaggerVariants = (staggerDelay = 0.1) => ({
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
    y: prefersReducedMotion ? 0 : 30,
  }),
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export const SECTION_ANIMATE = { opacity: 1, y: 0 };
export const SECTION_VIEWPORT = { once: true, margin: "-100px" };
export const SECTION_TRANSITION = {
  duration: 1,
  ease: [0.25, 0.1, 0.25, 1] as const,
};
