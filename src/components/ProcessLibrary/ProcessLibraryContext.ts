import { createContext, use } from "react";
import type { ProcessTopic } from "../../data/processItems";

interface LightboxTargetItem {
  id: number;
  title: string;
  description: string;
  image: string;
  type: string;
}

interface ProcessLibraryState {
  activeTopicId: number;
  activeTopic: ProcessTopic;
  activeViewMode: "source" | "optimized";
  viewModes: Record<number, "source" | "optimized">;
  direction: number;
  prevDisabled: boolean;
  nextDisabled: boolean;
  prefersReducedMotion: boolean | null;
}

interface ProcessLibraryActions {
  selectTopic: (id: number) => void;
  selectPreviousTopic: () => void;
  selectNextTopic: () => void;
  handleTopicViewModeChange: (
    topicId: number,
    mode: "source" | "optimized",
  ) => void;
  setLightboxItem: (item: LightboxTargetItem) => void;
}

export interface ProcessLibraryContextValue {
  state: ProcessLibraryState;
  actions: ProcessLibraryActions;
}

export const ProcessLibraryContext =
  createContext<ProcessLibraryContextValue | null>(null);

export function useProcessLibraryContext(): ProcessLibraryContextValue {
  const context = use(ProcessLibraryContext);
  if (!context) {
    throw new Error(
      "useProcessLibraryContext must be used within a ProcessLibraryContext",
    );
  }
  return context;
}
