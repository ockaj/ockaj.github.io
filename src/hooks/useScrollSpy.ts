import {
  useEffect,
  useRef,
  useCallback,
  startTransition,
  type Dispatch,
} from "react";
import { type AppAction } from "../appReducer";

export const LABEL_MAP: Record<string, string> = {
  home: "Home",
  work: "Case Studies",
  skills: "Skills",
  processes: "Process Library",
  journal: "Journal",
  contact: "Contact",
};

interface UseScrollSpyProps {
  isLoading: boolean;
  dispatch: Dispatch<AppAction>;
}

export function useScrollSpy({ isLoading, dispatch }: UseScrollSpyProps) {
  const ignoreScrollUntilRef = useRef(0);
  const visibleSectionsRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (isLoading) return;

    const sections = [
      "home",
      "work",
      "skills",
      "processes",
      "journal",
      "contact",
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        // Update the visibility status of all changed entries
        entries.forEach((entry) => {
          visibleSectionsRef.current[entry.target.id] = entry.isIntersecting;
        });

        // Ignore updates during programmatic scrolling
        if (Date.now() < ignoreScrollUntilRef.current) return;

        // Find all currently visible sections based on our visibility map
        const visible = sections.filter((id) => visibleSectionsRef.current[id]);
        if (visible.length > 0) {
          const targetId = visible[visible.length - 1];
          dispatch({
            type: "SET_ACTIVE_SECTION",
            section: LABEL_MAP[targetId] ?? "Home",
          });

          // Synchronize URL hash
          const newHash = `#${targetId}`;
          if (window.location.hash !== newHash) {
            window.history.replaceState(null, "", newHash);
          }
        }
      },
      { rootMargin: "-25% 0px -55% 0px" },
    );

    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [isLoading, dispatch]);

  const handleNavClick = useCallback(
    (section: string) => {
      startTransition(() => {
        dispatch({ type: "SET_ACTIVE_SECTION", section });
      });
      ignoreScrollUntilRef.current = Date.now() + 1000; // Lock scrollspy updates for 1s during smooth scroll

      // Synchronize URL hash
      const sectionId = Object.keys(LABEL_MAP).find(
        (key) => LABEL_MAP[key] === section,
      );
      if (sectionId) {
        const newHash = `#${sectionId}`;
        if (window.location.hash !== newHash) {
          window.history.pushState(null, "", newHash);
        }
      }
    },
    [dispatch],
  );

  return { handleNavClick };
}
