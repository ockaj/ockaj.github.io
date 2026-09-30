import {
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  startTransition,
} from "react";
import {
  useAppStore,
  selectIsAnyModalOpen,
  LABEL_MAP,
} from "../store/useAppStore";
import {
  resolveSectionFromHash,
  isValidModalHash,
  isTransientModalHash,
  normalizeHash,
  safeDecodeFragment,
  findIndicatedElement,
} from "../utils/sectionResolution";
import { useIsMobile } from "./useMediaQuery";
const SECTIONS = Object.keys(LABEL_MAP);
const SECTIONS_SET = new Set(SECTIONS);

function resolveSection(target: string): string | null {
  const clean = normalizeHash(target);
  return clean in LABEL_MAP ? clean : null;
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

  startTransition(() => {
    useAppStore.getState().setActiveSection(sectionId);
  });
  setNavigationLock();

  const isReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const scrollBehavior =
    options?.behavior ?? (isReduced ? "instant" : "smooth");

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

/**
 * Synchronize focus to target element for accessibility.
/**
 * Scroll to document top.
 */
function handleTopNavigation(behavior: ScrollBehavior): void {
  startTransition(() => {
    useAppStore.getState().closeModal();
    useAppStore.getState().setActiveSection("home");
  });
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior });
    if (
      behavior === "instant" &&
      typeof requestAnimationFrame !== "undefined"
    ) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
      });
    }
  }
}

/**
 * Navigate to target section.
 */
function handleSectionNavigation(
  sectionId: string,
  behavior: ScrollBehavior,
): void {
  startTransition(() => {
    useAppStore.getState().closeModal();
  });
  navigateTo(sectionId, { behavior, replace: true });
  const targetElement = findIndicatedElement(sectionId);
  if (!targetElement) return;

  if (behavior === "instant" && typeof requestAnimationFrame !== "undefined") {
    requestAnimationFrame(() => {
      targetElement.scrollIntoView({ behavior: "instant" });
    });
  }
}

/**
 * Align viewport to parent section of an active modal.
 */
function alignParentSection(clean: string, behavior: ScrollBehavior): void {
  const parentSection = resolveSectionFromHash(clean);
  if (!parentSection || parentSection === "home") return;

  const alignScroll = () => {
    const element = document.getElementById(parentSection);
    if (element) {
      element.scrollIntoView({ behavior });
    }
  };
  alignScroll();
  if (behavior === "instant" && typeof requestAnimationFrame !== "undefined") {
    requestAnimationFrame(alignScroll);
  }
}

/**
 * Handle modal fragments and route changes.
 */
function handleModalNavigation(
  clean: string,
  isMobile: boolean,
  behavior: ScrollBehavior,
): boolean {
  if (isTransientModalHash(clean)) {
    startTransition(() => {
      useAppStore.getState().closeModal();
    });
    if (typeof window !== "undefined") {
      window.history.replaceState(window.history.state, "", "#home");
    }
    return true;
  }

  if (clean === "bpmn") {
    if (isMobile) {
      startTransition(() => {
        useAppStore.getState().closeModal();
      });
      if (typeof window !== "undefined") {
        window.history.replaceState(window.history.state, "", "#home");
      }
      return true;
    }
    startTransition(() => {
      useAppStore.getState().openModal("bpmn");
    });
    return true;
  }

  if (isValidModalHash(clean)) {
    startTransition(() => {
      useAppStore.getState().openModal(clean);
    });
    alignParentSection(clean, behavior);
    return true;
  }

  return false;
}

/**
 * Resolve target fragment and apply navigation actions.
 */
export function applyHashNavigation(
  hash: string,
  isMobile: boolean,
  behavior: ScrollBehavior = "smooth",
): void {
  const clean = normalizeHash(hash);
  if (!clean) {
    startTransition(() => {
      useAppStore.getState().closeModal();
    });
    return;
  }

  const isReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const effectiveBehavior = isReduced ? "instant" : behavior;

  if (clean === "top") {
    handleTopNavigation(effectiveBehavior);
    return;
  }

  const resolvedSection = resolveSection(clean);
  if (resolvedSection) {
    handleSectionNavigation(resolvedSection, effectiveBehavior);
    return;
  }

  if (handleModalNavigation(clean, isMobile, effectiveBehavior)) {
    return;
  }

  const rawDecoded = safeDecodeFragment(hash)
    .split("?")[0]
    .split("&")[0]
    .trim();
  const indicatedElement =
    findIndicatedElement(rawDecoded) || findIndicatedElement(clean);
  if (indicatedElement) {
    startTransition(() => {
      useAppStore.getState().closeModal();
    });
    indicatedElement.scrollIntoView({ behavior: effectiveBehavior });
    if (
      effectiveBehavior === "instant" &&
      typeof requestAnimationFrame !== "undefined"
    ) {
      requestAnimationFrame(() => {
        indicatedElement.scrollIntoView({ behavior: "instant" });
      });
    }
    return;
  }

  startTransition(() => {
    useAppStore.getState().closeModal();
  });
  if (typeof window !== "undefined") {
    window.history.replaceState(window.history.state, "", "#home");
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
          const isModalActive =
            (!!currentHash && !SECTIONS_SET.has(currentHash)) ||
            selectIsAnyModalOpen(useAppStore.getState());

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

/**
 * Register the passive hashchange listener on the window.
 * Return a function that removes the listener.
 */
export function setupHashNavigationListener(isMobile: boolean): () => void {
  const onHashChange = () => {
    applyHashNavigation(window.location.hash, isMobile, "smooth");
  };

  window.addEventListener("hashchange", onHashChange, { passive: true });

  return () => {
    window.removeEventListener("hashchange", onHashChange);
  };
}

export function useNavigation() {
  const isLoading = useAppStore((state) => state.isLoading);
  const isMobile = useIsMobile();
  const visibleSectionsRef = useRef(new Set<string>());

  useEffect(() => {
    if (isLoading) return;

    applyHashNavigation(window.location.hash, isMobile, "instant");

    return setupHashNavigationListener(isMobile);
  }, [isLoading, isMobile]);

  useScrollSpy(isLoading, visibleSectionsRef);

  return { navigateTo };
}

type OverlayCallback = () => void;

/**
 * Synchronize SPA modal visibility with URL hash fragments.
 * Return user to parent section when closed.
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
        const parentSection = resolveSectionFromHash(hashId);
        const previousSection = previousHashRef.current
          ? resolveSection(previousHashRef.current)
          : null;
        const fallbackHash = previousSection
          ? `#${previousSection}`
          : `#${parentSection}`;
        window.history.replaceState(window.history.state, "", fallbackHash);
      }
    };
  }, [isOpen, hashId]);
}

export interface ModalController {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/**
 * Universal hook to control any modal or overlay in the application.
 * Selects derived boolean open state from useAppStore and synchronizes
 * with browser URL hash history and device Back button via useOverlay.
 */
export function useModal(id: string): ModalController {
  const isOpen = useAppStore((state) => state.activeModal === id);

  const open = useCallback(() => {
    startTransition(() => {
      useAppStore.getState().openModal(id);
    });
  }, [id]);

  const close = useCallback(() => {
    startTransition(() => {
      useAppStore.getState().closeModal();
    });
  }, []);

  useOverlay(isOpen, close, id);

  return {
    isOpen,
    open,
    close,
  };
}
