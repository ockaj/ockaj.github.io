import { useCallback, useMemo, useRef, useState } from "react";
import { PROCESS_TOPICS, type ProcessTopic } from "../../data/processItems";

const PROCESS_TOPIC_MAP = new Map(
  PROCESS_TOPICS.map((topic) => [topic.id, topic]),
);
const PROCESS_TOPIC_INDEX_MAP = new Map(
  PROCESS_TOPICS.map((topic, index) => [topic.id, index]),
);

export function getLightboxTopicId(modal: string | null): number | null {
  if (!modal?.startsWith("lightbox-")) return null;

  const itemId = Number(modal.slice("lightbox-".length));
  if (Number.isNaN(itemId)) return null;

  const topicId = Math.ceil(itemId / 2);
  return PROCESS_TOPIC_MAP.has(topicId) ? topicId : null;
}

export function getInitialProcessTopicId(modal: string | null): number {
  return getLightboxTopicId(modal) ?? PROCESS_TOPICS[0].id;
}

interface ProcessTopicController {
  activeTopicId: number;
  activeTopic: ProcessTopic;
  direction: number;
  prevDisabled: boolean;
  nextDisabled: boolean;
  actions: {
    selectTopic: (id: number) => void;
    selectPreviousTopic: () => void;
    selectNextTopic: () => void;
  };
}

export function useProcessTopicController(
  initialTopicId: number,
): ProcessTopicController {
  const [activeTopicId, setActiveTopicId] = useState(() => initialTopicId);
  const activeTopicIdRef = useRef(initialTopicId);
  const [direction, setDirection] = useState(1);

  const selectTopic = useCallback((id: number) => {
    const nextIndex = PROCESS_TOPIC_INDEX_MAP.get(id);
    if (nextIndex === undefined || activeTopicIdRef.current === id) return;

    const previousIndex = PROCESS_TOPIC_INDEX_MAP.get(activeTopicIdRef.current);
    activeTopicIdRef.current = id;
    setActiveTopicId(id);

    if (previousIndex !== undefined && previousIndex !== nextIndex) {
      setDirection(nextIndex > previousIndex ? 1 : -1);
    }
  }, []);

  const selectPreviousTopic = useCallback(() => {
    const currentIndex = PROCESS_TOPIC_INDEX_MAP.get(activeTopicIdRef.current);
    if (currentIndex !== undefined && currentIndex > 0) {
      selectTopic(PROCESS_TOPICS[currentIndex - 1].id);
    }
  }, [selectTopic]);

  const selectNextTopic = useCallback(() => {
    const currentIndex = PROCESS_TOPIC_INDEX_MAP.get(activeTopicIdRef.current);
    if (
      currentIndex !== undefined &&
      currentIndex < PROCESS_TOPICS.length - 1
    ) {
      selectTopic(PROCESS_TOPICS[currentIndex + 1].id);
    }
  }, [selectTopic]);

  const activeTopic = PROCESS_TOPIC_MAP.get(activeTopicId) ?? PROCESS_TOPICS[0];
  const prevDisabled = activeTopicId === PROCESS_TOPICS[0].id;
  const nextDisabled =
    activeTopicId === PROCESS_TOPICS[PROCESS_TOPICS.length - 1].id;
  const actions = useMemo(
    () => ({ selectTopic, selectPreviousTopic, selectNextTopic }),
    [selectTopic, selectPreviousTopic, selectNextTopic],
  );

  return {
    activeTopicId,
    activeTopic,
    direction,
    prevDisabled,
    nextDisabled,
    actions,
  };
}
