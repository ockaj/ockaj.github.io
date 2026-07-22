import { prefetch } from "quicklink";

const prefetchedSet = new Set<string>();

/**
 * Prefetch a static asset or URL using Quicklink's low-priority idle scheduler.
 * Automatically deduplicates and respects browser Data Saver settings.
 */
export function prefetchAsset(url: string): void {
  if (!url || prefetchedSet.has(url)) return;
  prefetchedSet.add(url);

  void prefetch(url).catch(() => {
    // Silently ignore prefetch errors
  });
}
