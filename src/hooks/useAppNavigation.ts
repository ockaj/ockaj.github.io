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

  useAppStore.getState().setActiveSection(sectionId);
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

export function useNavigation() {
  const isLoading = useAppStore((state) => state.isLoading);
  const isMobile = useIsMobile();
  const visibleSectionsRef = useRef(new Set<string>());

  useEffect(() => {
    if (isLoading) return;
    const clean = normalizeHash(window.location.hash);
    if (!clean) return;

    const resolvedId = resolveSection(clean);
    if (resolvedId) {
      navigateTo(resolvedId, { behavior: "instant", replace: true });
      return;
    }

    if (isTransientModalHash(clean)) {
      useAppStore.getState().closeModal();
      window.history.replaceState(window.history.state, "", "#home");
      return;
    }

    if (clean === "bpmn") {
      if (!isMobile) {
        useAppStore.getState().openModal("bpmn");
      } else {
        useAppStore.getState().closeModal();
        window.history.replaceState(window.history.state, "", "#home");
      }
      return;
    }

    if (isValidModalHash(clean)) {
      useAppStore.getState().openModal(clean);
      const parentSection = resolveSectionFromHash(clean);
      if (parentSection && parentSection !== "home") {
        const alignScroll = () => {
          const element = document.getElementById(parentSection);
          if (element) {
            element.scrollIntoView({ behavior: "instant" });
          }
        };
        alignScroll();
        requestAnimationFrame(alignScroll);
      }
      return;
    }

    window.history.replaceState(window.history.state, "", "#home");
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
    useAppStore.getState().openModal(id);
  }, [id]);

  const close = useCallback(() => {
    useAppStore.getState().closeModal();
  }, []);

  useOverlay(isOpen, close, id);

  return {
    isOpen,
    open,
    close,
  };
}
