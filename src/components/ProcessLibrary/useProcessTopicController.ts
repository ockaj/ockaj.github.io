import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import {
  PROCESS_TOPICS,
  resolveProcessModalTarget,
  type ProcessItem,
  type ProcessTopic,
  type ProcessViewMode,
} from "../../data/processItems";

const PROCESS_TOPIC_MAP = new Map(
  PROCESS_TOPICS.map((topic) => [topic.id, topic]),
);
const PROCESS_TOPIC_INDEX_MAP = new Map(
  PROCESS_TOPICS.map((topic, index) => [topic.id, index]),
);

type ProcessTopicModalInput = string | ProcessItem | number | null | undefined;

type ProcessViewModesMap = {
  readonly [topicId: number]: ProcessViewMode | undefined;
};

interface ProcessTopicSnapshot {
  readonly activeTopicId: number;
  readonly activeTopic: ProcessTopic;
  readonly activeIndex: number;
  readonly activeViewMode: ProcessViewMode;
  readonly viewModes: ProcessViewModesMap;
  readonly direction: number;
  readonly prevDisabled: boolean;
  readonly nextDisabled: boolean;
}

interface ProcessTopicActions {
  readonly selectTopic: (id: number) => void;
  readonly selectPreviousTopic: () => void;
  readonly selectNextTopic: () => void;
  readonly handleTopicViewModeChange: (
    topicId: number,
    mode: ProcessViewMode,
  ) => void;
}

interface ProcessTopicStore {
  readonly getSnapshot: () => ProcessTopicSnapshot;
  readonly subscribe: (listener: () => void) => () => void;
  readonly syncModal: (target: ProcessTopicModalInput) => void;
  readonly actions: ProcessTopicActions;
}

interface ProcessTopicController extends ProcessTopicSnapshot {
  readonly actions: ProcessTopicActions;
}

function resolveModalInput(input: ProcessTopicModalInput): {
  topicId: number;
  mode?: ProcessViewMode;
} | null {
  if (input === null || input === undefined) return null;

  if (typeof input === "number") {
    return PROCESS_TOPIC_MAP.has(input) ? { topicId: input } : null;
  }

  if (typeof input === "string") {
    const item = resolveProcessModalTarget(input);
    if (!item || !PROCESS_TOPIC_MAP.has(item.topicId)) return null;
    return { topicId: item.topicId, mode: item.mode };
  }

  if (typeof input === "object" && "topicId" in input && "mode" in input) {
    if (!PROCESS_TOPIC_MAP.has(input.topicId)) return null;
    return { topicId: input.topicId, mode: input.mode };
  }

  return null;
}

function buildSnapshot(
  activeTopicId: number,
  direction: number,
  viewModes: ProcessViewModesMap,
): ProcessTopicSnapshot {
  const activeTopic = PROCESS_TOPIC_MAP.get(activeTopicId) ?? PROCESS_TOPICS[0];
  const resolvedTopicId = activeTopic?.id ?? activeTopicId;
  const activeIndex = PROCESS_TOPIC_INDEX_MAP.get(resolvedTopicId) ?? 0;
  const activeViewMode = viewModes[resolvedTopicId] ?? "source";
  const prevDisabled =
    PROCESS_TOPICS.length === 0 || resolvedTopicId === PROCESS_TOPICS[0].id;
  const nextDisabled =
    PROCESS_TOPICS.length === 0 ||
    resolvedTopicId === PROCESS_TOPICS[PROCESS_TOPICS.length - 1].id;

  return {
    activeTopicId: resolvedTopicId,
    activeTopic,
    activeIndex,
    activeViewMode,
    viewModes,
    direction,
    prevDisabled,
    nextDisabled,
  };
}

export function createProcessTopicStore(
  initialTarget?: ProcessTopicModalInput,
): ProcessTopicStore {
  const resolvedInitial = resolveModalInput(initialTarget);
  const fallbackTopicId = PROCESS_TOPICS[0]?.id ?? 0;

  let activeTopicId = resolvedInitial?.topicId ?? fallbackTopicId;
  let direction = 1;
  let viewModes: ProcessViewModesMap =
    resolvedInitial?.mode !== undefined
      ? { [activeTopicId]: resolvedInitial.mode }
      : {};
  let snapshot = buildSnapshot(activeTopicId, direction, viewModes);

  const listeners = new Set<() => void>();

  const emit = () => {
    snapshot = buildSnapshot(activeTopicId, direction, viewModes);
    listeners.forEach((listener) => listener());
  };

  const selectTopic = (id: number) => {
    const nextIndex = PROCESS_TOPIC_INDEX_MAP.get(id);
    if (nextIndex === undefined || activeTopicId === id) return;

    const previousIndex = PROCESS_TOPIC_INDEX_MAP.get(activeTopicId);
    activeTopicId = id;
    if (previousIndex !== undefined && previousIndex !== nextIndex) {
      direction = nextIndex > previousIndex ? 1 : -1;
    }
    emit();
  };

  const selectPreviousTopic = () => {
    const currentIndex = PROCESS_TOPIC_INDEX_MAP.get(activeTopicId);
    if (currentIndex !== undefined && currentIndex > 0) {
      selectTopic(PROCESS_TOPICS[currentIndex - 1].id);
    }
  };

  const selectNextTopic = () => {
    const currentIndex = PROCESS_TOPIC_INDEX_MAP.get(activeTopicId);
    if (
      currentIndex !== undefined &&
      currentIndex < PROCESS_TOPICS.length - 1
    ) {
      selectTopic(PROCESS_TOPICS[currentIndex + 1].id);
    }
  };

  const handleTopicViewModeChange = (
    topicId: number,
    mode: ProcessViewMode,
  ) => {
    if (!PROCESS_TOPIC_MAP.has(topicId)) return;
    const currentMode = viewModes[topicId] ?? "source";
    if (currentMode === mode && viewModes[topicId] !== undefined) return;
    viewModes = { ...viewModes, [topicId]: mode };
    emit();
  };

  const syncModal = (target: ProcessTopicModalInput) => {
    const resolved = resolveModalInput(target);
    if (!resolved) return;

    const nextIndex = PROCESS_TOPIC_INDEX_MAP.get(resolved.topicId);
    if (nextIndex === undefined) return;

    let changed = false;

    if (activeTopicId !== resolved.topicId) {
      const previousIndex = PROCESS_TOPIC_INDEX_MAP.get(activeTopicId);
      activeTopicId = resolved.topicId;
      if (previousIndex !== undefined && previousIndex !== nextIndex) {
        direction = nextIndex > previousIndex ? 1 : -1;
      }
      changed = true;
    }

    if (
      resolved.mode !== undefined &&
      viewModes[resolved.topicId] !== resolved.mode
    ) {
      viewModes = { ...viewModes, [resolved.topicId]: resolved.mode };
      changed = true;
    }

    if (changed) {
      emit();
    }
  };

  const actions: ProcessTopicActions = {
    selectTopic,
    selectPreviousTopic,
    selectNextTopic,
    handleTopicViewModeChange,
  };

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    syncModal,
    actions,
  };
}

export function useProcessTopicController(
  activeTarget?: ProcessTopicModalInput,
): ProcessTopicController {
  const [store] = useState(() => createProcessTopicStore(activeTarget));

  useLayoutEffect(() => {
    store.syncModal(activeTarget);
  }, [store, activeTarget]);

  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );

  return {
    ...snapshot,
    actions: store.actions,
  };
}
