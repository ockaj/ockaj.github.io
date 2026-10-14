import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useAppStore } from "../../store/useAppStore";
import {
  applyHashNavigation,
  setupHashNavigationListener,
  checkIsAtDocumentBottom,
  commitScrollSpyHash,
  safeReplaceState,
  safePushState,
  navigateTo,
} from "../useAppNavigation";

interface MockElementOptions {
  tagName?: string;
  attributes?: Record<string, string>;
}

function createMockElement(options: MockElementOptions = {}) {
  const tagName = (options.tagName ?? "div").toUpperCase();
  const attributes = new Map<string, string>(
    Object.entries(options.attributes ?? {}),
  );
  const listeners: Record<string, ((event?: unknown) => void)[]> = {};

  return {
    tagName,
    hasAttribute: vi.fn((name: string) => attributes.has(name)),
    getAttribute: vi.fn((name: string) => attributes.get(name) ?? null),
    setAttribute: vi.fn((name: string, value: string) => {
      attributes.set(name, value);
    }),
    removeAttribute: vi.fn((name: string) => {
      attributes.delete(name);
    }),
    addEventListener: vi.fn(
      (
        event: string,
        listener: (event?: unknown) => void,
        options?: { once?: boolean },
      ) => {
        if (!listeners[event]) listeners[event] = [];
        const wrappedListener = (e?: unknown) => {
          listener(e);
          if (options?.once) {
            const idx = listeners[event].indexOf(wrappedListener);
            if (idx !== -1) listeners[event].splice(idx, 1);
          }
        };
        listeners[event].push(wrappedListener);
      },
    ),
    removeEventListener: vi.fn(
      (event: string, listener: (event?: unknown) => void) => {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter((l) => l !== listener);
        }
      },
    ),
    dispatchEvent: vi.fn((event: { type: string }) => {
      const handlers = listeners[event.type] || [];
      handlers.slice().forEach((h) => h(event));
      return true;
    }),
    scrollIntoView: vi.fn(),
    focus: vi.fn(),
  };
}

