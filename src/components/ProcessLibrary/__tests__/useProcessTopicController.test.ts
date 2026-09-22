import { describe, expect, it } from "vitest";
import {
  getInitialProcessTopicId,
  getLightboxTopicId,
} from "../useProcessTopicController";

describe("useProcessTopicController helpers", () => {
  it("resolves valid lightbox item IDs to their process topic", () => {
    expect(getLightboxTopicId("lightbox-1")).toBe(1);
    expect(getLightboxTopicId("lightbox-2")).toBe(1);
    expect(getLightboxTopicId("lightbox-6")).toBe(3);
  });

  it("rejects invalid lightbox IDs", () => {
    expect(getLightboxTopicId(null)).toBeNull();
    expect(getLightboxTopicId("cv")).toBeNull();
    expect(getLightboxTopicId("lightbox-invalid")).toBeNull();
    expect(getLightboxTopicId("lightbox-999")).toBeNull();
  });

  it("falls back to the first topic when no valid lightbox is active", () => {
    expect(getInitialProcessTopicId(null)).toBe(1);
    expect(getInitialProcessTopicId("lightbox-999")).toBe(1);
    expect(getInitialProcessTopicId("lightbox-4")).toBe(2);
  });
});