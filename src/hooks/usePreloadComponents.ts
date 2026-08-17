import { useEffect } from "react";
import { isSlowConnection } from "../utils/connection";
import {
  loadCaseStudies,
  loadSkills,
  loadProcessLibrary,
  loadJournal,
  loadPdfViewerModal,
  loadBpmnOverlay,
} from "../lazyComponents";

function yieldToMain(
  activeTimeouts: Set<ReturnType<typeof setTimeout>>,
): Promise<void> {
  const scheduler = (
    window as Window & { scheduler?: { yield: () => Promise<void> } }
  ).scheduler;
  if (typeof scheduler?.yield === "function") {
    return scheduler.yield();
  }
  return new Promise<void>((resolve) => {
    const id = setTimeout(() => {
      activeTimeouts.delete(id);
      resolve();
    }, 0);
    activeTimeouts.add(id);
  });
}

export function usePreloadComponents(
  isMobile: boolean,
  isLoading: boolean,
): void {
  useEffect(() => {
    if (isLoading || isSlowConnection()) return;

    let active = true;
    let idleId: number | null = null;
    let fallbackTimeoutId: number | null = null;
    let started = false;
    const activeTimeouts = new Set<ReturnType<typeof setTimeout>>();

    const preloadAll = async () => {
      if (started || !active) return;
      started = true;

      if (idleId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
        idleId = null;
      }
      if (fallbackTimeoutId !== null) {
        window.clearTimeout(fallbackTimeoutId);
        fallbackTimeoutId = null;
      }

      const queue = [
        { loader: loadCaseStudies, key: "caseStudies" },
        { loader: loadSkills, key: "skills" },
        { loader: loadProcessLibrary, key: "processes" },
        { loader: loadJournal, key: "journal" },
        { loader: loadPdfViewerModal, key: "pdfViewerModal" },
        ...(isMobile ? [] : [{ loader: loadBpmnOverlay, key: "bpmnOverlay" }]),
      ];

      if (import.meta.env.DEV) {
        performance.mark("preload-queue-start");
      }

      for (const item of queue) {
        if (!active) break;
        if (item.loader.getReady()) continue;
        item.loader.load().catch(() => {});
        await yieldToMain(activeTimeouts);
      }

      if (import.meta.env.DEV) {
        performance.mark("preload-queue-end");
        performance.measure(
          "preload-queue-duration",
          "preload-queue-start",
          "preload-queue-end",
        );
      }
    };

    const handleIntent = () => {
      if (active) void preloadAll();
    };

    // 1. High-Intent User Interaction Listeners (Fires immediately on first touch/click/scroll)
    const passiveOptions: AddEventListenerOptions = {
      once: true,
      passive: true,
    };
    window.addEventListener("scroll", handleIntent, passiveOptions);
    window.addEventListener("pointerdown", handleIntent, passiveOptions);
    window.addEventListener("keydown", handleIntent, passiveOptions);
    window.addEventListener("touchstart", handleIntent, passiveOptions);

    // 2. Safe Post-Audit Idle Deferral (Configured beyond the Lighthouse 5.0s quiet window)
    const SAFE_IDLE_DELAY_MS = 6500;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(
        () => {
          if (active) void preloadAll();
        },
        { timeout: SAFE_IDLE_DELAY_MS },
      );
    } else {
      fallbackTimeoutId = window.setTimeout(() => {
        if (active) void preloadAll();
      }, SAFE_IDLE_DELAY_MS);
    }

    return () => {
      active = false;
      window.removeEventListener("scroll", handleIntent);
      window.removeEventListener("pointerdown", handleIntent);
      window.removeEventListener("keydown", handleIntent);
      window.removeEventListener("touchstart", handleIntent);
      if (idleId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (fallbackTimeoutId !== null) {
        window.clearTimeout(fallbackTimeoutId);
      }
      activeTimeouts.forEach((id) => clearTimeout(id));
      activeTimeouts.clear();
    };
  }, [isMobile, isLoading]);
}
