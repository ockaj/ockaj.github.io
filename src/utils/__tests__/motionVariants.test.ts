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
    it("provides short easeOut fallback transition", () => {
      expect(REDUCED_MOTION_TRANSITION.duration).toBeGreaterThan(0);
      expect(REDUCED_MOTION_TRANSITION.duration).toBeLessThanOrEqual(0.3);
      expect(REDUCED_MOTION_TRANSITION.ease).toBe("easeOut");
    });

    it("clamps card stagger translation to 0 when reduced motion is preferred", () => {
      const hiddenNormal = cardStaggerVariants.hidden(false);
      const hiddenReduced = cardStaggerVariants.hidden(true);

      expect(hiddenNormal.opacity).toBe(0);
      expect(typeof hiddenNormal.y).toBe("number");
      expect(hiddenNormal.y).toBeGreaterThan(0);

      expect(hiddenReduced).toEqual({ opacity: 0, y: 0 });

      const visibleReduced = cardStaggerVariants.visible(true);
      expect(visibleReduced.transition).toEqual(REDUCED_MOTION_TRANSITION);

      const visibleNormal = cardStaggerVariants.visible(false);
      expect(visibleNormal.transition.duration).toBeGreaterThan(0);
      expect(visibleNormal.transition.ease).toBe(EASE.out);
    });

    it("disables drawer stagger delays under reduced motion", () => {
      const visibleReduced = drawerContentVariants.visible(true);
      expect(visibleReduced).toEqual({
        transition: { staggerChildren: 0, delayChildren: 0 },
      });

      const visibleNormal = drawerContentVariants.visible(false);
      expect(visibleNormal.transition.staggerChildren).toBeGreaterThan(0);
      expect(visibleNormal.transition.delayChildren).toBeGreaterThanOrEqual(0);
    });

    it("clamps drawer item y-offset to 0 under reduced motion", () => {
      expect(drawerItemVariants.hidden(true)).toEqual({ opacity: 0, y: 0 });

      const hiddenNormal = drawerItemVariants.hidden(false);
      expect(hiddenNormal.opacity).toBe(0);
      expect(typeof hiddenNormal.y).toBe("number");
      expect(hiddenNormal.y).toBeGreaterThan(0);

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
      const reducedState = hiddenFn({
        prefersReducedMotion: true,
        isMobile: false,
      });
      expect(reducedState.scale).toBe(1);
      expect(reducedState.opacity).toBe(0);

      // Desktop and mobile use subtle scale-down zoom entrances below 1
      const desktopState = hiddenFn({
        prefersReducedMotion: false,
        isMobile: false,
      });
      expect(desktopState.scale).toBeLessThan(1);
      expect(desktopState.scale).toBeGreaterThan(0.8);
      expect(desktopState.opacity).toBe(0);

      const mobileState = hiddenFn({
        prefersReducedMotion: false,
        isMobile: true,
      });
      expect(mobileState.scale).toBeLessThan(1);
      expect(mobileState.scale).toBeGreaterThan(0.8);
      expect(mobileState.opacity).toBe(0);
    });

    it("backdrop transition respects reduced motion", () => {
      expect(getBackdropTransition(true)).toEqual(REDUCED_MOTION_TRANSITION);

      const normalBackdrop = getBackdropTransition(false);
      expect(normalBackdrop.duration).toBeGreaterThan(0);
      expect(normalBackdrop.ease).toBe("easeOut");
    });

    it("mobileMenuPanelVariants handles reduced motion cleanly", () => {
      const hiddenFn = mobileMenuPanelVariants.hidden as (
        rm: boolean | null,
      ) => { opacity: number; y?: number; scale?: number };

      expect(hiddenFn(true)).toEqual({ opacity: 0 });

      const hiddenNormal = hiddenFn(false);
      expect(hiddenNormal.opacity).toBe(0);
      expect(typeof hiddenNormal.y).toBe("number");
      expect(hiddenNormal.y).toBeLessThan(0);
      expect(hiddenNormal.scale).toBeLessThan(1);

      const exitFn = mobileMenuPanelVariants.exit as (rm: boolean | null) => {
        opacity: number;
        transition: unknown;
        y?: number;
      };

      expect(exitFn(true)).toEqual({
        opacity: 0,
        transition: REDUCED_MOTION_TRANSITION,
      });
    });

    it("mobileMenuItemVariants handles y translations and reduced motion", () => {
      const hiddenFn = mobileMenuItemVariants.hidden as (
        rm: boolean | null,
      ) => {
        opacity: number;
        y?: number;
      };
      expect(hiddenFn(true)).toEqual({ opacity: 0 });

      const hiddenNormal = hiddenFn(false);
      expect(hiddenNormal.opacity).toBe(0);
      expect(typeof hiddenNormal.y).toBe("number");
      expect(hiddenNormal.y).toBeLessThan(0);
    });

    it("hero variants clamp y offsets on reduced motion", () => {
      const heroNameHidden = heroNameVariants.hidden as VariantFn;
      const heroItemHidden = heroItemVariants.hidden as VariantFn;

      expect(heroNameHidden(true)).toEqual({ opacity: 0, y: 0 });
      const heroNameNormal = heroNameHidden(false);
      expect(heroNameNormal.opacity).toBe(0);
      expect(heroNameNormal.y).toBeGreaterThan(0);

      expect(heroItemHidden(true)).toEqual({ opacity: 0, y: 0 });
      const heroItemNormal = heroItemHidden(false);
      expect(heroItemNormal.opacity).toBe(0);
      expect(heroItemNormal.y).toBeGreaterThan(0);
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

    it("exports mobile swipe initial entrance nudge spring physics", () => {
      expect(SPRING.nudge.type).toBe("spring");
      expect(SPRING.nudge.stiffness).toBeGreaterThan(0);
      expect(SPRING.nudge.damping).toBeGreaterThan(0);
      expect(SPRING.nudge.mass).toBeGreaterThan(0);
    });
  });
});
