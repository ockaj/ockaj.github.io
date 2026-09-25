import { memo, useEffect, useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Tabs, Tab } from "../LiquidGlass/LiquidGlassTabs";
import {
  mobileMenuBackdropVariants,
  mobileMenuPanelVariants,
  mobileMenuItemVariants,
} from "../../utils/motionVariants";

const HIGHLIGHT_STYLE = {
  boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.15)",
} as const;

interface NavLinkItem {
  id: string;
  label: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  active: string;
  navLinks: readonly NavLinkItem[];
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

  const allLinks = useMemo<readonly NavLinkItem[]>(
    () => [
      { id: "home", label: "Home" },
      ...navLinks,
      { id: "contact", label: "Contact" },
    ],
    [navLinks],
  );

  useEffect(() => {
    document.documentElement.toggleAttribute("data-mobile-nav-open", isOpen);
    return () =>
      document.documentElement.removeAttribute("data-mobile-nav-open");
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
            className="fixed inset-x-0 top-0 -bottom-bleed z-40 touch-none bg-black/50 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="mobile-nav-panel"
            variants={mobileMenuPanelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            custom={isMotionReduced}
            style={{
              transformOrigin: "top",
              boxShadow:
                "inset 0 1px 1px rgba(255, 255, 255, 0.15), inset 1.5px 0 2px -0.5px var(--color-dispersion-cyan), inset -1.5px 0 2px -0.5px var(--color-dispersion-amber), 0 20px 40px -15px rgba(0, 0, 0, 0.7)",
            }}
            id="mobile-nav-panel"
            aria-label="Mobile Navigation"
            className="pointer-events-auto relative z-50 mt-2 w-72 overflow-hidden rounded-3xl bg-surface/85 backdrop-blur-md backdrop-saturate-180 md:hidden"
          >
            <div className="no-scrollbar relative z-10 max-h-mobile-panel w-full overflow-y-auto overscroll-contain p-3">
              <Tabs
                value={active}
                onChange={onChange}
                layoutId="active-mobile-nav-highlight"
                role={null}
                highlightClassName="navbar-highlight-flat"
                highlightStyle={HIGHLIGHT_STYLE}
                className="flex flex-col gap-1.5"
              >
                {allLinks.map((link) => (
                  <Tab
                    key={link.id}
                    value={link.id}
                    variants={mobileMenuItemVariants}
                    custom={isMotionReduced}
                    tabIndex={0}
                    className="relative z-10 flex w-full items-center justify-center rounded-full px-4 py-3.5 text-center text-sm font-semibold tracking-subtle text-muted transition-colors duration-300 select-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none focus-visible:ring-inset"
                    activeClassName="text-text-primary"
                  >
                    <span>{link.label}</span>
                  </Tab>
                ))}
              </Tabs>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
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
