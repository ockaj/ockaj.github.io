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

export function usePreloadComponents(isMobile: boolean): void {
  useEffect(() => {
    if (isSlowConnection()) return;

    let active = true;
    let idleId: number | null = null;
    let timeoutId: number | null = null;
    const activeTimeouts = new Set<ReturnType<typeof setTimeout>>();

    const yieldToMain = async () => {
      const scheduler = (
        window as Window & { scheduler?: { yield: () => Promise<void> } }
      ).scheduler;
      if (typeof scheduler?.yield === "function") {
        await scheduler.yield();
      } else {
        await new Promise<void>((resolve) => {
          const id = setTimeout(() => {
            activeTimeouts.delete(id);
            resolve();
          }, 0);
          activeTimeouts.add(id);
        });
      }
    };

    const preloadAll = async () => {
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
        await yieldToMain();
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

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(
        () => {
          if (active) void preloadAll();
        },
        { timeout: 2000 },
      );
    } else {
      timeoutId = window.setTimeout(() => {
        if (active) void preloadAll();
      }, 0);
    }

    return () => {
      active = false;
      if (idleId !== null) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      activeTimeouts.forEach((id) => clearTimeout(id));
      activeTimeouts.clear();
    };
  }, [isMobile]);
}
