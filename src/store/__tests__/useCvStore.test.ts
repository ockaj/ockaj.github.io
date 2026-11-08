import { describe, it, expect, beforeEach } from "vitest";
import { useCvStore } from "../useCvStore";

describe("useCvStore", () => {
  beforeEach(() => {
    useCvStore.getState().reset();
  });

  it("initializes with default language and tab", () => {
    const state = useCvStore.getState();
    expect(state.lang).toBe("en");
    expect(state.activeTab).toBe("interactive");
  });

  it("updates CV language", () => {
    expect(useCvStore.getState().lang).toBe("en");
    useCvStore.getState().setLang("sk");
    expect(useCvStore.getState().lang).toBe("sk");

    // Setting same language preserves reference
    const prevState = useCvStore.getState();
    useCvStore.getState().setLang("sk");
    expect(useCvStore.getState()).toBe(prevState);
  });

  it("updates active tab", () => {
    expect(useCvStore.getState().activeTab).toBe("interactive");
    useCvStore.getState().setActiveTab("pdf");
    expect(useCvStore.getState().activeTab).toBe("pdf");

    // Setting same tab preserves reference
    const prevState = useCvStore.getState();
    useCvStore.getState().setActiveTab("pdf");
    expect(useCvStore.getState()).toBe(prevState);
  });

  it("resets state back to fallback defaults", () => {
    useCvStore.getState().setLang("sk");
    useCvStore.getState().setActiveTab("pdf");
    expect(useCvStore.getState().lang).toBe("sk");
    expect(useCvStore.getState().activeTab).toBe("pdf");

    useCvStore.getState().reset();
    expect(useCvStore.getState().lang).toBe("en");
    expect(useCvStore.getState().activeTab).toBe("interactive");
  });

  it("handles boundary state and undefined checks", () => {
    const state = useCvStore.getState();
    expect(state.lang).not.toBeNull();
    expect(state.activeTab).not.toBeUndefined();
  });
});
