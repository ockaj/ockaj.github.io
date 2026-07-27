import { memo, useState } from "react";
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
}: MobileMenuProps) {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const isMotionReduced = !!prefersReducedMotion;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: SPRING.exit }}
            transition={SPRING.drawerMobile}
            aria-hidden="true"
            className="fixed top-0 left-0 right-0 bottom-[-20vh] md:hidden z-40 pointer-events-auto bg-black/50 backdrop-blur-sm"
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
            className="md:hidden z-50 w-72 mt-2 pointer-events-auto relative rounded-3xl border overflow-hidden"
          >
            <div className="relative z-10 w-full p-3 max-h-[calc(100svh-100px)] overflow-y-auto overscroll-contain no-scrollbar">
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
                role="none"
              >
                {["Home", ...navLinks, "Contact"].map((link) => (
                  <Tab
                    key={link}
                    value={link}
                    className={cn(
                      "relative w-full text-center flex justify-center items-center text-sm font-semibold rounded-full px-4 py-3.5 transition-colors duration-300 select-none z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-inset",
                      active === link
                        ? "text-text-primary"
                        : "text-muted hover:text-text-primary",
                    )}
                    role="link"
                  >
                    {link}
                  </Tab>
                ))}
              </Tabs>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default memo(MobileMenu);
