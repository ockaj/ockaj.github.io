import {
  useEffect,
  useLayoutEffect,
  useCallback,
  useReducer,
  useRef,
} from "react";
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

function getCloseIconAnim(isOpen: boolean, isMotionReduced: boolean) {
  if (isMotionReduced) {
    return { opacity: isOpen ? 1 : 0, scale: 1, filter: "none" };
  }
  return {
    opacity: isOpen ? 1 : 0,
    scale: isOpen ? 1 : 0.25,
    filter: isOpen ? "blur(0px)" : "blur(4px)",
  };
}

function getMenuIconAnim(isOpen: boolean, isMotionReduced: boolean) {
  if (isMotionReduced) {
    return { opacity: isOpen ? 0 : 1, scale: 1, filter: "none" };
  }
  return {
    opacity: isOpen ? 0 : 1,
    scale: isOpen ? 0.25 : 1,
    filter: isOpen ? "blur(4px)" : "blur(0px)",
  };
}

export default function Navbar({
  activeSection,
  onNavClick,
}: Readonly<NavbarProps>) {
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

  useLayoutEffect(() => {
    if (prevActiveRef.current !== activeSection) {
      prevActiveRef.current = activeSection;
      dispatch({ type: "SET_IS_TRANSIENT", transitioning: true });
    }
  }, [activeSection]);

  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        dispatch({ type: "SET_IS_TRANSIENT", transitioning: false });
      }, 300); // 300ms covers SPRING.highlight settling
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

  const handleMouseEnter = useCallback(
    () => dispatch({ type: "SET_IS_HOVERED", hovered: true }),
    [],
  );

  const handleMouseLeave = useCallback(
    () => dispatch({ type: "SET_IS_HOVERED", hovered: false }),
    [],
  );

  return (
    <>
      <div
        ref={localSentinelRef}
        className="pointer-events-none absolute top-[100px] left-0 h-px w-px opacity-0"
      />
      <nav
        aria-label="Main Navigation"
        className="pointer-events-none fixed top-0 right-0 left-0 z-50 flex flex-col items-center px-4 pt-4 md:pt-6"
      >
        <div
          className={cn(
            "bg-surface/40 navbar-capsule pointer-events-auto relative isolate z-50 flex w-full max-w-[85vw] [transform:translateZ(0)] items-center justify-between gap-1 overflow-hidden rounded-full border border-white/10 p-[7px] md:w-auto md:max-w-[95vw] md:justify-start md:gap-1.5",
            isScrolling ? "backdrop-blur-[3px]" : "backdrop-blur-md",
            scrolled && "bg-surface/60 border-white/20",
          )}
        >
          <Tabs
            value={active}
            onChange={handleNav}
            layoutId="active-nav-highlight"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            highlightClassName={
              isHovered || isTransitioning
                ? "navbar-highlight-active"
                : "navbar-highlight-flat"
            }
            className="flex items-center gap-1 md:gap-1.5"
          >
            {/* Home Button (Avatar + Name) */}
            <Tab
              value="Home"
              tabIndex={0}
              highlightClassName="hidden md:block"
              className={cn(
                "focus-visible:ring-accent/60 relative z-10 flex items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5 text-xs transition-colors duration-200 select-none focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset sm:text-sm md:py-[9px] md:pr-[15px] md:pl-[9px]",
                active === "Home"
                  ? "text-text-primary"
                  : "text-muted hover:text-text-primary",
              )}
              aria-label="Home"
              aria-current={active === "Home" ? "page" : undefined}
            >
              <span className="bg-bg relative z-10 flex size-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/5">
                {avatarError ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: "SET_AVATAR_ERROR", error: false });
                    }}
                    title="Click to retry loading avatar"
                    className="text-accent cursor-pointer font-mono text-xs leading-none font-bold tracking-normal transition-transform duration-200 ease-out select-none hover:scale-105 focus-visible:outline-none"
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
                    className="h-full w-full object-cover"
                  />
                )}
              </span>

              <span className="text-xs leading-none font-semibold whitespace-nowrap">
                Ondrej Michal Očkaj
              </span>
            </Tab>

            {/* Nav links (Desktop Only) */}
            <div className="hidden items-center gap-0.5 md:flex">
              {NAV_LINKS.map((link) => (
                <Tab
                  key={link}
                  value={link}
                  tabIndex={0}
                  className={cn(
                    "focus-visible:ring-accent/60 relative z-10 rounded-full px-3 py-1.5 text-xs transition-colors duration-200 select-none focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset md:px-[19px] md:py-[11px] md:text-sm",
                    active === link
                      ? "text-text-primary"
                      : "text-muted hover:text-text-primary",
                  )}
                  aria-current={active === link ? "page" : undefined}
                >
                  {link}
                </Tab>
              ))}

              {/* Contact link (Desktop Only) */}
              <Tab
                value="Contact"
                tabIndex={0}
                className={cn(
                  "focus-visible:ring-accent/60 relative z-10 rounded-full px-3 py-1.5 text-xs transition-colors duration-200 select-none focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset md:px-[19px] md:py-[11px] md:text-sm",
                  active === "Contact"
                    ? "text-text-primary"
                    : "text-muted hover:text-text-primary",
                )}
                aria-current={active === "Contact" ? "page" : undefined}
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
              aria-expanded={isOpen}
              aria-controls="mobile-nav-panel"
              className="size-11 p-0"
            >
              <span className="pointer-events-none relative flex size-4 items-center justify-center">
                <motion.span
                  className="absolute inset-0 flex items-center justify-center"
                  initial={false}
                  animate={getCloseIconAnim(isOpen, isMotionReduced)}
                  transition={
                    isMotionReduced ? { duration: 0.15 } : SPRING.snappyMenu
                  }
                >
                  <X size={16} />
                </motion.span>
                <motion.span
                  className="absolute inset-0 flex items-center justify-center"
                  initial={false}
                  animate={getMenuIconAnim(isOpen, isMotionReduced)}
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
