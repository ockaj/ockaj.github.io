import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useAppStore } from "../../store/useAppStore";
import {
  applyHashNavigation,
  setupHashNavigationListener,
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
});
