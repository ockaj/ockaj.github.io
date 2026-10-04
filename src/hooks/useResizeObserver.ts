import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

type ResizeCallback = (entry: ResizeObserverEntry) => void;

const callbacks = new Map<Element, Set<ResizeCallback>>();
let observerInstance: ResizeObserver | null = null;

const getObserver = () => {
  if (typeof window === "undefined") return null;
  if (!observerInstance) {
    observerInstance = new ResizeObserver((entries) => {
      // Use requestAnimationFrame to prevent "ResizeObserver loop limit exceeded" errors
      requestAnimationFrame(() => {
        for (const entry of entries) {
          const cbs = callbacks.get(entry.target);
          if (cbs) {
            for (const cb of cbs) {
              cb(entry);
            }
          }
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

    const cb: ResizeCallback = (entry) => savedCallbackRef.current(entry);
    let cbs = callbacks.get(target);
    if (!cbs) {
      cbs = new Set();
      callbacks.set(target, cbs);
      observer.observe(target);
    }
    cbs.add(cb);

    return () => {
      const currentCbs = callbacks.get(target);
      if (currentCbs) {
        currentCbs.delete(cb);
        if (currentCbs.size === 0) {
          callbacks.delete(target);
          observer.unobserve(target);
        }
      }
    };
  }, [element]);
}
