import { useEffect, useCallback, useState, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Menu, X } from "lucide-react";
import { LiquidGlassButton } from "../LiquidGlass/LiquidGlass";
import { Tabs, Tab } from "../LiquidGlass/LiquidGlassTabs";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { useModal, navigateTo } from "../../hooks/useAppNavigation";
import { useAppStore } from "../../store/useAppStore";
import { cn } from "../../utils/cn";
import { SPRING } from "../../utils/springConfig";
import MobileMenu from "./MobileMenu";

const NAV_LINKS = [
  { id: "work", label: "Case Studies" },
  { id: "skills", label: "Skills" },
  { id: "processes", label: "Process Library" },
  { id: "journal", label: "Journal" },
  { id: "faq", label: "FAQ" },
] as const;

function getCloseIconAnim(isOpen: boolean, isMotionReduced: boolean) {
  if (isMotionReduced) {
    return { opacity: isOpen ? 1 : 0, scale: 1 };
  }
  return {
    opacity: isOpen ? 1 : 0,
    scale: isOpen ? 1 : 0.25,
  };
}

function getMenuIconAnim(isOpen: boolean, isMotionReduced: boolean) {
  if (isMotionReduced) {
    return { opacity: isOpen ? 0 : 1, scale: 1 };
  }
  return {
    opacity: isOpen ? 0 : 1,
    scale: isOpen ? 0.25 : 1,
  };
}

export default function Navbar() {
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const isMotionReduced = !!prefersReducedMotion;
  const localSentinelRef = useRef<HTMLDivElement>(null);
  const capsuleRef = useRef<HTMLDivElement>(null);

  const active = useAppStore((state) => state.activeSection);
  const {
    isOpen: isNavModalOpen,
    open: openNavModal,
    close: closeNavModal,
  } = useModal("nav");
  const isOpen = isMobile && isNavModalOpen;

  const [scrolled, setScrolled] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const isScrollingRef = useRef(false);

  useEffect(() => {
    if (!isMobile && isNavModalOpen) {
      closeNavModal();
    }
  }, [isMobile, isNavModalOpen, closeNavModal]);

  useEffect(() => {
    if (!isMobile) return;
    const capsule = capsuleRef.current;
    let t: number;
    const handleScroll = () => {
      if (!isScrollingRef.current) {
        isScrollingRef.current = true;
        capsule?.setAttribute("data-scrolling", "true");
      }
      clearTimeout(t);
      t = window.setTimeout(() => {
        isScrollingRef.current = false;
        capsule?.removeAttribute("data-scrolling");
      }, 120);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(t);
      isScrollingRef.current = false;
      capsule?.removeAttribute("data-scrolling");
    };
  }, [isMobile]);

  // Track scroll depth for the navbar backdrop collapse effect
  useEffect(() => {
    const sentinel = localSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      closeNavModal();
    } else {
      openNavModal();
    }
  }, [isOpen, closeNavModal, openNavModal]);

  const handleNav = useCallback(
    (id: string) => {
      if (id === "home") {
        setAvatarError(false);
      }
      closeNavModal();
      navigateTo(id);
    },
    [closeNavModal],
  );

  return (
    <>
      <div
        ref={localSentinelRef}
        className="pointer-events-none absolute top-25 left-0 size-px opacity-0"
      />
      <nav
        aria-label="Main Navigation"
        className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center px-4 pt-safe-4 md:pt-6"
      >
        <div
          ref={capsuleRef}
          className={cn(
            "navbar-capsule pointer-events-auto relative isolate z-50 flex w-full max-w-85vw transform-gpu items-center justify-between gap-1 overflow-hidden rounded-full bg-surface/40 p-1.75 backdrop-blur-md backdrop-saturate-150 md:w-auto md:max-w-95vw md:justify-start md:gap-1.5",
            scrolled && "bg-surface/60",
          )}
        >
          <Tabs
            value={active}
            onChange={handleNav}
            layoutId="active-nav-highlight"
            role={null}
            highlightClassName="navbar-highlight-flat"
            className="flex items-center gap-1 md:gap-1.5"
          >
            {/* Home Button (Avatar + Name) */}
            <Tab
              value="home"
              tabIndex={0}
              highlightClassName="hidden md:block"
              className="relative z-10 flex items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5 text-sm text-muted transition-colors duration-200 select-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none focus-visible:ring-inset md:py-2.25 md:pr-3.75 md:pl-2.25"
              activeClassName="text-text-primary"
              aria-label="Home"
            >
              <span className="relative z-10 flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/5 bg-bg">
                {avatarError ? (
                  <span className="font-mono text-sm leading-none font-bold tracking-normal text-accent select-none">
                    OMO
                  </span>
                ) : (
                  <img
                    src="https://avatars.githubusercontent.com/u/36997301?v=4&s=24"
                    onError={() => setAvatarError(true)}
                    alt="Ondrej Michal Ockaj"
                    width="24"
                    height="24"
                    className="size-full object-cover outline-1 -outline-offset-1 outline-white/8"
                  />
                )}
              </span>

              <span className="xs:max-w-none max-w-35 truncate py-0.5 text-sm leading-normal font-semibold">
                Ondrej Michal Očkaj
              </span>
            </Tab>

            {/* Nav links (Desktop Only) */}
            <div className="hidden items-center gap-0.5 md:flex">
              {NAV_LINKS.map((link) => (
                <Tab
                  key={link.id}
                  value={link.id}
                  tabIndex={0}
                  className="relative z-10 rounded-full px-3 py-1.5 text-sm text-muted transition-colors duration-200 select-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none focus-visible:ring-inset md:px-4.75 md:py-2.75"
                  activeClassName="text-text-primary"
                >
                  <span>{link.label}</span>
                </Tab>
              ))}

              {/* Contact link (Desktop Only) */}
              <Tab
                value="contact"
                tabIndex={0}
                className="relative z-10 rounded-full px-3 py-1.5 text-sm text-muted transition-colors duration-200 select-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none focus-visible:ring-inset md:px-4.75 md:py-2.75"
                activeClassName="text-text-primary"
              >
                <span>Contact</span>
              </Tab>
            </div>
          </Tabs>

          {/* Hamburger Menu Toggle (Mobile Only) */}
          <div className="flex md:hidden">
            <LiquidGlassButton
              type="button"
              onClick={handleToggle}
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
        {isMobile ? (
          <MobileMenu
            isOpen={isOpen}
            active={active}
            navLinks={NAV_LINKS}
            onClose={closeNavModal}
            onChange={handleNav}
          />
        ) : null}
      </nav>
    </>
  );
}
