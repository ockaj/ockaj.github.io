export interface PdfState {
  activeTab: "pdf" | "interactive";
  lang: "en" | "sk";
  pdfLoading: boolean;
  isTransitioning: boolean;
}

export type PdfAction =
  | { type: "CHANGE_TAB"; tab: "pdf" | "interactive" }
  | { type: "SET_LANG"; lang: "en" | "sk" }
  | { type: "SET_PDF_LOADING"; loading: boolean }
  | { type: "SET_IS_TRANSITIONING"; transitioning: boolean };

export function pdfReducer(state: PdfState, action: PdfAction): PdfState {
  switch (action.type) {
    case "CHANGE_TAB":
      return { ...state, activeTab: action.tab, isTransitioning: true };
    case "SET_LANG":
      return { ...state, lang: action.lang };
    case "SET_PDF_LOADING":
      return { ...state, pdfLoading: action.loading };
    case "SET_IS_TRANSITIONING":
      return { ...state, isTransitioning: action.transitioning };
    default:
      return state;
  }
}
