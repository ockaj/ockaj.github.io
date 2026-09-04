import { useEffect, useLayoutEffect, useRef, startTransition } from "react";
import { useAppStore, LABEL_MAP } from "../store/useAppStore";
const SECTIONS = Object.keys(LABEL_MAP);
const SECTIONS_SET = new Set(SECTIONS);

function resolveSection(target: string): string | null {
  if (!target) return null;
  const clean = (target.startsWith("#") ? target.slice(1) : target)
    .trim()
    .toLowerCase();
  if (clean in LABEL_MAP) {
    return clean;
  }
  return null;
}

let isNavigating = false;
let scrollEndCleanup: (() => void) | null = null;
let navigationTimeoutId: ReturnType<typeof setTimeout> | null = null;

function setNavigationLock(duration = 1000): void {
  isNavigating = true;

  if (scrollEndCleanup) {
    scrollEndCleanup();
    scrollEndCleanup = null;
  }
  if (navigationTimeoutId !== null) {
    clearTimeout(navigationTimeoutId);
    navigationTimeoutId = null;
  }

  const unlock = () => {
    isNavigating = false;
    if (scrollEndCleanup) {
      scrollEndCleanup();
      scrollEndCleanup = null;
    }
    if (navigationTimeoutId !== null) {
      clearTimeout(navigationTimeoutId);
      navigationTimeoutId = null;
    }
  };

  if (typeof window !== "undefined") {
    const onScrollEnd = () => {
      unlock();
    };

    window.addEventListener("scrollend", onScrollEnd, {
      once: true,
      passive: true,
    });
    window.addEventListener("wheel", unlock, { once: true, passive: true });
    window.addEventListener("touchstart", unlock, {
      once: true,
      passive: true,
    });

    scrollEndCleanup = () => {
      window.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("wheel", unlock);
      window.removeEventListener("touchstart", unlock);
    };
    navigationTimeoutId = setTimeout(unlock, duration);
  }
}

export interface NavigateToOptions {
  behavior?: ScrollBehavior;
  replace?: boolean;
}

export function navigateTo(target: string, options?: NavigateToOptions): void {
  if (typeof window === "undefined") return;

  const sectionId = resolveSection(target);
  if (!sectionId) return;

  useAppStore.getState().setActiveSection(sectionId);
  setNavigationLock();

  const isReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const scrollBehavior = options?.behavior ?? (isReduced ? "auto" : "smooth");

  document
    .getElementById(sectionId)
    ?.scrollIntoView({ behavior: scrollBehavior });

  const newHash = `#${sectionId}`;
  if (window.location.hash !== newHash) {
    if (options?.replace) {
      window.history.replaceState(window.history.state, "", newHash);
    } else {
      window.history.pushState(window.history.state, "", newHash);
    }
  }
}

function useScrollSpy(
  isLoading: boolean,
  visibleSectionsRef: React.RefObject<Set<string>>,
) {
  useEffect(() => {
    if (isLoading) return;

    const visibleSections = visibleSectionsRef.current;
    if (!visibleSections) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleSections.add(entry.target.id);
          } else {
            visibleSections.delete(entry.target.id);
          }
        });

        if (isNavigating) return;

        const targetId = SECTIONS.findLast((id) => visibleSections.has(id));
        if (targetId) {
          startTransition(() => {
            useAppStore.getState().setActiveSection(targetId);
          });

          const newHash = `#${targetId}`;
          const currentHash = window.location.hash.substring(1);
          const isModalActive = !!currentHash && !SECTIONS_SET.has(currentHash);

          if (window.location.hash !== newHash && !isModalActive) {
            window.history.replaceState(window.history.state, "", newHash);
          }
        }
      },
      { rootMargin: "-25% 0px -55% 0px" },
    );

    for (const id of SECTIONS) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [isLoading, visibleSectionsRef]);
}

export function useNavigation() {
  const isLoading = useAppStore((state) => state.isLoading);
  const visibleSectionsRef = useRef(new Set<string>());

  useEffect(() => {
    if (isLoading) return;
    const hash = window.location.hash;
    if (!hash) return;

    if (hash === "#cv") {
      useAppStore.getState().setCvOpen(true);
      return;
    }

    if (hash === "#bpmn") {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      if (!isMobile) {
        useAppStore.getState().setBpmnOpen(true);
      } else {
        window.history.replaceState(window.history.state, "", "#home");
      }
      return;
    }

    const resolvedId = resolveSection(hash);
    if (resolvedId) {
      navigateTo(resolvedId, { behavior: "auto", replace: true });
    }
  }, [isLoading]);

  useScrollSpy(isLoading, visibleSectionsRef);

  return { navigateTo };
}

type OverlayCallback = () => void;

/**
 * Synchronizes SPA modal visibility with URL hash fragments (`#cv`, `#bpmn`, `#lightbox-1`).
 * Integrated into unified navigation system in useAppNavigation.ts.
 */
export function useOverlay(
  isOpen: boolean,
  onClose: OverlayCallback,
  hashId = "modal",
) {
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  const previousHashRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const targetHash = `#${hashId}`;

    if (window.location.hash !== targetHash) {
      previousHashRef.current = window.location.hash || "#home";
      window.history.pushState(window.history.state, "", targetHash);
    }

    const handleHashSync = () => {
      if (window.location.hash !== targetHash) {
        onCloseRef.current();
      }
    };

    window.addEventListener("popstate", handleHashSync);

    return () => {
      window.removeEventListener("popstate", handleHashSync);

      if (window.location.hash === targetHash) {
        const fallbackHash = previousHashRef.current || "#home";
        window.history.replaceState(window.history.state, "", fallbackHash);
      }
    };
  }, [isOpen, hashId]);
}
