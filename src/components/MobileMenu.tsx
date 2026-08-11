import { memo, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Tabs, Tab } from "./LiquidGlass/LiquidGlassTabs";
import { cn } from "../utils/cn";
import { SPRING } from "../utils/springConfig";

const HIGHLIGHT_STYLE = {
  boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.15)",
} as const;

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
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const isMotionReduced = !!prefersReducedMotion;

  const allLinks = useMemo(() => ["Home", ...navLinks, "Contact"], [navLinks]);

  useEffect(() => {
    if (!isOpen) return;
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
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: SPRING.exit }}
            transition={SPRING.drawerMobile}
            aria-hidden="true"
            className="pointer-events-auto fixed top-0 right-0 bottom-[-20vh] left-0 z-40 touch-none bg-black/50 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />

          <motion.div
            initial={
              isMotionReduced
                ? { opacity: 0 }
                : {
                    y: -8,
                    scale: 0.96,
                    opacity: 0,
                    backdropFilter: "blur(0px)",
                    backgroundColor: "hsla(0, 0%, 8%, 0)",
                    borderColor: "hsla(0, 0%, 100%, 0)",
                  }
            }
            animate={{
              y: 0,
              scale: 1,
              opacity: 1,
              backdropFilter: "blur(10px)",
              backgroundColor: "hsla(0, 0%, 8%, 0.85)",
              borderColor: "hsla(0, 0%, 100%, 0.1)",
            }}
            exit={
              isMotionReduced
                ? { opacity: 0 }
                : {
                    y: -8,
                    scale: 0.96,
                    opacity: 0,
                    backdropFilter: "blur(0px)",
                    backgroundColor: "hsla(0, 0%, 8%, 0)",
                    borderColor: "hsla(0, 0%, 100%, 0)",
                    transition: SPRING.exit,
                  }
            }
            transition={
              isMotionReduced ? { duration: 0.15 } : SPRING.drawerMobile
            }
            style={{
              transformOrigin: "top",
              boxShadow:
                "inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 20px 40px -15px rgba(0, 0, 0, 0.7)",
            }}
            id="mobile-nav-panel"
            aria-label="Mobile Navigation"
            className="pointer-events-auto relative z-50 mt-2 w-72 overflow-hidden rounded-3xl border md:hidden"
          >
            <div className="no-scrollbar relative z-10 max-h-[calc(100svh-100px)] w-full overflow-y-auto overscroll-contain p-3">
              <Tabs
                value={active}
                onChange={onChange}
                layoutId="active-mobile-nav-highlight"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                highlightClassName={cn(
                  "border border-white/10",
                  isHovered
                    ? "navbar-highlight-active"
                    : "navbar-highlight-flat",
                )}
                highlightStyle={HIGHLIGHT_STYLE}
                className="flex flex-col gap-1.5"
              >
                {allLinks.map((link) => (
                  <Tab
                    key={link}
                    value={link}
                    tabIndex={0}
                    className={cn(
                      "focus-visible:ring-accent/60 relative z-10 flex w-full items-center justify-center rounded-full px-4 py-3.5 text-center text-sm font-semibold transition-colors duration-300 select-none focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
                      active === link
                        ? "text-text-primary"
                        : "text-muted hover:text-text-primary",
                    )}
                    aria-current={active === link ? "page" : undefined}
                  >
                    {link}
                  </Tab>
                ))}
              </Tabs>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export default memo(MobileMenu);
