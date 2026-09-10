import { create } from "zustand";
import { isBoneyardBuild } from "../utils/boneyard";
import {
  resolveSectionFromHash,
  isValidModalHash,
  isTransientModalHash,
  normalizeHash,
} from "../utils/sectionResolution";

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
  hasCvMounted: boolean;
  activeSection: string;
  activeModal: string | null;
  cvLang: "en" | "sk";
  completeLoading: () => void;
  mountCv: () => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  setCvLang: (lang: "en" | "sk") => void;
  setActiveSection: (section: string) => void;
}

export const selectIsAnyModalOpen = (state: AppState): boolean =>
  state.activeModal !== null;

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
    return resolveSectionFromHash(window.location.hash);
  } catch {
    return "home";
  }
};

const getInitialActiveModal = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.location.hash;
    if (!raw || !isValidModalHash(raw) || isTransientModalHash(raw)) {
      return null;
    }
    return normalizeHash(raw);
  } catch {
    return null;
  }
};

export const useAppStore = create<AppState>((set) => ({
  isLoading: getInitialLoading(),
  hasCvMounted:
    typeof window !== "undefined" &&
    window.location.hash.toLowerCase().startsWith("#cv"),
  activeSection: getInitialActiveSection(),
  activeModal: getInitialActiveModal(),
  cvLang: "en",
  completeLoading: () => {
    try {
      localStorage.setItem("portfolio_loaded", "true");
    } catch {
      // Ignore errors (e.g. private browsing restrictions)
    }
    set({ isLoading: false });
  },
  mountCv: () =>
    set((state) => (state.hasCvMounted ? state : { hasCvMounted: true })),
  openModal: (id: string) =>
    set((state) => ({
      activeModal: id,
      hasCvMounted: id === "cv" ? true : state.hasCvMounted,
    })),
  closeModal: () =>
    set((state) =>
      state.activeModal === null ? state : { activeModal: null },
    ),
  setCvLang: (lang: "en" | "sk") =>
    set((state) => (state.cvLang === lang ? state : { cvLang: lang })),
  setActiveSection: (section: string) =>
    set((state) =>
      state.activeSection === section ? state : { activeSection: section },
    ),
}));
