import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isConnectionConstrained, getConnectionRootMargin } from "../connection";

describe("connection utilities and adaptive network heuristics", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("isConnectionConstrained", () => {
    it.each([
      [{ saveData: true, effectiveType: "4g" }, true, "saveData is enabled"],
      [{ saveData: false, effectiveType: "slow-2g" }, true, "effectiveType is slow-2g"],
      [{ saveData: false, effectiveType: "2g" }, true, "effectiveType is 2g"],
      [{ saveData: false, effectiveType: "3g" }, false, "effectiveType is 3g"],
      [{ saveData: false, effectiveType: "4g" }, false, "effectiveType is 4g"],
      [{ saveData: false, effectiveType: "unknown" }, false, "effectiveType is unknown"],
      [{}, false, "connection properties are empty"],
    ])("returns %s when %s", (connectionMock, expected, _description) => {
      vi.stubGlobal("navigator", { connection: connectionMock });
      expect(isConnectionConstrained()).toBe(expected);
    });

    it("returns false when navigator.connection is undefined or missing", () => {
      vi.stubGlobal("navigator", {});
      expect(isConnectionConstrained()).toBe(false);
    });

    it("returns false in SSR environments where navigator is undefined", () => {
      vi.stubGlobal("navigator", undefined);
      expect(isConnectionConstrained()).toBe(false);
    });
  });

  describe("getConnectionRootMargin", () => {
    it.each([
      [{ saveData: true }, "400px 0px", "saveData is true"],
      [{ effectiveType: "slow-2g" }, "400px 0px", "effectiveType is slow-2g"],
      [{ effectiveType: "2g" }, "400px 0px", "effectiveType is 2g"],
      [{ effectiveType: "3g" }, "800px 0px", "effectiveType is 3g"],
      [{ effectiveType: "4g" }, "1200px 0px", "effectiveType is 4g"],
      [{ effectiveType: "unknown" }, "1200px 0px", "effectiveType is unrecognized"],
      [{}, "1200px 0px", "connection info is empty"],
    ])("returns '%s' when %s", (connectionMock, expectedMargin, _description) => {
      vi.stubGlobal("navigator", { connection: connectionMock });
      expect(getConnectionRootMargin()).toBe(expectedMargin);
    });

    it("falls back to default 1200px margin when navigator.connection is missing or navigator is undefined", () => {
      vi.stubGlobal("navigator", {});
      expect(getConnectionRootMargin()).toBe("1200px 0px");

      vi.stubGlobal("navigator", undefined);
      expect(getConnectionRootMargin()).toBe("1200px 0px");
    });
  });
});
