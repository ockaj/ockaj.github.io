import {
  useState,
  useEffect,
  useRef,
  useCallback,
  startTransition,
} from "react";

export const LABEL_MAP: Record<string, string> = {
  home: "Home",
  work: "Case Studies",
  skills: "Skills",
  processes: "Process Library",
  journal: "Journal",
  contact: "Contact",
};

interface UseNavigationOptions {
  isLoading: boolean;
}

export function useNavigation({ isLoading }: UseNavigationOptions) {
  const [activeSection, setActiveSection] = useState("Home");
  const ignoreScrollUntilRef = useRef(0);
  const visibleSectionsRef = useRef<Record<string, boolean>>({});

  const handleNavClick = useCallback((section: string) => {
    startTransition(() => {
      setActiveSection(() => section);
    });
    ignoreScrollUntilRef.current = Date.now() + 1000;

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
  }, []);

  // Scroll spy effect
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
        entries.forEach((entry) => {
          visibleSectionsRef.current[entry.target.id] = entry.isIntersecting;
        });

        if (Date.now() < ignoreScrollUntilRef.current) return;

        const visible = sections.filter((id) => visibleSectionsRef.current[id]);
        if (visible.length > 0) {
          const targetId = visible[visible.length - 1];
          const sectionLabel = LABEL_MAP[targetId] ?? "Home";

          startTransition(() => {
            setActiveSection(sectionLabel);
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
  }, [isLoading]);

  // Initial deep-linking hash effect
  useEffect(() => {
    if (isLoading) return;
    const hash = window.location.hash;
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (hash) {
      const targetId = hash.substring(1);
      const label = LABEL_MAP[targetId];
      if (label) {
        const element = document.getElementById(targetId);
        timer = setTimeout(() => {
          startTransition(() => {
            setActiveSection(label);
          });
          element?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading]);

  return { activeSection, handleNavClick };
}
