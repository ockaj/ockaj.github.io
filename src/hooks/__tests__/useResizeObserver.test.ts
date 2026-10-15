import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { subscribeResizeObserver } from "../useResizeObserver";

describe("useResizeObserver", () => {
  const originalWindow = globalThis.window;
  const originalResizeObserver = globalThis.ResizeObserver;
  const originalRaf = globalThis.requestAnimationFrame;

  let observerCallback: ResizeObserverCallback | null = null;
  let observeSpy: ReturnType<typeof vi.fn>;
  let unobserveSpy: ReturnType<typeof vi.fn>;
  let disconnectSpy: ReturnType<typeof vi.fn>;
  let rafQueue: FrameRequestCallback[];

  beforeEach(() => {
    vi.restoreAllMocks();
    observerCallback = null;
    observeSpy = vi.fn();
    unobserveSpy = vi.fn();
    disconnectSpy = vi.fn();
    rafQueue = [];

    // @ts-expect-error test mock globals
    globalThis.window = {};
    globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });

    class MockResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        observerCallback = cb;
      }
      observe = observeSpy;
      unobserve = unobserveSpy;
      disconnect = disconnectSpy;
    }

    globalThis.ResizeObserver =
      MockResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.ResizeObserver = originalResizeObserver;
    globalThis.requestAnimationFrame = originalRaf;
  });

  it("observes target, dispatches entries via requestAnimationFrame, and cleans up on unsubscribe", () => {
    const target = {} as Element;
    const callback = vi.fn();

    const unsubscribe = subscribeResizeObserver(target, callback);
    expect(observeSpy).toHaveBeenCalledTimes(1);
    expect(observeSpy).toHaveBeenCalledWith(target);

    const mockEntry = { target } as ResizeObserverEntry;
    observerCallback?.([mockEntry], {} as ResizeObserver);

    expect(callback).not.toHaveBeenCalled();
    expect(rafQueue).toHaveLength(1);

    rafQueue[0](16);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(mockEntry);

    unsubscribe();
    expect(unobserveSpy).toHaveBeenCalledWith(target);
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });

  it("deduplicates observer registration across multiple subscribers on the same element", () => {
    const target = {} as Element;
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();

    const unsubscribeFirst = subscribeResizeObserver(target, firstCallback);
    const unsubscribeSecond = subscribeResizeObserver(target, secondCallback);

    expect(observeSpy).toHaveBeenCalledTimes(1);

    const mockEntry = { target } as ResizeObserverEntry;
    observerCallback?.([mockEntry], {} as ResizeObserver);
    rafQueue[0](16);

    expect(firstCallback).toHaveBeenCalledWith(mockEntry);
    expect(secondCallback).toHaveBeenCalledWith(mockEntry);

    unsubscribeFirst();
    expect(unobserveSpy).not.toHaveBeenCalled();
    expect(disconnectSpy).not.toHaveBeenCalled();

    unsubscribeSecond();
    expect(unobserveSpy).toHaveBeenCalledWith(target);
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });

  it("handles null target, SSR missing window, and repeated unsubscribe safely", () => {
    const callback = vi.fn();

    const nullCleanup = subscribeResizeObserver(null, callback);
    expect(() => nullCleanup()).not.toThrow();
    expect(observeSpy).not.toHaveBeenCalled();

    // @ts-expect-error simulate SSR environment
    globalThis.window = undefined;
    const ssrCleanup = subscribeResizeObserver({} as Element, callback);
    expect(() => ssrCleanup()).not.toThrow();
    expect(observeSpy).not.toHaveBeenCalled();

    // @ts-expect-error restore window mock
    globalThis.window = {};
    const target = {} as Element;
    const cleanup = subscribeResizeObserver(target, callback);
    cleanup();
    expect(() => cleanup()).not.toThrow();
    expect(unobserveSpy).toHaveBeenCalledTimes(1);
  });

  it("skips invoking callbacks that unsubscribed before requestAnimationFrame flushes", () => {
    const target = {} as Element;
    const callback = vi.fn();

    const unsubscribe = subscribeResizeObserver(target, callback);
    const mockEntry = { target } as ResizeObserverEntry;
    observerCallback?.([mockEntry], {} as ResizeObserver);

    unsubscribe();
    rafQueue[0](16);

    expect(callback).not.toHaveBeenCalled();
  });
});
