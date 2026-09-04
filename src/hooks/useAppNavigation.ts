import { useEffect, useLayoutEffect, useRef, startTransition } from "react";
import { useAppStore, LABEL_MAP } from "../store/useAppStore";
export { LABEL_MAP } from "../store/useAppStore";

const SECTIONS = Object.keys(LABEL_MAP);
const SECTIONS_SET = new Set(SECTIONS);
const REVERSE_LABEL_MAP = new Map(
  Object.entries(LABEL_MAP).map(([id, label]) => [label, id]),
);

const SECTION_ALIASES: Record<string, string> = {
  home: "home",
  work: "work",
  "case studies": "work",
  "case-studies": "work",
  skills: "skills",
  "skills & stack": "skills",
  "skills & competencies": "skills",
  processes: "processes",
  "process models": "processes",
  "process library": "processes",
  journal: "journal",
  "engineering log": "journal",
  "recent thought pieces": "journal",
  faq: "faq",
  contact: "contact",
  "get in touch": "contact",
};

export function resolveSection(
  target: string,
): { id: string; label: string } | null {
  if (!target) return null;
  const clean = target.startsWith("#") ? target.slice(1) : target;
  const trimmed = clean.trim();
  if (!trimmed) return null;

  if (trimmed in LABEL_MAP) {
    return { id: trimmed, label: LABEL_MAP[trimmed] };
  }

  if (REVERSE_LABEL_MAP.has(trimmed)) {
    const id = REVERSE_LABEL_MAP.get(trimmed)!;
    return { id, label: LABEL_MAP[id] ?? trimmed };
  }

  const lower = trimmed.toLowerCase();
  if (lower in LABEL_MAP) {
    return { id: lower, label: LABEL_MAP[lower] };
  }

  const aliasId = SECTION_ALIASES[lower];
  if (aliasId && aliasId in LABEL_MAP) {
    return { id: aliasId, label: LABEL_MAP[aliasId] };
  }

  for (const [id, label] of Object.entries(LABEL_MAP)) {
    if (label.toLowerCase() === lower) {
      return { id, label };
    }
  }

  return null;
}

let isNavigating = false;
let scrollEndCleanup: (() => void) | null = null;
let navigationTimeoutId: ReturnType<typeof setTimeout> | null = null;

export function setNavigationLock(duration = 1000): void {
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

  const resolved = resolveSection(target);
  if (!resolved) return;

  const { id: sectionId, label: sectionLabel } = resolved;

  useAppStore.getState().setActiveSection(sectionLabel);
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
          const sectionLabel = LABEL_MAP[targetId] ?? "Home";
          startTransition(() => {
            useAppStore.getState().setActiveSection(sectionLabel);
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

    const resolved = resolveSection(hash);
    if (resolved) {
      navigateTo(resolved.id, { behavior: "auto", replace: true });
    }
  }, [isLoading]);

  useScrollSpy(isLoading, visibleSectionsRef);

  return { navigateTo, handleNavClick: navigateTo };
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
