import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAppStore, selectIsAnyModalOpen } from "../useAppStore";

describe("useAppStore", () => {
  beforeEach(() => {
    useAppStore.setState({
      isLoading: false,
      hasCvMounted: false,
      activeSection: "home",
      activeModal: null,
    });
  });

  it("should open and close modal correctly", () => {
    expect(useAppStore.getState().activeModal).toBeNull();
    expect(selectIsAnyModalOpen(useAppStore.getState())).toBe(false);

    useAppStore.getState().openModal("case-study-1");
    expect(useAppStore.getState().activeModal).toBe("case-study-1");
    expect(selectIsAnyModalOpen(useAppStore.getState())).toBe(true);

    useAppStore.getState().closeModal();
    expect(useAppStore.getState().activeModal).toBeNull();
    expect(selectIsAnyModalOpen(useAppStore.getState())).toBe(false);
  });

  it("should set hasCvMounted to true when opening cv modal", () => {
    expect(useAppStore.getState().hasCvMounted).toBe(false);
    useAppStore.getState().openModal("cv");
    expect(useAppStore.getState().hasCvMounted).toBe(true);
    expect(useAppStore.getState().activeModal).toBe("cv");
  });

  it("should update active section", () => {
    useAppStore.getState().setActiveSection("skills");
    expect(useAppStore.getState().activeSection).toBe("skills");

    // Setting same section should not trigger unnecessary state changes
    const stateBefore = useAppStore.getState();
    useAppStore.getState().setActiveSection("skills");
    expect(useAppStore.getState()).toBe(stateBefore);
  });

  it("should complete loading", () => {
    useAppStore.setState({ isLoading: true });
    useAppStore.getState().completeLoading();
    expect(useAppStore.getState().isLoading).toBe(false);
  });

  it("should complete loading and attempt localStorage persistence when window is defined", () => {
    const setItemSpy = vi.fn();
    const originalWindow = globalThis.window;

    globalThis.window = {
      localStorage: {
        setItem: setItemSpy,
        getItem: vi.fn(),
      },
    } as unknown as Window & typeof globalThis;

    try {
      useAppStore.setState({ isLoading: true });
      useAppStore.getState().completeLoading();
      expect(useAppStore.getState().isLoading).toBe(false);
      expect(setItemSpy).toHaveBeenCalledWith("portfolio_loaded", "true");
    } finally {
      globalThis.window = originalWindow;
    }
  });

  it("should handle storage exceptions gracefully in completeLoading", () => {
    const originalWindow = globalThis.window;

    globalThis.window = {
      localStorage: {
        setItem: () => {
          throw new DOMException("Access is denied", "SecurityError");
        },
        getItem: vi.fn(),
      },
    } as unknown as Window & typeof globalThis;

    try {
      useAppStore.setState({ isLoading: true });
      expect(() => useAppStore.getState().completeLoading()).not.toThrow();
      expect(useAppStore.getState().isLoading).toBe(false);
    } finally {
      globalThis.window = originalWindow;
    }
  });
});
