import { useEffect, useCallback, useReducer, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Menu, X } from "lucide-react";
import { LiquidGlassButton } from "./LiquidGlass/LiquidGlass";
import { Tabs, Tab } from "./LiquidGlass/LiquidGlassTabs";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useOverlay } from "../hooks/useAppNavigation";
import { cn } from "../utils/cn";
import { SPRING } from "../utils/springConfig";
import MobileMenu from "./MobileMenu";

const NAV_LINKS = ["Case Studies", "Skills", "Process Library", "Journal"];

interface NavbarProps {
  activeSection: string;
  onNavClick: (section: string) => void;
}

interface NavbarState {
  scrolled: boolean;
  isOpen: boolean;
  avatarError: boolean;
  isHovered: boolean;
  isTransitioning: boolean;
  isScrolling: boolean;
}

type NavbarAction =
  | { type: "SET_SCROLLED"; scrolled: boolean }
  | { type: "SET_IS_OPEN"; isOpen: boolean }
  | { type: "SET_AVATAR_ERROR"; error: boolean }
  | { type: "SET_IS_HOVERED"; hovered: boolean }
  | { type: "SET_IS_TRANSIENT"; transitioning: boolean }
  | { type: "SET_SCROLLING"; scrolling: boolean };

function navbarReducer(state: NavbarState, action: NavbarAction): NavbarState {
  switch (action.type) {
    case "SET_SCROLLED":
      return { ...state, scrolled: action.scrolled };
    case "SET_IS_OPEN":
      return { ...state, isOpen: action.isOpen };
    case "SET_AVATAR_ERROR":
      return { ...state, avatarError: action.error };
    case "SET_IS_HOVERED":
      return { ...state, isHovered: action.hovered };
    case "SET_IS_TRANSIENT":
      return { ...state, isTransitioning: action.transitioning };
    case "SET_SCROLLING":
      return { ...state, isScrolling: action.scrolling };
    default:
      return state;
  }
}