describe("useAppNavigation", () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;

  let windowHash = "#home";
  let eventListeners: Record<string, ((event?: unknown) => void)[]> = {};
  let mockDocElement: ReturnType<typeof createMockElement>;
  let mockSkillsSection: ReturnType<typeof createMockElement>;
  let mockWorkSection: ReturnType<typeof createMockElement>;
  let mockHomeSection: ReturnType<typeof createMockElement>;
  let mockCustomElement: ReturnType<typeof createMockElement>;

  beforeEach(() => {
    vi.restoreAllMocks();
    eventListeners = {};
    windowHash = "#home";

    mockDocElement = createMockElement({ tagName: "html" });
    mockSkillsSection = createMockElement({
      tagName: "section",
      attributes: { id: "skills" },
    });
    mockWorkSection = createMockElement({
      tagName: "section",
      attributes: { id: "work" },
    });
    mockHomeSection = createMockElement({
      tagName: "section",
      attributes: { id: "home" },
    });
    mockCustomElement = createMockElement({
      tagName: "div",
      attributes: { id: "customFeature" },
    });

    const mockWindow = {
      get location() {
        return {
          get hash() {
            return windowHash;
          },
          set hash(val: string) {
            windowHash = val;
          },
        };
      },
      history: {
        replaceState: vi.fn((_state, _title, url: string) => {
          windowHash = url;
        }),
        pushState: vi.fn((_state, _title, url: string) => {
          windowHash = url;
        }),
        state: null,
      },
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
      scrollTo: vi.fn(),
      addEventListener: vi.fn(
        (event: string, cb: (event?: unknown) => void) => {
          if (!eventListeners[event]) eventListeners[event] = [];
          eventListeners[event].push(cb);
        },
      ),
      removeEventListener: vi.fn(
        (event: string, cb: (event?: unknown) => void) => {
          if (eventListeners[event]) {
            eventListeners[event] = eventListeners[event].filter(
              (l) => l !== cb,
            );
          }
        },
      ),
    };

    const mockDocument = {
      documentElement: mockDocElement,
      getElementById: vi.fn((id: string) => {
        if (id === "skills") return mockSkillsSection;
        if (id === "work") return mockWorkSection;
        if (id === "home") return mockHomeSection;
        if (id === "customFeature") return mockCustomElement;
        return null;
      }),
      querySelector: vi.fn(() => null),
    };

    // @ts-expect-error test mock globals
    globalThis.window = mockWindow;
    // @ts-expect-error test mock globals
    globalThis.document = mockDocument;

    useAppStore.setState({
      isLoading: false,
      activeSection: "home",
      activeModal: null,
      hasCvMounted: false,
      cvLang: "en",
    });
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  });

  describe("applyHashNavigation", () => {
    it("navigates to section with instant behavior on mount", () => {
      applyHashNavigation("#skills", false, "instant");

      expect(useAppStore.getState().activeSection).toBe("skills");
      expect(mockSkillsSection.scrollIntoView).toHaveBeenCalledWith({
        behavior: "instant",
      });
    });

    it("handles hashchange section navigation with smooth behavior", () => {
      applyHashNavigation("#work", false, "smooth");

      expect(useAppStore.getState().activeSection).toBe("work");
      expect(mockWorkSection.scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
      });
    });

    it("closes any active modal when navigating to a section", () => {
      useAppStore.getState().openModal("cv");
      expect(useAppStore.getState().activeModal).toBe("cv");

      applyHashNavigation("#skills", false, "smooth");
      expect(useAppStore.getState().activeModal).toBeNull();
      expect(useAppStore.getState().activeSection).toBe("skills");
    });

    it("handles top shorthand fragment by scrolling to top", () => {
      useAppStore.getState().openModal("cv");

      applyHashNavigation("#top", false, "smooth");

      expect(useAppStore.getState().activeModal).toBeNull();
      expect(useAppStore.getState().activeSection).toBe("home");
      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: "smooth",
      });
    });

    it("opens valid modal for #cv fragment", () => {
      applyHashNavigation("#cv", false, "smooth");
      expect(useAppStore.getState().activeModal).toBe("cv");
    });

    it("opens modal and aligns parent section for deep-linked case studies", () => {
      applyHashNavigation("#case-study-logistics", false, "smooth");

      expect(useAppStore.getState().activeModal).toBe("case-study-logistics");
      expect(mockWorkSection.scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
      });
    });

    it("opens bpmn modal on desktop but closes and redirects to home on mobile", () => {
      // Desktop
      applyHashNavigation("#bpmn", false, "smooth");
      expect(useAppStore.getState().activeModal).toBe("bpmn");

      // Mobile
      applyHashNavigation("#bpmn", true, "smooth");
      expect(useAppStore.getState().activeModal).toBeNull();
      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        "",
        "#home",
      );
    });

    it("clears transient modal hashes like #nav and #menu", () => {
      useAppStore.getState().openModal("cv");
      applyHashNavigation("#nav", false, "smooth");

      expect(useAppStore.getState().activeModal).toBeNull();
      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        "",
        "#home",
      );
    });

    it("replaces state with #home for unknown fragment", () => {
      applyHashNavigation("#unknown-route", false, "smooth");

      expect(useAppStore.getState().activeModal).toBeNull();
      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        "",
        "#home",
      );
    });

    it("preserves case when finding indicated element", () => {
      applyHashNavigation("#customFeature", false, "smooth");

      expect(mockCustomElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
      });
    });

    it("schedules requestAnimationFrame alignment on instant navigation", () => {
      const originalRaf = globalThis.requestAnimationFrame;
      const rafCallbacks: FrameRequestCallback[] = [];
      globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
        rafCallbacks.push(cb);
        return 1;
      });

      applyHashNavigation("#skills", false, "instant");

      expect(globalThis.requestAnimationFrame).toHaveBeenCalled();
      expect(mockSkillsSection.scrollIntoView).toHaveBeenCalledTimes(1);

      rafCallbacks.forEach((cb) => cb(16));
      expect(mockSkillsSection.scrollIntoView).toHaveBeenCalledTimes(2);

      globalThis.requestAnimationFrame = originalRaf;
    });

    it("closes modal on empty fragment without modifying history", () => {
      useAppStore.getState().openModal("cv");
      applyHashNavigation("", false, "smooth");

      expect(useAppStore.getState().activeModal).toBeNull();
      expect(window.history.replaceState).not.toHaveBeenCalled();
    });
  });

  describe("hashchange listener lifecycle", () => {
    it("attaches passive hashchange listener, handles event, and detaches on cleanup", () => {
      const cleanup = setupHashNavigationListener(false);

      expect(window.addEventListener).toHaveBeenCalledWith(
        "hashchange",
        expect.any(Function),
        { passive: true },
      );

      // Verify dispatching registered listener
      windowHash = "#work";
      const handlers = eventListeners["hashchange"] || [];
      expect(handlers).toHaveLength(1);

      handlers.forEach((h) => h());
      expect(useAppStore.getState().activeSection).toBe("work");
      expect(mockWorkSection.scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
      });

      // Verify cleanup
      cleanup();
      expect(window.removeEventListener).toHaveBeenCalledWith(
        "hashchange",
        handlers[0],
      );
      expect(eventListeners["hashchange"]).toHaveLength(0);
    });
  });

  describe("checkIsAtDocumentBottom", () => {
    it("returns true when exactly at the bottom of the document", () => {
      expect(checkIsAtDocumentBottom(5000, 747, 5747)).toBe(true);
    });

    it("returns true when within tolerance of the document bottom", () => {
      // 5000 + 747 = 5747, scrollHeight = 5750, tolerance = 4 (delta = 3)
      expect(checkIsAtDocumentBottom(5000, 747, 5750, 4)).toBe(true);
    });

    it("returns false when not at the bottom of the document", () => {
      expect(checkIsAtDocumentBottom(2000, 700, 5000)).toBe(false);
    });
  });

  describe("commitScrollSpyHash", () => {
    it("returns false and does not call replaceState when isNavigating is true", () => {
      const result = commitScrollSpyHash("#contact", true);
      expect(result).toBe(false);
      expect(window.history.replaceState).not.toHaveBeenCalled();
    });

    it("returns false when pendingHash is null", () => {
      const result = commitScrollSpyHash(null, false);
      expect(result).toBe(false);
      expect(window.history.replaceState).not.toHaveBeenCalled();
    });

    it("returns false when window.location.hash already equals pendingHash", () => {
      windowHash = "#contact";
      const result = commitScrollSpyHash("#contact", false);
      expect(result).toBe(false);
      expect(window.history.replaceState).not.toHaveBeenCalled();
    });

    it("returns false and does not replace hash when a modal is active", () => {
      useAppStore.getState().openModal("cv");
      windowHash = "#cv";

      const result = commitScrollSpyHash("#contact", false);
      expect(result).toBe(false);
      expect(window.history.replaceState).not.toHaveBeenCalled();
    });

    it("updates history and returns true for valid new section hash", () => {
      windowHash = "#skills";
      const result = commitScrollSpyHash("#contact", false);

      expect(result).toBe(true);
      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        "",
        "#contact",
      );
      expect(windowHash).toBe("#contact");
    });

    it("catches SecurityError from replaceState defensively without throwing", () => {
      windowHash = "#skills";
      // Simulate WebKit 100-calls rate limit SecurityError
      vi.mocked(window.history.replaceState).mockImplementationOnce(() => {
        throw new Error("SecurityError: DOM Exception 18");
      });

      let result: boolean | undefined;
      expect(() => {
        result = commitScrollSpyHash("#contact", false);
      }).not.toThrow();
      expect(result).toBe(false);
    });
  });

  describe("safeReplaceState and safePushState", () => {
    it("safeReplaceState updates history and returns true", () => {
      const result = safeReplaceState("#skills");
      expect(result).toBe(true);
      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        "",
        "#skills",
      );
      expect(windowHash).toBe("#skills");
    });

    it("safeReplaceState catches SecurityError and returns false", () => {
      vi.mocked(window.history.replaceState).mockImplementationOnce(() => {
        throw new Error("SecurityError: DOM Exception 18");
      });
      const result = safeReplaceState("#skills");
      expect(result).toBe(false);
    });

    it("safePushState updates history and returns true", () => {
      const result = safePushState("#work");
      expect(result).toBe(true);
      expect(window.history.pushState).toHaveBeenCalledWith(null, "", "#work");
      expect(windowHash).toBe("#work");
    });

    it("safePushState catches SecurityError and returns false", () => {
      vi.mocked(window.history.pushState).mockImplementationOnce(() => {
        throw new Error("SecurityError: DOM Exception 18");
      });
      const result = safePushState("#work");
      expect(result).toBe(false);
    });

    it("navigateTo uses safe history helpers and does not throw on SecurityError", () => {
      vi.mocked(window.history.pushState).mockImplementationOnce(() => {
        throw new Error("SecurityError: DOM Exception 18");
      });

      expect(() => {
        navigateTo("skills");
      }).not.toThrow();
      expect(useAppStore.getState().activeSection).toBe("skills");
    });

    it("passes custom state when provided to safeReplaceState and safePushState", () => {
      const customState = { view: "compact" };
      expect(safeReplaceState("#skills", customState)).toBe(true);
      expect(window.history.replaceState).toHaveBeenCalledWith(
        customState,
        "",
        "#skills",
      );

      expect(safePushState("#work", customState)).toBe(true);
      expect(window.history.pushState).toHaveBeenCalledWith(
        customState,
        "",
        "#work",
      );
    });

    it("catches SecurityError thrown during history.state property access", () => {
      vi.spyOn(window.history, "state", "get").mockImplementationOnce(() => {
        throw new Error("SecurityError: DOM Exception 18");
      });
      expect(safeReplaceState("#skills")).toBe(false);

      vi.spyOn(window.history, "state", "get").mockImplementationOnce(() => {
        throw new Error("SecurityError: DOM Exception 18");
      });
      expect(safePushState("#work")).toBe(false);
    });

    it("returns false in SSR environments without window or history API", () => {
      // @ts-expect-error simulate SSR
      globalThis.window = undefined;
      expect(safeReplaceState("#skills")).toBe(false);
      expect(safePushState("#skills")).toBe(false);
    });
  });
});
