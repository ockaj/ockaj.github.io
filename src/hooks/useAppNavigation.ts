import {
  useState,
  useEffect,
  useRef,
  useCallback,
  startTransition,
} from "react";
import { useAppStore } from "../store/useAppStore";

export const LABEL_MAP: Record<string, string> = {
  home: "Home",
  work: "Case Studies",
  skills: "Skills",
  processes: "Process Library",
  journal: "Journal",
  contact: "Contact",
};

const SECTIONS = Object.keys(LABEL_MAP);
const SECTIONS_SET = new Set(SECTIONS);
const REVERSE_LABEL_MAP = new Map(
  Object.entries(LABEL_MAP).map(([id, label]) => [label, id]),
);

export function useNavigation() {
  const isLoading = useAppStore((state) => state.isLoading);

  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window === "undefined") return "Home";
    const hash = window.location.hash.substring(1);
    return LABEL_MAP[hash] ?? "Home";
  });

  const isNavigatingRef = useRef(false);
  const visibleSectionsRef = useRef(new Set<string>());

  const handleNavClick = useCallback((section: string) => {
    setActiveSection(section);
    isNavigatingRef.current = true;

    window.addEventListener(
      "scrollend",
      () => {
        isNavigatingRef.current = false;
      },
      { once: true, passive: true },
    );

    const isReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const scrollBehavior = isReduced ? "auto" : "smooth";
    const sectionId = REVERSE_LABEL_MAP.get(section);

    if (sectionId) {
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: scrollBehavior });

      const newHash = `#${sectionId}`;
      if (window.location.hash !== newHash) {
        window.history.pushState(window.history.state, "", newHash);
      }
    }
  }, []);

  // Scroll spy effect
  useEffect(() => {
    if (isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleSectionsRef.current.add(entry.target.id);
          } else {
            visibleSectionsRef.current.delete(entry.target.id);
          }
        });

        if (isNavigatingRef.current) return;

        const targetId = SECTIONS.findLast((id) =>
          visibleSectionsRef.current.has(id),
        );
        if (targetId) {
          const sectionLabel = LABEL_MAP[targetId] ?? "Home";
          startTransition(() => {
            setActiveSection(sectionLabel);
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

    SECTIONS.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [isLoading]);

  // Initial deep-linking hash effect
  useEffect(() => {
    if (isLoading) return;
    const hash = window.location.hash;
    if (hash) {
      const targetId = hash.substring(1);
      if (targetId in LABEL_MAP) {
        document
          .getElementById(targetId)
          ?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [isLoading]);

  return { activeSection, handleNavClick };
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
  useEffect(() => {
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
