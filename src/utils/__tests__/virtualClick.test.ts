import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isVirtualClick, isAndroid } from "../virtualClick";

function createMockClickEvent(overrides: {
  type?: string;
  detail?: number;
  buttons?: number;
  pointerType?: string;
  isTrusted?: boolean;
}): MouseEvent {
  return {
    type: overrides.type ?? "click",
    detail: overrides.detail ?? 1,
    buttons: overrides.buttons ?? 0,
    pointerType: overrides.pointerType,
    isTrusted: overrides.isTrusted ?? false,
  } as unknown as MouseEvent;
}

describe("isVirtualClick and isAndroid", () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  function setMockUserAgent(userAgent: string, platform = "") {
    Object.defineProperty(globalThis, "navigator", {
      value: {
        userAgent,
        platform,
      },
      writable: true,
      configurable: true,
    });
  }

  describe("isAndroid platform detection", () => {
    it("returns true for Android userAgent", () => {
      setMockUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 7)");
      expect(isAndroid()).toBe(true);
    });

    it("returns true for Android platform", () => {
      setMockUserAgent("", "android");
      expect(isAndroid()).toBe(true);
    });

    it("returns false for non-Android platforms", () => {
      setMockUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Win32");
      expect(isAndroid()).toBe(false);
    });
  });

  describe("isVirtualClick", () => {
    it("identifies virtual clicks with empty pointerType and isTrusted true", () => {
      const event = createMockClickEvent({ pointerType: "", isTrusted: true });
      expect(isVirtualClick(event)).toBe(true);
    });

    it("identifies TalkBack Android clicks with buttons === 1 on Android", () => {
      setMockUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 7)");
      const event = createMockClickEvent({ buttons: 1, pointerType: "touch" });
      expect(isVirtualClick(event)).toBe(true);
    });

    it("rejects buttons === 1 clicks on non-Android platforms", () => {
      setMockUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Win32");
      const event = createMockClickEvent({ buttons: 1, pointerType: "mouse" });
      expect(isVirtualClick(event)).toBe(false);
    });

    it("identifies keyboard or accessibility clicks with detail === 0 and no pointerType", () => {
      const event = createMockClickEvent({ detail: 0, pointerType: undefined });
      expect(isVirtualClick(event)).toBe(true);
    });

    it("identifies physical mouse release click with detail === 1 as non-virtual", () => {
      const event = createMockClickEvent({
        detail: 1,
        buttons: 0,
        pointerType: "mouse",
      });
      expect(isVirtualClick(event)).toBe(false);
    });

    it("identifies touch release click with detail === 1 and no buttons as non-virtual", () => {
      const event = createMockClickEvent({
        detail: 1,
        buttons: 0,
        pointerType: "touch",
      });
      expect(isVirtualClick(event)).toBe(false);
    });
  });
});
