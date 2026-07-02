import { useEffect, type Dispatch } from "react";
import { type AppAction } from "../appReducer";
import { LABEL_MAP } from "./useScrollSpy";

interface UseHashNavigationProps {
  isLoading: boolean;
  dispatch: Dispatch<AppAction>;
}

export function useHashNavigation({
  isLoading,
  dispatch,
}: UseHashNavigationProps): void {
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
          dispatch({ type: "SET_ACTIVE_SECTION", section: label });
          element?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, dispatch]);
}
