export interface PdfState {
  activeTab: "pdf" | "interactive";
  pdfLoading: boolean;
  isTransitioning: boolean;
}

export type PdfAction =
  | { type: "CHANGE_TAB"; tab: "pdf" | "interactive" }
  | { type: "SET_PDF_LOADING"; loading: boolean }
  | { type: "SET_IS_TRANSITIONING"; transitioning: boolean };

export function pdfReducer(state: PdfState, action: PdfAction): PdfState {
  switch (action.type) {
    case "CHANGE_TAB":
      if (state.activeTab === action.tab) return state;
      return { ...state, activeTab: action.tab, isTransitioning: true };
    case "SET_PDF_LOADING":
      if (state.pdfLoading === action.loading) return state;
      return { ...state, pdfLoading: action.loading };
    case "SET_IS_TRANSITIONING":
      if (state.isTransitioning === action.transitioning) return state;
      return { ...state, isTransitioning: action.transitioning };
    default:
      return state;
  }
}
