import { create } from "zustand";

export const PENDING_PROMISE = new Promise<void>(() => {});

export function SuspenseTrigger(): null {
  throw PENDING_PROMISE;
  return null;
}

export interface AppState {
  isLoading: boolean;
  isCvOpen: boolean;
  completeLoading: () => void;
  setCvOpen: (isOpen: boolean) => void;
}

const getInitialLoading = (): boolean => {
  if (
    typeof window !== "undefined" &&
    (window as unknown as { __BONEYARD_BUILD?: boolean }).__BONEYARD_BUILD
  ) {
    return false;
  }
  try {
    return !sessionStorage.getItem("portfolio_loaded");
  } catch {
    return true;
  }
};

export const useAppStore = create<AppState>((set) => ({
  isLoading: getInitialLoading(),
  isCvOpen: false,
  completeLoading: () => {
    try {
      sessionStorage.setItem("portfolio_loaded", "true");
    } catch {
      // Ignore errors (e.g. private browsing restrictions)
    }
    set({ isLoading: false });
  },
  setCvOpen: (isOpen: boolean) => set({ isCvOpen: isOpen }),
}));
