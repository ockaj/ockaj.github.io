import { describe, expect, it, beforeEach } from "vitest";
import {
  PROCESS_ITEMS,
  PROCESS_TOPICS,
  getProcessItem,
  resolveProcessModalTarget,
} from "../../data/processItems";
import {
  useProcessStore,
  selectActiveTopic,
  selectActiveIndex,
  selectActiveViewMode,
  selectPrevDisabled,
  selectNextDisabled,
  resolveModalInput,
} from "../useProcessStore";

describe("processItems lookup & modal target resolution", () => {
  it("resolves process items by topicId and mode without exposing numeric IDs", () => {
    for (const topic of PROCESS_TOPICS) {
      const sourceItem = getProcessItem(topic.id, "source");
      const optimizedItem = getProcessItem(topic.id, "optimized");

      expect(sourceItem).toBeDefined();
      expect(sourceItem?.topicId).toBe(topic.id);
      expect(sourceItem?.mode).toBe("source");
      expect(sourceItem?.image).toBe(topic.source.image);

      expect(optimizedItem).toBeDefined();
      expect(optimizedItem?.topicId).toBe(topic.id);
      expect(optimizedItem?.mode).toBe("optimized");
      expect(optimizedItem?.image).toBe(topic.optimized.image);
    }

    expect(getProcessItem(999, "source")).toBeUndefined();
  });

  it("round-trips modal hash targets back to their topic and variant mode", () => {
    for (const item of PROCESS_ITEMS) {
      const resolved = resolveProcessModalTarget(`lightbox-${item.id}`);
      expect(resolved).toEqual(item);
    }

    expect(resolveProcessModalTarget(null)).toBeNull();
    expect(resolveProcessModalTarget(undefined)).toBeNull();
    expect(resolveProcessModalTarget("cv")).toBeNull();
    expect(resolveProcessModalTarget("lightbox-invalid")).toBeNull();
    expect(resolveProcessModalTarget("lightbox-999")).toBeNull();
  });
});

describe("useProcessStore Zustand controller", () => {
  beforeEach(() => {
    useProcessStore.getState().reset();
  });

  it("initializes with default topic and handles resolveModalInput boundaries", () => {
    const state = useProcessStore.getState();
    expect(state.activeTopicId).toBe(1);
    expect(selectActiveTopic(state).id).toBe(1);
    expect(selectActiveIndex(state)).toBe(0);
    expect(selectActiveViewMode(state)).toBe("source");
    expect(selectPrevDisabled(state)).toBe(true);
    expect(selectNextDisabled(state)).toBe(false);

    // Boundary and invalid inputs
    expect(resolveModalInput(null)).toBeNull();
    expect(resolveModalInput(undefined)).toBeNull();
    expect(resolveModalInput("lightbox-invalid")).toBeNull();
    expect(resolveModalInput("lightbox-999")).toBeNull();
    expect(resolveModalInput(999)).toBeNull();

    // Resolves raw and hash-prefixed targets
    const resolvedString = resolveModalInput("lightbox-4");
    expect(resolvedString).toEqual({ topicId: 2, mode: "optimized" });

    const resolvedHashPrefix = resolveModalInput("#lightbox-4");
    expect(resolvedHashPrefix).toEqual({ topicId: 2, mode: "optimized" });

    // Numeric topicId input
    const resolvedNumber = resolveModalInput(2);
    expect(resolvedNumber).toEqual({ topicId: 2 });

    // ProcessItem object input
    const itemTarget = getProcessItem(3, "optimized")!;
    expect(resolveModalInput(itemTarget)).toEqual({
      topicId: 3,
      mode: "optimized",
    });
  });

  it("navigates topics, updates direction, and enforces boundary limits", () => {
    const store = useProcessStore.getState;

    // At first topic, selectPreviousTopic is a no-op
    store().selectPreviousTopic();
    expect(store().activeTopicId).toBe(1);
    expect(selectPrevDisabled(store())).toBe(true);

    // Advance forward
    store().selectNextTopic();
    expect(store().activeTopicId).toBe(2);
    expect(selectActiveIndex(store())).toBe(1);
    expect(store().direction).toBe(1);
    expect(selectPrevDisabled(store())).toBe(false);
    expect(selectNextDisabled(store())).toBe(false);

    store().selectNextTopic();
    expect(store().activeTopicId).toBe(3);
    expect(selectActiveIndex(store())).toBe(2);
    expect(selectNextDisabled(store())).toBe(true);

    // At last topic, selectNextTopic is a no-op
    store().selectNextTopic();
    expect(store().activeTopicId).toBe(3);

    // Step backward updates direction to -1
    store().selectPreviousTopic();
    expect(store().activeTopicId).toBe(2);
    expect(selectActiveIndex(store())).toBe(1);
    expect(store().direction).toBe(-1);

    // Selecting unknown or identical topic ID is a no-op (reference equality preserved)
    const prevState = store();
    store().selectTopic(999);
    expect(store()).toBe(prevState);

    store().selectTopic(2);
    expect(store()).toBe(prevState);
  });

  it("persists per-topic variant viewMode across topic switches", () => {
    const store = useProcessStore.getState;

    store().setViewMode(1, "optimized");
    expect(selectActiveViewMode(store())).toBe("optimized");

    // Switching to Topic 2 defaults to source
    store().selectTopic(2);
    expect(selectActiveViewMode(store())).toBe("source");

    // Returning to Topic 1 retains optimized
    store().selectTopic(1);
    expect(selectActiveViewMode(store())).toBe("optimized");

    // Unknown topic ID is ignored
    const prevState = store();
    store().setViewMode(999, "optimized");
    expect(store()).toBe(prevState);
  });

  it("synchronizes both topic and variant mode when syncModal is called", () => {
    const store = useProcessStore.getState;

    // Post-mount navigation to #lightbox-6 (Topic 3, Optimized)
    store().syncModal("#lightbox-6");
    expect(store().activeTopicId).toBe(3);
    expect(selectActiveIndex(store())).toBe(2);
    expect(selectActiveViewMode(store())).toBe("optimized");
    expect(store().direction).toBe(1);

    // Navigation backward to Topic 1 Source item
    const topic1Source = getProcessItem(1, "source")!;
    store().syncModal(topic1Source);
    expect(store().activeTopicId).toBe(1);
    expect(selectActiveIndex(store())).toBe(0);
    expect(selectActiveViewMode(store())).toBe("source");
    expect(store().direction).toBe(-1);

    // Numeric topic syncModal call
    store().syncModal(2);
    expect(store().activeTopicId).toBe(2);
    expect(selectActiveIndex(store())).toBe(1);

    // Closing modal (null) preserves current topic and viewMode
    const stateBeforeClose = store();
    store().syncModal(null);
    expect(store()).toBe(stateBeforeClose);

    // Fallback on unknown input
    store().syncModal("invalid-hash");
    expect(store()).toBe(stateBeforeClose);
  });
});
