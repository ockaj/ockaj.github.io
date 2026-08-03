import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    () =>
      typeof window !== "undefined" ? window.matchMedia(query).matches : false,
    () => false,
  );
}

export const useIsMobile = () => useMediaQuery("(max-width: 767px)");
