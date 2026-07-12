import { useEffect, useRef } from "react";

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

export function useResizeObserver(
  element: Element | null,
  callback: ResizeCallback,
) {
  const savedCallbackRef = useRef(callback);
  useEffect(() => {
    savedCallbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!element) return;
    const observer = getObserver();
    if (!observer) return;

    callbacks.set(element, (entry) => savedCallbackRef.current(entry));
    observer.observe(element);

    return () => {
      observer.unobserve(element);
      callbacks.delete(element);
    };
  }, [element]);
}