export default function Navbar({ activeSection, onNavClick }: NavbarProps) {
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const isMotionReduced = !!prefersReducedMotion;
  const localSentinelRef = useRef<HTMLDivElement>(null);

  const [state, dispatch] = useReducer(navbarReducer, {
    scrolled: false,
    isOpen: false,
    avatarError: false,
    isHovered: false,
    isTransitioning: false,
    isScrolling: false,
  });

  const {
    scrolled,
    isOpen,
    avatarError,
    isHovered,
    isTransitioning,
    isScrolling,
  } = state;

  const isScrollingRef = useRef(false);

  // Lock background scroll and integrate with browser history when mobile menu is open
  useOverlay(
    isMobile && isOpen,
    () => dispatch({ type: "SET_IS_OPEN", isOpen: false }),
    "nav",
  );

  useEffect(() => {
    if (!isMobile) return;
    let t: number;
    const handleScroll = () => {
      if (!isScrollingRef.current) {
        isScrollingRef.current = true;
        dispatch({ type: "SET_SCROLLING", scrolling: true });
      }
      clearTimeout(t);
      t = window.setTimeout(() => {
        isScrollingRef.current = false;
        dispatch({ type: "SET_SCROLLING", scrolling: false });
      }, 120);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(t);
    };
  }, [isMobile]);

  const active = activeSection;
  const prevActiveRef = useRef(activeSection);

  useEffect(() => {
    if (prevActiveRef.current !== activeSection) {
      dispatch({ type: "SET_IS_TRANSIENT", transitioning: true });
      prevActiveRef.current = activeSection;
    }
  }, [activeSection]);

  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        dispatch({ type: "SET_IS_TRANSIENT", transitioning: false });
      }, 500); // 500ms covers the 400ms CSS transition and animation settling
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  // Track scroll depth for the navbar backdrop collapse effect
  useEffect(() => {
    const sentinel = localSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        dispatch({ type: "SET_SCROLLED", scrolled: !entry.isIntersecting }),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const handleClose = useCallback(
    () => dispatch({ type: "SET_IS_OPEN", isOpen: false }),
    [],
  );

  const handleNav = useCallback(
    (label: string) => {
      dispatch({ type: "SET_IS_OPEN", isOpen: false });
      setTimeout(() => {
        onNavClick(label);
      }, 100);
    },
    [onNavClick],
  );

  return (
    <>
      <div
        ref={localSentinelRef}
        className="absolute top-[100px] left-0 w-px h-px pointer-events-none opacity-0"
      />
      <nav className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pt-4 md:pt-6 px-4 pointer-events-none">
        <div
          className={cn(
            "pointer-events-auto flex items-center justify-between md:justify-start gap-1 md:gap-1.5 rounded-full border border-white/10 bg-surface/40 p-[7px] navbar-capsule overflow-hidden isolate [transform:translateZ(0)] w-full max-w-[85vw] md:w-auto relative z-50 md:max-w-[95vw]",
            isScrolling ? "backdrop-blur-[3px]" : "backdrop-blur-md",
            scrolled && "border-white/20 bg-surface/60",
          )}
        >
          <Tabs
            value={active}
            onChange={handleNav}
            layoutId="active-nav-highlight"
            onMouseEnter={() =>
              dispatch({ type: "SET_IS_HOVERED", hovered: true })
            }
            onMouseLeave={() =>
              dispatch({ type: "SET_IS_HOVERED", hovered: false })
            }
            highlightClassName={
              isHovered || isTransitioning
                ? "navbar-highlight-active"
                : "navbar-highlight-flat"
            }
            className="flex items-center gap-1 md:gap-1.5"
            role="none"
          >
            {/* Home Button (Avatar + Name) */}
            <Tab
              value="Home"
              highlightClassName="hidden md:block"
              className={cn(
                "relative text-xs sm:text-sm rounded-full pl-1.5 md:pl-[9px] pr-3 md:pr-[15px] py-1.5 md:py-[9px] transition-colors duration-200 select-none z-10 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-inset",
                active === "Home"
                  ? "text-text-primary"
                  : "text-muted hover:text-text-primary",
              )}
              aria-label="Home"
              role="link"
            >
              <span className="relative size-6 rounded-full bg-bg flex items-center justify-center z-10 overflow-hidden border border-white/5 flex-shrink-0">
                {avatarError ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: "SET_AVATAR_ERROR", error: false });
                    }}
                    title="Click to retry loading avatar"
                    className="text-[9px] font-bold text-accent font-mono leading-none tracking-normal select-none hover:scale-110 transition-transform cursor-pointer focus-visible:outline-none"
                  >
                    OMO
                  </button>
                ) : (
                  <img
                    src="https://avatars.githubusercontent.com/u/36997301?v=4&s=24"
                    onError={() =>
                      dispatch({ type: "SET_AVATAR_ERROR", error: true })
                    }
                    alt="Ondrej Michal Ockaj"
                    width="24"
                    height="24"
                    className="w-full h-full object-cover"
                  />
                )}
              </span>

              <span className="text-[13px] font-semibold leading-none whitespace-nowrap">
                Ondrej Michal Očkaj
              </span>
            </Tab>

            {/* Nav links (Desktop Only) */}
            <div className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => (
                <Tab
                  key={link}
                  value={link}
                  className={cn(
                    "relative text-xs md:text-sm rounded-full px-3 md:px-[19px] py-1.5 md:py-[11px] transition-colors duration-200 select-none z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-inset",
                    active === link
                      ? "text-text-primary"
                      : "text-muted hover:text-text-primary",
                  )}
                  role="link"
                >
                  {link}
                </Tab>
              ))}

              {/* Contact link (Desktop Only) */}
              <Tab
                value="Contact"
                className={cn(
                  "relative text-xs md:text-sm rounded-full px-3 md:px-[19px] py-1.5 md:py-[11px] transition-colors duration-200 select-none z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-inset",
                  active === "Contact"
                    ? "text-text-primary"
                    : "text-muted hover:text-text-primary",
                )}
                role="link"
              >
                Contact
              </Tab>
            </div>
          </Tabs>

          {/* Hamburger Menu Toggle (Mobile Only) */}
          <div className="flex md:hidden">
            <LiquidGlassButton
              type="button"
              onClick={() => dispatch({ type: "SET_IS_OPEN", isOpen: !isOpen })}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              className="size-11 p-0"
            >
              <span className="relative size-4 flex items-center justify-center pointer-events-none">
                <motion.span
                  className="absolute inset-0 flex items-center justify-center"
                  initial={false}
                  animate={{
                    opacity: isOpen ? 1 : 0,
                    scale: isMotionReduced ? 1 : isOpen ? 1 : 0.25,
                    filter: isMotionReduced
                      ? "none"
                      : isOpen
                        ? "blur(0px)"
                        : "blur(4px)",
                  }}
                  transition={
                    isMotionReduced ? { duration: 0.15 } : SPRING.snappyMenu
                  }
                >
                  <X size={16} />
                </motion.span>
                <motion.span
                  className="absolute inset-0 flex items-center justify-center"
                  initial={false}
                  animate={{
                    opacity: isOpen ? 0 : 1,
                    scale: isMotionReduced ? 1 : isOpen ? 0.25 : 1,
                    filter: isMotionReduced
                      ? "none"
                      : isOpen
                        ? "blur(4px)"
                        : "blur(0px)",
                  }}
                  transition={
                    isMotionReduced ? { duration: 0.15 } : SPRING.snappyMenu
                  }
                >
                  <Menu size={16} />
                </motion.span>
              </span>
            </LiquidGlassButton>
          </div>
        </div>

        {/* Mobile Menu Dropdown Panel (Mobile Only) */}
        {isMobile && (
          <MobileMenu
            isOpen={isOpen}
            active={active}
            navLinks={NAV_LINKS}
            onClose={handleClose}
            onChange={handleNav}
          />
        )}
      </nav>
    </>
  );
}
