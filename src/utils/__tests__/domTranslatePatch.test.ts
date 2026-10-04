import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { applyDomTranslatePatch } from "../domTranslatePatch";

describe("applyDomTranslatePatch", () => {
  const originalWindow = (globalThis as { window?: unknown }).window;
  const originalNode = (globalThis as { Node?: unknown }).Node;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    } else {
      delete (globalThis as { window?: unknown }).window;
    }
    if (originalNode !== undefined) {
      (globalThis as unknown as { Node: unknown }).Node = originalNode;
    } else {
      delete (globalThis as unknown as { Node?: unknown }).Node;
    }
  });

  it("handles environment where window or Node is undefined", () => {
    delete (globalThis as { window?: unknown }).window;
    delete (globalThis as unknown as { Node?: unknown }).Node;

    expect(() => applyDomTranslatePatch()).not.toThrow();
  });

  it("applies monkey patches idempotently without recursive nesting", () => {
    const mockRemoveChild = vi.fn();
    const mockInsertBefore = vi.fn();
    const mockAppendChild = vi.fn();

    class FakeNode {
      parentNode: FakeNode | null = null;
      removeChild = mockRemoveChild;
      insertBefore = mockInsertBefore;
      appendChild = mockAppendChild;
      contains = vi.fn(() => false);
    }

    (globalThis as { window?: unknown }).window = {} as unknown as Window & typeof globalThis;
    (globalThis as unknown as { Node: unknown }).Node = FakeNode;

    applyDomTranslatePatch();
    const firstPatchedRemoveChild = FakeNode.prototype.removeChild;
    const firstPatchedInsertBefore = FakeNode.prototype.insertBefore;

    expect(firstPatchedRemoveChild).not.toBe(mockRemoveChild);
    expect(firstPatchedInsertBefore).not.toBe(mockInsertBefore);

    // Second call should return early due to isPatched guard
    applyDomTranslatePatch();
    expect(FakeNode.prototype.removeChild).toBe(firstPatchedRemoveChild);
    expect(FakeNode.prototype.insertBefore).toBe(firstPatchedInsertBefore);
  });
});
