import { createContext, use } from "react";
import type { ProcessTopic } from "../../data/processItems";

interface LightboxTargetItem {
  id: number;
  title: string;
  description: string;
  image: string;
  type: string;
}

export interface ProcessLibraryState {
  activeTopicId: number;
  activeTopic: ProcessTopic;
  activeViewMode: "source" | "optimized";
  viewModes: Record<number, "source" | "optimized">;
  direction: number;
  prevDisabled: boolean;
  nextDisabled: boolean;
  prefersReducedMotion: boolean | null;
}

export interface ProcessLibraryActions {
  selectTopic: (id: number) => void;
  selectPreviousTopic: () => void;
  selectNextTopic: () => void;
  handleTopicViewModeChange: (
    topicId: number,
    mode: "source" | "optimized",
  ) => void;
  setLightboxItem: (item: LightboxTargetItem) => void;
}

export const ProcessLibraryStateContext =
  createContext<ProcessLibraryState | null>(null);

export const ProcessLibraryActionsContext =
  createContext<ProcessLibraryActions | null>(null);

export function useProcessLibraryState(): ProcessLibraryState {
  const context = use(ProcessLibraryStateContext);
  if (!context) {
    throw new Error(
      "useProcessLibraryState must be used within ProcessLibraryStateContext",
    );
  }
  return context;
}

export function useProcessLibraryActions(): ProcessLibraryActions {
  const context = use(ProcessLibraryActionsContext);
  if (!context) {
    throw new Error(
      "useProcessLibraryActions must be used within ProcessLibraryActionsContext",
    );
  }
  return context;
}
