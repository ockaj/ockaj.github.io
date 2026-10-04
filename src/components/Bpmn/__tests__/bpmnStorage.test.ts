import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getSessionStorageItem,
  setSessionStorageItem,
} from "../bpmnStorage";

describe("bpmnStorage", () => {
  const originalWindow = (globalThis as { window?: unknown }).window;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalWindow !== undefined) {
      (globalThis as { window?: unknown }).window = originalWindow;
    } else {
      delete (globalThis as { window?: unknown }).window;
    }
  });

  it("returns null when window is undefined", () => {
    delete (globalThis as { window?: unknown }).window;

    expect(getSessionStorageItem("test_non_window")).toBeNull();
    expect(() => setSessionStorageItem("test_non_window", "value")).not.toThrow();
  });

  it("safely reads and caches values from sessionStorage", () => {
    const mockStorage: Record<string, string> = { key_normal: "stored_value" };
    const getItemSpy = vi.fn((key: string) => mockStorage[key] ?? null);
    const setItemSpy = vi.fn((key: string, val: string) => {
      mockStorage[key] = val;
    });

    (globalThis as { window?: unknown }).window = {};
    Object.defineProperty(globalThis.window, "sessionStorage", {
      value: {
        getItem: getItemSpy,
        setItem: setItemSpy,
      },
      writable: true,
      configurable: true,
    });

    // First read: accesses sessionStorage and caches
    const val1 = getSessionStorageItem("key_normal");
    expect(val1).toBe("stored_value");
    expect(getItemSpy).toHaveBeenCalledTimes(1);

    // Second read: hits in-memory cache without calling sessionStorage.getItem again
    const val2 = getSessionStorageItem("key_normal");
    expect(val2).toBe("stored_value");
    expect(getItemSpy).toHaveBeenCalledTimes(1);
  });

  it("safely catches SecurityError on getItem and returns null without throwing", () => {
    (globalThis as { window?: unknown }).window = {};
    Object.defineProperty(globalThis.window, "sessionStorage", {
      get() {
        throw new DOMException(
          "Failed to read 'sessionStorage': Access is denied for this document.",
          "SecurityError",
        );
      },
      configurable: true,
    });

    expect(() => {
      const result = getSessionStorageItem("restricted_key");
      expect(result).toBeNull();
    }).not.toThrow();
  });

  it("safely catches SecurityError on setItem and updates in-memory cache", () => {
    (globalThis as { window?: unknown }).window = {};
    Object.defineProperty(globalThis.window, "sessionStorage", {
      get() {
        throw new DOMException(
          "Failed to write to 'sessionStorage': Access is denied for this document.",
          "SecurityError",
        );
      },
      configurable: true,
    });

    expect(() => {
      setSessionStorageItem("restricted_write_key", "persisted_in_memory");
    }).not.toThrow();

    // In-memory cache returns the updated value even though sessionStorage threw
    expect(getSessionStorageItem("restricted_write_key")).toBe(
      "persisted_in_memory",
    );
  });
});
