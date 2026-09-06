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
  isBpmnOpen: boolean;
  cvLang: "en" | "sk";
  activeSection: string;
  completeLoading: () => void;
  setCvOpen: (isOpen: boolean) => void;
  setBpmnOpen: (isOpen: boolean) => void;
  setCvLang: (lang: "en" | "sk") => void;
  setActiveSection: (section: string) => void;
}

const getInitialLoading = (): boolean => {
  if (isBoneyardBuild()) {
    return false;
  }
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  ) {
    return false;
  }
  try {
    return !localStorage.getItem("portfolio_loaded");
  } catch {
    return true;
  }
};

const getInitialActiveSection = (): string => {
  if (typeof window === "undefined") {
    return "home";
  }
  try {
    const hash = window.location.hash.substring(1);
    return hash in LABEL_MAP ? hash : "home";
  } catch {
    return "home";
  }
};

export const useAppStore = create<AppState>((set) => ({
  isLoading: getInitialLoading(),
  isCvOpen: false,
  isBpmnOpen: false,
  activeSection: getInitialActiveSection(),
  cvLang: "en",
  completeLoading: () => {
    try {
      localStorage.setItem("portfolio_loaded", "true");
    } catch {
      // Ignore errors (e.g. private browsing restrictions)
    }
    set({ isLoading: false });
  },
  setCvOpen: (isOpen: boolean) => set({ isCvOpen: isOpen }),
  setBpmnOpen: (isOpen: boolean) => set({ isBpmnOpen: isOpen }),
  setCvLang: (lang: "en" | "sk") =>
    set((state) => (state.cvLang === lang ? state : { cvLang: lang })),
  setActiveSection: (section: string) =>
    set((state) =>
      state.activeSection === section ? state : { activeSection: section },
    ),
}));
