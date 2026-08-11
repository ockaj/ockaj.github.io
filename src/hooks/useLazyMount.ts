import { useState, useEffect, useRef } from "react";

interface UseLazyMountOptions {
  rootMargin?: string;
}

const DEFAULT_LAZY_OPTIONS: UseLazyMountOptions = {};

export function useLazyMount(
  options: UseLazyMountOptions = DEFAULT_LAZY_OPTIONS,
) {
  // Always mount immediately in development mode so boneyard CLI can capture DOM layout for skeletons
  const isDev = typeof import.meta !== "undefined" && !!import.meta.env?.DEV;

  const [hasIntersected, setHasIntersected] = useState(isDev);
  const hasIntersectedRef = useRef(isDev);
  const ref = useRef<HTMLElement | null>(null);

  // Destructure to avoid object reference changes re-triggering the effect
  const rootMargin = options.rootMargin ?? "300px";

  useEffect(() => {
    // Exit if already loaded, in dev mode, or running on the server
    if (hasIntersectedRef.current || isDev || typeof window === "undefined")
      return;

    const element = ref.current;
    if (!element) return;

    let observer: IntersectionObserver | null = null;
    let focusListenerActive = true;

    // Trigger immediate mount and clean up listeners
    const triggerMount = () => {
      hasIntersectedRef.current = true;
      setHasIntersected(true);

      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (focusListenerActive) {
        element.removeEventListener("focusin", triggerMount);
        focusListenerActive = false;
      }
    };

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          triggerMount();
        }
      },
      { rootMargin, threshold: 0 },
    );
    observer.observe(element);

    // Set up focusin listener for accessibility (a11y)
    // When a keyboard user tabs to focus an element inside this section,
    // trigger an immediate mount so focus is not lost.
    element.addEventListener("focusin", triggerMount);

    return () => {
      if (observer) {
        observer.disconnect();
      }
      if (focusListenerActive) {
        element.removeEventListener("focusin", triggerMount);
      }
    };
  }, [rootMargin, isDev]);

  return [ref, hasIntersected] as const;
}
