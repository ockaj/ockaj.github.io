import { create } from "zustand";

export interface CvState {
  lang: "en" | "sk";
  activeTab: "interactive" | "pdf";
  setLang: (lang: "en" | "sk") => void;
  setActiveTab: (tab: "interactive" | "pdf") => void;
  reset: () => void;
}

export const useCvStore = create<CvState>((set) => ({
  lang: "en",
  activeTab: "interactive",
  setLang: (lang) => set((state) => (state.lang === lang ? state : { lang })),
  setActiveTab: (tab) =>
    set((state) => (state.activeTab === tab ? state : { activeTab: tab })),
  reset: () =>
    set({
      lang: "en",
      activeTab: "interactive",
    }),
}));
