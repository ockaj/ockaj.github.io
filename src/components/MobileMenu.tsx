import { memo, useEffect, useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Tabs, Tab } from "./LiquidGlass/LiquidGlassTabs";
import { cn } from "../utils/cn";
import {
  mobileMenuBackdropVariants,
  mobileMenuPanelVariants,
  mobileMenuItemVariants,
} from "../utils/motionVariants";

const HIGHLIGHT_STYLE = {
  boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.15)",
} as const;

const INSTANT_LAYOUT_TRANSITION = { layout: { duration: 0 } } as const;

interface MobileMenuProps {
  isOpen: boolean;
  active: string;
  navLinks: string[];
  onClose: () => void;
  onChange: (value: string) => void;
}

function MobileMenu({
  isOpen,
  active,
  navLinks,
  onClose,
  onChange,
}: Readonly<MobileMenuProps>) {
  const prefersReducedMotion = useReducedMotion();
  const isMotionReduced = !!prefersReducedMotion;

  const allLinks = useMemo(() => ["Home", ...navLinks, "Contact"], [navLinks]);

  useEffect(() => {
    if (!isOpen) {
      if (typeof document !== "undefined") {
        const activeEl = document.activeElement;
        if (
          activeEl instanceof HTMLElement &&
          activeEl.closest("#mobile-nav-panel")
        ) {
          activeEl.blur();
        }
      }
      return;
    }
    const preventScroll = (e: Event) => {
      if (!(e.target as HTMLElement | null)?.closest(".overflow-y-auto")) {
        e.preventDefault();
      }
    };
    const types = ["touchmove", "wheel"] as const;
    types.forEach((type) =>
      document.addEventListener(type, preventScroll, { passive: false }),
    );
    return () =>
      types.forEach((type) =>
        document.removeEventListener(type, preventScroll),
      );
  }, [isOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="mobile-menu-backdrop"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={mobileMenuBackdropVariants}
            custom={isMotionReduced}
            aria-hidden="true"
            className="fixed top-0 right-0 bottom-[-20vh] left-0 z-40 touch-none bg-black/50 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
        ) : null}
      </AnimatePresence>

      <motion.div
        variants={mobileMenuPanelVariants}
        initial="hidden"
        animate={isOpen ? "visible" : "hidden"}
        custom={isMotionReduced}
        style={{
          transformOrigin: "top",
          boxShadow:
            "inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 20px 40px -15px rgba(0, 0, 0, 0.7)",
        }}
        id="mobile-nav-panel"
        aria-label="Mobile Navigation"
        inert={!isOpen ? true : undefined}
        className={cn(
          "relative z-50 mt-2 w-72 overflow-hidden rounded-3xl border md:hidden",
          isOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div className="no-scrollbar relative z-10 max-h-[calc(100svh-100px)] w-full overflow-y-auto overscroll-contain p-3">
          <Tabs
            value={active}
            onChange={onChange}
            layoutId="active-mobile-nav-highlight"
            role={null}
            highlightClassName="border border-white/10 navbar-highlight-flat"
            highlightStyle={HIGHLIGHT_STYLE}
            highlightTransition={
              !isOpen ? INSTANT_LAYOUT_TRANSITION : undefined
            }
            className="flex flex-col gap-1.5"
          >
            {allLinks.map((link) => (
              <Tab
                key={link}
                value={link}
                variants={mobileMenuItemVariants}
                custom={isMotionReduced}
                tabIndex={isOpen ? 0 : -1}
                className="focus-visible:ring-accent/60 text-muted hover:text-text-primary relative z-10 flex w-full items-center justify-center rounded-full px-4 py-3.5 text-center text-sm font-semibold tracking-[0.01em] transition-colors duration-300 select-none focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
                activeClassName="text-text-primary"
              >
                <span>{link}</span>
              </Tab>
            ))}
          </Tabs>
        </div>
      </motion.div>
    </>
  );
}

function areMobileMenuPropsEqual(
  prev: Readonly<MobileMenuProps>,
  next: Readonly<MobileMenuProps>,
): boolean {
  return (
    prev.isOpen === next.isOpen &&
    prev.active === next.active &&
    prev.onClose === next.onClose &&
    prev.onChange === next.onChange &&
    prev.navLinks === next.navLinks
  );
}

export default memo(MobileMenu, areMobileMenuPropsEqual);
