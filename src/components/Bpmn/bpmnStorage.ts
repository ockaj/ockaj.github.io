/**
 * Safe sessionStorage access utilities with in-memory Map caching.
 */

const sessionStorageCache = new Map<string, string | null>();

export function getSessionStorageItem(key: string): string | null {
  if (typeof window === "undefined") return null;

  if (!sessionStorageCache.has(key)) {
    try {
      sessionStorageCache.set(key, window.sessionStorage.getItem(key));
    } catch {
      sessionStorageCache.set(key, null);
    }
  }

  return sessionStorageCache.get(key) ?? null;
}

export function setSessionStorageItem(key: string, value: string): void {
  sessionStorageCache.set(key, value);
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage restrictions (e.g. sandboxed iframes)
  }
}
