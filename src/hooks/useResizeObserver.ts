import { useEffect, useEffectEvent, type RefObject } from "react";

type ResizeCallback = (entry: ResizeObserverEntry) => void;

const callbacks = new Map<Element, Set<ResizeCallback>>();
let observerInstance: ResizeObserver | null = null;

function getObserver(): ResizeObserver | null {
  if (typeof window === "undefined" || typeof ResizeObserver === "undefined") {
    return null;
  }
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
}

export function subscribeResizeObserver(
  target: Element | null,
  callback: ResizeCallback,
): () => void {
  if (!target) {
    return () => {
      /* no-op cleanup when target is null */
    };
  }
  const observer = getObserver();
  if (!observer) {
    return () => {
      /* no-op SSR cleanup */
    };
  }

  let cbs = callbacks.get(target);
  if (!cbs) {
    cbs = new Set();
    callbacks.set(target, cbs);
    observer.observe(target);
  }
  cbs.add(callback);

  return () => {
    const currentCbs = callbacks.get(target);
    if (!currentCbs) return;

    currentCbs.delete(callback);
    if (currentCbs.size === 0) {
      callbacks.delete(target);
      observer.unobserve(target);
      if (callbacks.size === 0 && observerInstance) {
        observerInstance.disconnect();
        observerInstance = null;
      }
    }
  };
}

export function useResizeObserver<T extends Element = Element>(
  element: T | null | RefObject<T | null>,
  callback: ResizeCallback,
) {
  const onResize = useEffectEvent(callback);

  useEffect(() => {
    const target = element && "current" in element ? element.current : element;
    if (!target) return;
    return subscribeResizeObserver(target, (entry) => onResize(entry));
  }, [element]);
}
