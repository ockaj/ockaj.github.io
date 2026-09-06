/**
 * Polyfilled IdleDeadline interface conforming to the W3C Cooperative Scheduling specification.
 * @lintignore
 */
export interface IdleDeadlineShim {
  readonly didTimeout: boolean;
  timeRemaining: () => number;
}

/**
 * Type definition for idle callbacks.
 */
export type IdleCallbackShim = (deadline: IdleDeadlineShim) => void;

/**
 * Options for scheduling idle callbacks.
 */
export interface IdleOptionsShim {
  timeout?: number;
}

/**
 * Gets monotonic time in milliseconds.
 */
function getMonotonicTime(): number {
  if (
    typeof performance !== "undefined" &&
    typeof performance.now === "function"
  ) {
    return performance.now();
  }
  return Date.now();
}

/**
 * Schedules a callback during browser idle periods.
 * Uses native requestIdleCallback when available.
 * Falls back to setTimeout in environments without native support.
 */
export function requestIdle(
  callback: IdleCallbackShim,
  options?: IdleOptionsShim,
): number {
  if (typeof window === "undefined") {
    return 0;
  }

  if (
    typeof window.requestIdleCallback === "function" &&
    typeof window.cancelIdleCallback === "function"
  ) {
    return window.requestIdleCallback(callback, options);
  }

  const scheduleTime = getMonotonicTime();
  return window.setTimeout(() => {
    const executionStart = getMonotonicTime();
    const didTimeout = Boolean(
      typeof options?.timeout === "number" &&
      Number.isFinite(options.timeout) &&
      options.timeout > 0 &&
      executionStart - scheduleTime >= options.timeout,
    );

    callback({
      didTimeout,
      timeRemaining: () =>
        didTimeout
          ? 0
          : Math.max(0, 50 - (getMonotonicTime() - executionStart)),
    });
  }, 1);
}

/**
 * Cancels a scheduled idle callback.
 * Safely handles null, undefined, or 0.
 */
export function cancelIdle(id?: number | null): void {
  if (!id || typeof window === "undefined") {
    return;
  }

  if (
    typeof window.cancelIdleCallback === "function" &&
    typeof window.requestIdleCallback === "function"
  ) {
    window.cancelIdleCallback(id);
  } else {
    window.clearTimeout(id);
  }
}
