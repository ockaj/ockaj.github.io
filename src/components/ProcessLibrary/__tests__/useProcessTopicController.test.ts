import { describe, expect, it, vi } from "vitest";
import {
  PROCESS_ITEMS,
  PROCESS_TOPICS,
  getProcessItem,
  resolveProcessModalTarget,
} from "../../../data/processItems";
import { createProcessTopicStore } from "../useProcessTopicController";

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

describe("createProcessTopicStore deepened controller", () => {
  it("initializes from valid lightbox targets and falls back on invalid or missing inputs", () => {
    const defaultStore = createProcessTopicStore(null);
    expect(defaultStore.getSnapshot()).toMatchObject({
      activeTopicId: 1,
      activeIndex: 0,
      activeViewMode: "source",
      direction: 1,
      prevDisabled: true,
      nextDisabled: false,
    });

    const invalidStore = createProcessTopicStore("lightbox-999");
    expect(invalidStore.getSnapshot().activeTopicId).toBe(1);
    expect(invalidStore.getSnapshot().activeViewMode).toBe("source");

    const modalStringStore = createProcessTopicStore("lightbox-4");
    expect(modalStringStore.getSnapshot()).toMatchObject({
      activeTopicId: 2,
      activeIndex: 1,
      activeViewMode: "optimized",
      prevDisabled: false,
      nextDisabled: false,
    });

    const itemTarget = getProcessItem(3, "optimized")!;
    const entityStore = createProcessTopicStore(itemTarget);
    expect(entityStore.getSnapshot()).toMatchObject({
      activeTopicId: 3,
      activeIndex: 2,
      activeViewMode: "optimized",
      prevDisabled: false,
      nextDisabled: true,
    });
  });

  it("navigates topics, updates direction, and enforces boundary limits", () => {
    const store = createProcessTopicStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    // At first topic, selectPreviousTopic is a no-op
    store.actions.selectPreviousTopic();
    expect(listener).not.toHaveBeenCalled();

    // Advance forward
    store.actions.selectNextTopic();
    expect(store.getSnapshot()).toMatchObject({
      activeTopicId: 2,
      activeIndex: 1,
      direction: 1,
      prevDisabled: false,
      nextDisabled: false,
    });

    store.actions.selectNextTopic();
    expect(store.getSnapshot()).toMatchObject({
      activeTopicId: 3,
      activeIndex: 2,
      direction: 1,
      prevDisabled: false,
      nextDisabled: true,
    });

    // At last topic, selectNextTopic is a no-op
    const countBeforeBoundary = listener.mock.calls.length;
    store.actions.selectNextTopic();
    expect(listener.mock.calls).toHaveLength(countBeforeBoundary);

    // Step backward updates direction to -1
    store.actions.selectPreviousTopic();
    expect(store.getSnapshot()).toMatchObject({
      activeTopicId: 2,
      activeIndex: 1,
      direction: -1,
    });

    // Selecting unknown or identical topic ID is a no-op
    const snapshotBeforeInvalid = store.getSnapshot();
    store.actions.selectTopic(999);
    store.actions.selectTopic(2);
    expect(store.getSnapshot()).toBe(snapshotBeforeInvalid);

    unsubscribe();
  });

  it("persists per-topic variant viewMode across topic switches", () => {
    const store = createProcessTopicStore(1);

    store.actions.handleTopicViewModeChange(1, "optimized");
    expect(store.getSnapshot().activeViewMode).toBe("optimized");

    // Switching to Topic 2 defaults to source
    store.actions.selectTopic(2);
    expect(store.getSnapshot().activeViewMode).toBe("source");

    // Returning to Topic 1 retains optimized
    store.actions.selectTopic(1);
    expect(store.getSnapshot().activeViewMode).toBe("optimized");

    // Unknown topic ID is ignored
    const prevSnapshot = store.getSnapshot();
    store.actions.handleTopicViewModeChange(999, "optimized");
    expect(store.getSnapshot()).toBe(prevSnapshot);
  });

  it("synchronizes both topic and variant mode when a lightbox target changes after mount", () => {
    const store = createProcessTopicStore(null);
    expect(store.getSnapshot()).toMatchObject({
      activeTopicId: 1,
      activeViewMode: "source",
    });

    // Post-mount navigation to #lightbox-6 (Topic 3, Optimized)
    store.syncModal("lightbox-6");
    expect(store.getSnapshot()).toMatchObject({
      activeTopicId: 3,
      activeIndex: 2,
      activeViewMode: "optimized",
      direction: 1,
    });

    // Post-mount navigation backward to Topic 1 Source item
    const topic1Source = getProcessItem(1, "source")!;
    store.syncModal(topic1Source);
    expect(store.getSnapshot()).toMatchObject({
      activeTopicId: 1,
      activeIndex: 0,
      activeViewMode: "source",
      direction: -1,
    });

    // Closing modal (null) preserves current topic and viewMode
    const snapshotBeforeClose = store.getSnapshot();
    store.syncModal(null);
    expect(store.getSnapshot()).toBe(snapshotBeforeClose);
  });
});
