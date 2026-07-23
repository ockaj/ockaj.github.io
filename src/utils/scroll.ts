/** Helper for smooth scroll-to-top with reduced motion check */
export function scrollToTop(): void {
  const isMotionReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: isMotionReduced ? "auto" : "smooth" });
}
