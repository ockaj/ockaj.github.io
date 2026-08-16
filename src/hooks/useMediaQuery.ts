import { useCallback, useSyncExternalStore } from "react";

interface MediaQueryStore {
  mql: MediaQueryList;
  subscribers: Set<() => void>;
  listener: () => void;
}

const stores = new Map<string, MediaQueryStore>();

function subscribeMediaQuery(query: string, callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {
      /* no-op SSR cleanup */
    };
  }

  let store = stores.get(query);
  if (!store) {
    const mql = window.matchMedia(query);
    const subscribers = new Set<() => void>();
    const listener = () => {
      subscribers.forEach((cb) => cb());
    };

    mql.addEventListener("change", listener);
    store = { mql, subscribers, listener };
    stores.set(query, store);
  }

  store.subscribers.add(callback);

  return () => {
    const currentStore = stores.get(query);
    if (!currentStore) return;

    currentStore.subscribers.delete(callback);
    if (currentStore.subscribers.size === 0) {
      currentStore.mql.removeEventListener("change", currentStore.listener);
      stores.delete(query);
    }
  };
}

function getMediaQuerySnapshot(query: string): boolean {
  if (typeof window === "undefined") return false;
  const store = stores.get(query);
  return store ? store.mql.matches : window.matchMedia(query).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => subscribeMediaQuery(query, callback),
    [query],
  );
  const getSnapshot = useCallback(() => getMediaQuerySnapshot(query), [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const useIsMobile = () => !useMediaQuery("(min-width: 768px)");
