import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  subscribeMediaQuery,
  getMediaQuerySnapshot,
  isReducedMotionPreferred,
  useIsMobile,
  useIsDesktop,
  useIsTouchDevice,
  usePrefersReducedMotion,
} from "../useMediaQuery";

describe("useMediaQuery seam and store lifecycle", () => {
  const originalWindow = globalThis.window;

  let queryMatches: Record<string, boolean> = {};
  let mqlListeners: Record<string, ((event?: unknown) => void)[]> = {};
  let addEventListenerSpy: ReturnType<typeof vi.fn>;
  let removeEventListenerSpy: ReturnType<typeof vi.fn>;

  function createMockMql(query: string) {
    if (!mqlListeners[query]) {
      mqlListeners[query] = [];
    }
    return {
      get matches() {
        return queryMatches[query] ?? false;
      },
      media: query,
      addEventListener: addEventListenerSpy.mockImplementation(
        (event: string, cb: (event?: unknown) => void) => {
          if (event === "change") {
            mqlListeners[query].push(cb);
          }
        },
      ),
      removeEventListener: removeEventListenerSpy.mockImplementation(
        (event: string, cb: (event?: unknown) => void) => {
          if (event === "change" && mqlListeners[query]) {
            mqlListeners[query] = mqlListeners[query].filter((fn) => fn !== cb);
          }
        },
      ),
    };
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    queryMatches = {};
    mqlListeners = {};
    addEventListenerSpy = vi.fn();
    removeEventListenerSpy = vi.fn();

    globalThis.window = {
      matchMedia: vi.fn(
        (query: string) => createMockMql(query) as unknown as MediaQueryList,
      ),
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  describe("subscribeMediaQuery", () => {
    it("subscribes to media query change events and notifies listeners", () => {
      const query = "(min-width: 768px)";
      const callback = vi.fn();

      const unsubscribe = subscribeMediaQuery(query, callback);
      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
      expect(mqlListeners[query]).toHaveLength(1);

      // Trigger change event
      mqlListeners[query][0]();
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
      expect(mqlListeners[query]).toHaveLength(0);
    });

    it("deduplicates mql listener registration across multiple subscribers for the same query", () => {
      const query = "(prefers-reduced-motion: reduce)";
      const firstCallback = vi.fn();
      const secondCallback = vi.fn();

      const unsubscribeFirst = subscribeMediaQuery(query, firstCallback);
      const unsubscribeSecond = subscribeMediaQuery(query, secondCallback);

      // Only one change listener attached to the underlying MQL instance
      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
      expect(mqlListeners[query]).toHaveLength(1);

      // Trigger change notification
      mqlListeners[query][0]();
      expect(firstCallback).toHaveBeenCalledTimes(1);
      expect(secondCallback).toHaveBeenCalledTimes(1);

      // First unsubscribe keeps mql listener active for second subscriber
      unsubscribeFirst();
      expect(removeEventListenerSpy).not.toHaveBeenCalled();

      // Second unsubscribe removes mql listener and clears store
      unsubscribeSecond();
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
      expect(mqlListeners[query]).toHaveLength(0);
    });

    it("handles SSR and missing window or matchMedia gracefully without throwing error", () => {
      // @ts-expect-error simulate SSR environment
      delete globalThis.window;

      const callback = vi.fn();
      const unsubscribe = subscribeMediaQuery("(max-width: 600px)", callback);

      expect(() => unsubscribe()).not.toThrow();
      expect(callback).not.toHaveBeenCalled();

      // Simulate window present but matchMedia undefined
      // @ts-expect-error simulate legacy browser without matchMedia
      globalThis.window = {};
      const fallbackUnsubscribe = subscribeMediaQuery("(max-width: 600px)", callback);
      expect(() => fallbackUnsubscribe()).not.toThrow();
    });

    it("handles repeated unsubscribe invocations safely", () => {
      const query = "(pointer: coarse)";
      const callback = vi.fn();

      const unsubscribe = subscribeMediaQuery(query, callback);
      unsubscribe();
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe("getMediaQuerySnapshot", () => {
    it("reads snapshot directly from existing store when subscribed", () => {
      const query = "(min-width: 1024px)";
      queryMatches[query] = true;

      const unsubscribe = subscribeMediaQuery(query, vi.fn());
      expect(getMediaQuerySnapshot(query)).toBe(true);

      queryMatches[query] = false;
      expect(getMediaQuerySnapshot(query)).toBe(false);

      unsubscribe();
    });

    it("evaluates snapshot on-demand when store is not yet active", () => {
      const query = "(min-width: 1280px)";
      queryMatches[query] = true;

      expect(getMediaQuerySnapshot(query)).toBe(true);
    });

    it("falls back to false in SSR or when window is undefined or missing", () => {
      // @ts-expect-error simulate SSR
      delete globalThis.window;
      expect(getMediaQuerySnapshot("(min-width: 768px)")).toBe(false);

      // @ts-expect-error window without matchMedia
      globalThis.window = {};
      expect(getMediaQuerySnapshot("(min-width: 768px)")).toBe(false);
    });

    it("handles null, empty, or unknown query safely", () => {
      expect(getMediaQuerySnapshot("")).toBe(false);
      expect(getMediaQuerySnapshot("unknown-query")).toBe(false);
    });
  });

  describe("isReducedMotionPreferred", () => {
    it("returns true when prefers-reduced-motion media query matches", () => {
      queryMatches["(prefers-reduced-motion: reduce)"] = true;
      expect(isReducedMotionPreferred()).toBe(true);
    });

    it("returns false when prefers-reduced-motion does not match or environment is reduced fallback", () => {
      queryMatches["(prefers-reduced-motion: reduce)"] = false;
      expect(isReducedMotionPreferred()).toBe(false);

      // @ts-expect-error simulate SSR missing window
      delete globalThis.window;
      expect(isReducedMotionPreferred()).toBe(false);
    });
  });

  describe("hook helper functions", () => {
    it("exports valid hook functions", () => {
      expect(typeof useIsMobile).toBe("function");
      expect(typeof useIsDesktop).toBe("function");
      expect(typeof useIsTouchDevice).toBe("function");
      expect(typeof usePrefersReducedMotion).toBe("function");
    });
  });
});
