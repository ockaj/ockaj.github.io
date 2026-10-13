import { describe, it, expect } from "vitest";
import type { TargetAndTransition } from "motion/react";
import {
  REDUCED_MOTION_TRANSITION,
  containerStaggerVariants,
  cardStaggerVariants,
  drawerContentVariants,
  drawerItemVariants,
  modalVariants,
  getBackdropTransition,
  mobileMenuPanelVariants,
  mobileMenuItemVariants,
  heroNameVariants,
  heroItemVariants,
  loadingNodeOpacityAnimate,
  loadingNodePulseAnimate,
} from "../motionVariants";
import { SPRING, EASE } from "../springConfig";

type VariantFn = (custom: boolean | null) => TargetAndTransition;

describe("motionVariants invariant specifications", () => {
  describe("Reduced motion safety invariants", () => {
    it("provides 150ms easeOut fallback transition", () => {
      expect(REDUCED_MOTION_TRANSITION).toEqual({
        duration: 0.15,
        ease: "easeOut",
      });
    });

    it("clamps card stagger translation to 0 when reduced motion is preferred", () => {
      const hiddenNormal = cardStaggerVariants.hidden(false);
      const hiddenReduced = cardStaggerVariants.hidden(true);

      expect(hiddenNormal).toEqual({ opacity: 0, y: 24 });
      expect(hiddenReduced).toEqual({ opacity: 0, y: 0 });

      const visibleReduced = cardStaggerVariants.visible(true);
      expect(visibleReduced.transition).toEqual(REDUCED_MOTION_TRANSITION);

      const visibleNormal = cardStaggerVariants.visible(false);
      expect(visibleNormal.transition).toEqual({ duration: 0.35, ease: EASE.out });
    });

    it("disables drawer stagger delays under reduced motion", () => {
      const visibleReduced = drawerContentVariants.visible(true);
      expect(visibleReduced).toEqual({
        transition: { staggerChildren: 0, delayChildren: 0 },
      });

      const visibleNormal = drawerContentVariants.visible(false);
      expect(visibleNormal).toEqual({
        transition: { staggerChildren: 0.04, delayChildren: 0.05 },
      });
    });

    it("clamps drawer item y-offset to 0 under reduced motion", () => {
      expect(drawerItemVariants.hidden(true)).toEqual({ opacity: 0, y: 0 });
      expect(drawerItemVariants.hidden(false)).toEqual({ opacity: 0, y: 10 });

      const visibleReduced = drawerItemVariants.visible(true);
      expect(visibleReduced.transition).toEqual(REDUCED_MOTION_TRANSITION);

      const visibleNormal = drawerItemVariants.visible(false);
      expect(visibleNormal.transition).toEqual(SPRING.exit);
    });

    it("modalVariants handles desktop, mobile and reduced motion scale bounds", () => {
      const hiddenFn = modalVariants.hidden as (custom: {
        prefersReducedMotion: boolean;
        isMobile: boolean;
      }) => { opacity: number; scale: number; y: number };

      // Reduced motion forces scale: 1
      const reducedState = hiddenFn({ prefersReducedMotion: true, isMobile: false });
      expect(reducedState.scale).toBe(1);
      expect(reducedState.opacity).toBe(0);

      // Desktop normal uses scale: 0.95
      const desktopState = hiddenFn({ prefersReducedMotion: false, isMobile: false });
      expect(desktopState.scale).toBeCloseTo(0.95, 2);

      // Mobile normal uses scale: 0.96
      const mobileState = hiddenFn({ prefersReducedMotion: false, isMobile: true });
      expect(mobileState.scale).toBeCloseTo(0.96, 2);
    });

    it("backdrop transition respects reduced motion", () => {
      expect(getBackdropTransition(true)).toEqual(REDUCED_MOTION_TRANSITION);
      expect(getBackdropTransition(false)).toEqual({ duration: 0.2, ease: "easeOut" });
    });

    it("mobileMenuPanelVariants handles reduced motion cleanly", () => {
      const hiddenFn = mobileMenuPanelVariants.hidden as (
        rm: boolean | null,
      ) => { opacity: number; y?: number; scale?: number };

      expect(hiddenFn(true)).toEqual({ opacity: 0 });
      expect(hiddenFn(false)).toEqual({ y: -6, scale: 0.98, opacity: 0 });

      const exitFn = mobileMenuPanelVariants.exit as (
        rm: boolean | null,
      ) => { opacity: number; transition: unknown; y?: number };

      expect(exitFn(true)).toEqual({ opacity: 0, transition: REDUCED_MOTION_TRANSITION });
    });

    it("mobileMenuItemVariants handles y translations and reduced motion", () => {
      const hiddenFn = mobileMenuItemVariants.hidden as (rm: boolean | null) => {
        opacity: number;
        y?: number;
      };
      expect(hiddenFn(true)).toEqual({ opacity: 0 });
      expect(hiddenFn(false)).toEqual({ opacity: 0, y: -4 });
    });

    it("hero variants clamp y offsets on reduced motion", () => {
      const heroNameHidden = heroNameVariants.hidden as VariantFn;
      const heroItemHidden = heroItemVariants.hidden as VariantFn;

      expect(heroNameHidden(true)).toEqual({ opacity: 0, y: 0 });
      expect(heroNameHidden(false)).toEqual({ opacity: 0, y: 28 });

      expect(heroItemHidden(true)).toEqual({ opacity: 0, y: 0 });
      expect(heroItemHidden(false)).toEqual({ opacity: 0, y: 20 });
    });
  });

  describe("Compositor & Transform Invariants", () => {
    it("containerStaggerVariants configures staggerChildren without inline DOM style writes", () => {
      const custom = containerStaggerVariants(0.12);
      expect(custom.visible.transition.staggerChildren).toBeCloseTo(0.12, 2);
    });

    it("loading node opacity and pulse helpers return valid motion objects", () => {
      expect(loadingNodeOpacityAnimate(true)).toEqual({ opacity: 1 });
      expect(loadingNodeOpacityAnimate(false)).toEqual({ opacity: 0 });

      expect(loadingNodePulseAnimate(true)).toEqual({ opacity: [0.7, 1, 0.7] });
      expect(loadingNodePulseAnimate(false)).toEqual({ opacity: 0 });
    });
  });
});
