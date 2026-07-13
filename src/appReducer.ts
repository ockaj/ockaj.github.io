export const PENDING_PROMISE = new Promise<void>(() => {});

export function SuspenseTrigger(): null {
  throw PENDING_PROMISE;
  return null;
}

export interface AppState {
  isLoading: boolean;
  isCvOpen: boolean;
}

export type AppAction =
  { type: "COMPLETE_LOADING" } | { type: "SET_CV_OPEN"; isOpen: boolean };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "COMPLETE_LOADING":
      return { ...state, isLoading: false };
    case "SET_CV_OPEN":
      return { ...state, isCvOpen: action.isOpen };
    default:
      return state;
  }
}
