export interface PdfState {
  activeTab: "pdf" | "interactive";
}

export type PdfAction = { type: "CHANGE_TAB"; tab: "pdf" | "interactive" };

export function pdfReducer(state: PdfState, action: PdfAction): PdfState {
  if (action.type === "CHANGE_TAB") {
    if (state.activeTab === action.tab) return state;
    return { ...state, activeTab: action.tab };
  }
  return state;
}
