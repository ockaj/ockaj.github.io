import { create } from "zustand";
import { isBoneyardBuild } from "../utils/boneyard";

export const LABEL_MAP: Record<string, string> = {
  home: "Home",
  work: "Case Studies",
  skills: "Skills",
  processes: "Process Library",
  journal: "Journal",
  faq: "FAQ",
  contact: "Contact",
};

export interface AppState {
  isLoading: boolean;
  isCvOpen: boolean;
  activeSection: string;
  completeLoading: () => void;
  setCvOpen: (isOpen: boolean) => void;
  setActiveSection: (section: string) => void;
}

const getInitialLoading = (): boolean => {
  if (isBoneyardBuild()) {
    return false;
  }
  try {
    return !sessionStorage.getItem("portfolio_loaded");
  } catch {
    return true;
  }
};

const getInitialActiveSection = (): string => {
  if (typeof window === "undefined") {
    return "Home";
  }
  try {
    const hash = window.location.hash.substring(1);
    return LABEL_MAP[hash] ?? "Home";
  } catch {
    return "Home";
  }
};

export const useAppStore = create<AppState>((set) => ({
  isLoading: getInitialLoading(),
  isCvOpen: false,
  activeSection: getInitialActiveSection(),
  completeLoading: () => {
    try {
      sessionStorage.setItem("portfolio_loaded", "true");
    } catch {
      // Ignore errors (e.g. private browsing restrictions)
    }
    set({ isLoading: false });
  },
  setCvOpen: (isOpen: boolean) => set({ isCvOpen: isOpen }),
  setActiveSection: (section: string) =>
    set((state) =>
      state.activeSection === section ? state : { activeSection: section },
    ),
}));
