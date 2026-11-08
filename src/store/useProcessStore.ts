import { create } from "zustand";
import {
  PROCESS_TOPICS,
  resolveProcessModalTarget,
  type ProcessItem,
  type ProcessTopic,
  type ProcessViewMode,
} from "../data/processItems";
import { normalizeHash } from "../utils/sectionResolution";

const PROCESS_TOPIC_MAP = new Map<number, ProcessTopic>(
  PROCESS_TOPICS.map((topic) => [topic.id, topic]),
);

const PROCESS_TOPIC_INDEX_MAP = new Map<number, number>(
  PROCESS_TOPICS.map((topic, index) => [topic.id, index]),
);

export type ProcessTopicModalInput =
  string | ProcessItem | number | null | undefined;

type ProcessViewModesMap = {
  readonly [topicId: number]: ProcessViewMode | undefined;
};

export interface ProcessState {
  activeTopicId: number;
  direction: 1 | -1;
  viewModes: ProcessViewModesMap;

  // Actions
  selectTopic: (id: number) => void;
  selectPreviousTopic: () => void;
  selectNextTopic: () => void;
  setViewMode: (topicId: number, mode: ProcessViewMode) => void;
  syncModal: (target: ProcessTopicModalInput) => void;
  reset: () => void;
}

/**
 * Resolves modal inputs (hash strings, items, or topic numbers) into a topicId and optional view mode.
 * Robustly normalizes URL hash prefixes (e.g. "#lightbox-4" -> "lightbox-4").
 */
export function resolveModalInput(input: ProcessTopicModalInput): {
  topicId: number;
  mode?: ProcessViewMode;
} | null {
  if (input === null || input === undefined) return null;

  if (typeof input === "number") {
    return PROCESS_TOPIC_MAP.has(input) ? { topicId: input } : null;
  }

  if (typeof input === "string") {
    const cleanHash = normalizeHash(input);
    const item = resolveProcessModalTarget(cleanHash);
    if (!item || !PROCESS_TOPIC_MAP.has(item.topicId)) return null;
    return { topicId: item.topicId, mode: item.mode };
  }

  if (typeof input === "object" && "topicId" in input && "mode" in input) {
    if (!PROCESS_TOPIC_MAP.has(input.topicId)) return null;
    return { topicId: input.topicId, mode: input.mode };
  }

  return null;
}

const getInitialTopicIdAndModes = (): {
  topicId: number;
  viewModes: ProcessViewModesMap;
} => {
  const fallbackTopicId = PROCESS_TOPICS[0]?.id ?? 1;
  if (typeof window === "undefined") {
    return { topicId: fallbackTopicId, viewModes: {} };
  }
  try {
    const resolved = resolveModalInput(window.location.hash);
    if (resolved) {
      return {
        topicId: resolved.topicId,
        viewModes:
          resolved.mode !== undefined
            ? { [resolved.topicId]: resolved.mode }
            : {},
      };
    }
  } catch {
    // Ignore private browsing or window access restrictions
  }
  return { topicId: fallbackTopicId, viewModes: {} };
};

const initial = getInitialTopicIdAndModes();

export const useProcessStore = create<ProcessState>((set) => ({
  activeTopicId: initial.topicId,
  direction: 1,
  viewModes: initial.viewModes,

  selectTopic: (id: number) =>
    set((state) => {
      const nextIndex = PROCESS_TOPIC_INDEX_MAP.get(id);
      if (nextIndex === undefined || state.activeTopicId === id) return state;

      const previousIndex = PROCESS_TOPIC_INDEX_MAP.get(state.activeTopicId);
      const direction: 1 | -1 =
        previousIndex !== undefined && nextIndex < previousIndex ? -1 : 1;

      return { activeTopicId: id, direction };
    }),

  selectPreviousTopic: () =>
    set((state) => {
      const currentIndex = PROCESS_TOPIC_INDEX_MAP.get(state.activeTopicId);
      if (currentIndex === undefined || currentIndex <= 0) return state;

      const prevTopic = PROCESS_TOPICS[currentIndex - 1];
      return { activeTopicId: prevTopic.id, direction: -1 };
    }),

  selectNextTopic: () =>
    set((state) => {
      const currentIndex = PROCESS_TOPIC_INDEX_MAP.get(state.activeTopicId);
      if (
        currentIndex === undefined ||
        currentIndex >= PROCESS_TOPICS.length - 1
      ) {
        return state;
      }

      const nextTopic = PROCESS_TOPICS[currentIndex + 1];
      return { activeTopicId: nextTopic.id, direction: 1 };
    }),

  setViewMode: (topicId: number, mode: ProcessViewMode) =>
    set((state) => {
      if (!PROCESS_TOPIC_MAP.has(topicId)) return state;
      const currentMode = state.viewModes[topicId] ?? "source";
      if (currentMode === mode && state.viewModes[topicId] !== undefined) {
        return state;
      }
      return {
        viewModes: { ...state.viewModes, [topicId]: mode },
      };
    }),

  syncModal: (target: ProcessTopicModalInput) =>
    set((state) => {
      const resolved = resolveModalInput(target);
      if (!resolved) return state;

      const nextIndex = PROCESS_TOPIC_INDEX_MAP.get(resolved.topicId);
      if (nextIndex === undefined) return state;

      let nextTopicId = state.activeTopicId;
      let nextDirection = state.direction;
      let nextViewModes = state.viewModes;
      let changed = false;

      if (state.activeTopicId !== resolved.topicId) {
        const previousIndex = PROCESS_TOPIC_INDEX_MAP.get(state.activeTopicId);
        nextTopicId = resolved.topicId;
        if (previousIndex !== undefined && previousIndex !== nextIndex) {
          nextDirection = nextIndex > previousIndex ? 1 : -1;
        }
        changed = true;
      }

      if (
        resolved.mode !== undefined &&
        state.viewModes[resolved.topicId] !== resolved.mode
      ) {
        nextViewModes = {
          ...state.viewModes,
          [resolved.topicId]: resolved.mode,
        };
        changed = true;
      }

      return changed
        ? {
            activeTopicId: nextTopicId,
            direction: nextDirection,
            viewModes: nextViewModes,
          }
        : state;
    }),

  reset: () =>
    set({
      activeTopicId: PROCESS_TOPICS[0]?.id ?? 1,
      direction: 1,
      viewModes: {},
    }),
}));

// Derived Selectors (Referentially Stable & Equality Optimized)
export const selectActiveTopic = (state: ProcessState): ProcessTopic =>
  PROCESS_TOPIC_MAP.get(state.activeTopicId) ?? PROCESS_TOPICS[0];

export const selectActiveIndex = (state: ProcessState): number =>
  PROCESS_TOPIC_INDEX_MAP.get(state.activeTopicId) ?? 0;

export const selectActiveViewMode = (state: ProcessState): ProcessViewMode =>
  state.viewModes[state.activeTopicId] ?? "source";

export const selectPrevDisabled = (state: ProcessState): boolean =>
  PROCESS_TOPICS.length === 0 || state.activeTopicId === PROCESS_TOPICS[0].id;

export const selectNextDisabled = (state: ProcessState): boolean =>
  PROCESS_TOPICS.length === 0 ||
  state.activeTopicId === PROCESS_TOPICS[PROCESS_TOPICS.length - 1].id;
