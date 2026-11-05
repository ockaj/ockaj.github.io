import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { requestIdle, cancelIdle } from "../idleCallback";

describe("idleCallback seam and fallbacks", () => {
  const originalWindow = globalThis.window;
  const originalPerformance = globalThis.performance;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.window = originalWindow;
    globalThis.performance = originalPerformance;
  });

  describe("requestIdle", () => {
    it("delegates to native window.requestIdleCallback when available", () => {
      const mockNativeRequestIdle = vi.fn().mockReturnValue(42);
      const mockNativeCancelIdle = vi.fn();
      const callback = vi.fn();

      // @ts-expect-error Mock window with native idle methods
      globalThis.window = {
        requestIdleCallback: mockNativeRequestIdle,
        cancelIdleCallback: mockNativeCancelIdle,
      };

      const id = requestIdle(callback, { timeout: 1000 });
      expect(id).toBe(42);
      expect(mockNativeRequestIdle).toHaveBeenCalledTimes(1);
      expect(mockNativeRequestIdle).toHaveBeenCalledWith(callback, {
        timeout: 1000,
      });
    });

    it("falls back to setTimeout when native requestIdleCallback is undefined or missing", () => {
      const callback = vi.fn();

      // @ts-expect-error Mock window without native idle methods
      globalThis.window = {
        setTimeout: globalThis.setTimeout,
        clearTimeout: globalThis.clearTimeout,
      };

      const id = requestIdle(callback);
      expect(id).toBeDefined();
      expect(id).not.toBe(0);
      expect(callback).not.toHaveBeenCalled();

      // Advance timer by 1ms to trigger fallback timeout
      vi.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalledTimes(1);

      const deadline = callback.mock.calls[0][0];
      expect(deadline.didTimeout).toBe(false);
      expect(deadline.timeRemaining()).toBeGreaterThan(0);
      expect(deadline.timeRemaining()).toBeLessThanOrEqual(50);
    });

    it("evaluates didTimeout accurately when timeout deadline has elapsed in fallback mode", () => {
      const callback = vi.fn();
      let simulatedTime = 1000;

      // @ts-expect-error Mock performance with controllable time
      globalThis.performance = {
        now: () => simulatedTime,
      };

      // @ts-expect-error Mock window
      globalThis.window = {
        setTimeout: globalThis.setTimeout,
        clearTimeout: globalThis.clearTimeout,
      };

      requestIdle(callback, { timeout: 200 });

      // Simulate delay exceeding timeout before timer triggers
      simulatedTime = 1300;
      vi.advanceTimersByTime(1);

      expect(callback).toHaveBeenCalledTimes(1);
      const deadline = callback.mock.calls[0][0];
      expect(deadline.didTimeout).toBe(true);
      expect(deadline.timeRemaining()).toBe(0);
    });

    it("falls back to Date.now when performance is undefined", () => {
      // @ts-expect-error simulate missing performance
      delete globalThis.performance;

      const callback = vi.fn();

      // @ts-expect-error Mock window
      globalThis.window = {
        setTimeout: globalThis.setTimeout,
        clearTimeout: globalThis.clearTimeout,
      };

      requestIdle(callback);
      vi.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("returns 0 in SSR environments where window is undefined", () => {
      // @ts-expect-error simulate SSR
      delete globalThis.window;

      const callback = vi.fn();
      const id = requestIdle(callback);
      expect(id).toBe(0);
      expect(callback).not.toHaveBeenCalled();
    });

    it("handles invalid or non-numeric timeout options safely", () => {
      const callback = vi.fn();

      // @ts-expect-error Mock window
      globalThis.window = {
        setTimeout: globalThis.setTimeout,
        clearTimeout: globalThis.clearTimeout,
      };

      // Pass NaN and negative numbers
      requestIdle(callback, { timeout: NaN });
      requestIdle(callback, { timeout: -50 });
      vi.advanceTimersByTime(1);

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback.mock.calls[0][0].didTimeout).toBe(false);
      expect(callback.mock.calls[1][0].didTimeout).toBe(false);
    });
  });

  describe("cancelIdle", () => {
    it("delegates to native window.cancelIdleCallback when available", () => {
      const mockNativeCancelIdle = vi.fn();

      // @ts-expect-error Mock window with native methods
      globalThis.window = {
        requestIdleCallback: vi.fn(),
        cancelIdleCallback: mockNativeCancelIdle,
      };

      cancelIdle(123);
      expect(mockNativeCancelIdle).toHaveBeenCalledTimes(1);
      expect(mockNativeCancelIdle).toHaveBeenCalledWith(123);
    });

    it("falls back to clearTimeout when native cancelIdleCallback is not available", () => {
      const mockClearTimeout = vi.fn();

      // @ts-expect-error Mock window
      globalThis.window = {
        clearTimeout: mockClearTimeout,
      };

      cancelIdle(456);
      expect(mockClearTimeout).toHaveBeenCalledTimes(1);
      expect(mockClearTimeout).toHaveBeenCalledWith(456);
    });

    it("safely ignores null, undefined, zero, or missing window without throwing", () => {
      const mockClearTimeout = vi.fn();

      // @ts-expect-error Mock window
      globalThis.window = {
        clearTimeout: mockClearTimeout,
      };

      cancelIdle(null);
      cancelIdle();
      cancelIdle(0);
      expect(mockClearTimeout).not.toHaveBeenCalled();

      // @ts-expect-error simulate SSR
      delete globalThis.window;
      expect(() => cancelIdle(789)).not.toThrow();
    });
  });
});
