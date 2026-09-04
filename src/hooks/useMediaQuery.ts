import { useCallback, useSyncExternalStore } from "react";

interface MediaQueryStore {
  mql: MediaQueryList;
  subscribers: Set<() => void>;
  listener: () => void;
}

const stores = new Map<string, MediaQueryStore>();

if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as { __mqStores: typeof stores }).__mqStores = stores;
}

function getOrCreateStore(query: string): MediaQueryStore | null {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return null;
  }

  let store = stores.get(query);
  if (!store) {
    const mql = window.matchMedia(query);
    const subscribers = new Set<() => void>();
    const listener = () => {
      Array.from(subscribers).forEach((cb) => cb());
    };

    store = { mql, subscribers, listener };
    stores.set(query, store);
  }
  return store;
}

function subscribeMediaQuery(query: string, callback: () => void): () => void {
  const store = getOrCreateStore(query);
  if (!store) {
    return () => {
      /* no-op SSR cleanup */
    };
  }

  if (store.subscribers.size === 0) {
    store.mql.addEventListener("change", store.listener);
  }
  store.subscribers.add(callback);

  return () => {
    store.subscribers.delete(callback);
    if (store.subscribers.size === 0) {
      store.mql.removeEventListener("change", store.listener);
      stores.delete(query);
    }
  };
}

function getMediaQuerySnapshot(query: string): boolean {
  const store = getOrCreateStore(query);
  return store ? store.mql.matches : false;
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
