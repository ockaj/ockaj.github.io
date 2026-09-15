import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore, selectIsAnyModalOpen } from "../useAppStore";

describe("useAppStore", () => {
  beforeEach(() => {
    useAppStore.setState({
      isLoading: false,
      hasCvMounted: false,
      activeSection: "home",
      activeModal: null,
      cvLang: "en",
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

  it("should toggle CV language", () => {
    expect(useAppStore.getState().cvLang).toBe("en");
    useAppStore.getState().setCvLang("sk");
    expect(useAppStore.getState().cvLang).toBe("sk");
  });

  it("should complete loading", () => {
    useAppStore.setState({ isLoading: true });
    useAppStore.getState().completeLoading();
    expect(useAppStore.getState().isLoading).toBe(false);
  });
});
