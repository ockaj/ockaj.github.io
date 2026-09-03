import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

type ResizeCallback = (entry: ResizeObserverEntry) => void;

const callbacks = new Map<Element, ResizeCallback>();
let observerInstance: ResizeObserver | null = null;

const getObserver = () => {
  if (typeof window === "undefined") return null;
  if (!observerInstance) {
    observerInstance = new ResizeObserver((entries) => {
      // Use requestAnimationFrame to prevent "ResizeObserver loop limit exceeded" errors
      requestAnimationFrame(() => {
        for (const entry of entries) {
          const cb = callbacks.get(entry.target);
          if (cb) cb(entry);
        }
      });
    });
  }
  return observerInstance;
};

export function useResizeObserver<T extends Element = Element>(
  element: T | null | RefObject<T | null>,
  callback: ResizeCallback,
) {
  const savedCallbackRef = useRef(callback);
  useLayoutEffect(() => {
    savedCallbackRef.current = callback;
  });

  useEffect(() => {
    const target = element && "current" in element ? element.current : element;
    if (!target) return;
    const observer = getObserver();
    if (!observer) return;

    callbacks.set(target, (entry) => savedCallbackRef.current(entry));
    observer.observe(target);

    return () => {
      observer.unobserve(target);
      callbacks.delete(target);
    };
  }, [element]);
}
