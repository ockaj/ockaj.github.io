import { describe, it, expect } from "vitest";
import {
  parseResults,
  parseTools,
  CASE_STUDIES,
  CASE_STUDIES_BY_ID,
} from "../caseStudies";

describe("case studies data pipeline", () => {
  describe("parseResults", () => {
    it("parses native YAML array of metric objects", () => {
      const input = [
        { metric: "42", description: "processes mapped" },
        { metric: "100%", description: "logic errors audited" },
      ];
      const results = parseResults(input);
      expect(results).toEqual([
        { metric: "42", description: "processes mapped" },
        { metric: "100%", description: "logic errors audited" },
      ]);
    });

    it("parses legacy semicolon-and-pipe delimited string", () => {
      const input = "42 | processes mapped; 100% | logic errors audited";
      const results = parseResults(input);
      expect(results).toEqual([
        { metric: "42", description: "processes mapped" },
        { metric: "100%", description: "logic errors audited" },
      ]);
    });

    it("returns empty array for invalid or empty inputs", () => {
      expect(parseResults(null)).toEqual([]);
      expect(parseResults(undefined)).toEqual([]);
      expect(parseResults("")).toEqual([]);
      expect(parseResults({})).toEqual([]);
    });
  });

  describe("parseTools", () => {
    it("parses native YAML array of string tools", () => {
      const input = ["BPMN 2.0", "ADONIS", "Process Mapping"];
      const tools = parseTools(input);
      expect(tools).toEqual(["BPMN 2.0", "ADONIS", "Process Mapping"]);
    });

    it("parses legacy comma-separated string", () => {
      const input = "BPMN 2.0, ADONIS, Process Mapping";
      const tools = parseTools(input);
      expect(tools).toEqual(["BPMN 2.0", "ADONIS", "Process Mapping"]);
    });

    it("returns empty array for invalid or empty inputs", () => {
      expect(parseTools(null)).toEqual([]);
      expect(parseTools(undefined)).toEqual([]);
      expect(parseTools("")).toEqual([]);
    });
  });

  describe("CASE_STUDIES and CASE_STUDIES_BY_ID exports", () => {
    it("loads case studies and allows lookup by string id", () => {
      expect(CASE_STUDIES.length).toBeGreaterThan(0);
      for (const study of CASE_STUDIES) {
        expect(study.id).toBeDefined();
        expect(study.title).toBeTruthy();
        expect(study.Content).toBeTypeOf("function");
        expect(study.results.length).toBeGreaterThan(0);
        expect(study.tools.length).toBeGreaterThan(0);
        expect(CASE_STUDIES_BY_ID.get(String(study.id))).toBe(study);
      }
    });
  });
});
