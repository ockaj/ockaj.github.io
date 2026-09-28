import type { ComponentType } from "react";
import type { MdxComponentsMap } from "../utils/mdxComponents";

interface CaseStudyFrontmatter {
  id?: string | number;
  title?: string;
  subtitle?: string;
  category?: string;
  challenge?: string;
  solution?: string;
  results?: unknown;
  tools?: unknown;
  timeline?: string;
  client?: string;
  asIsFlow?: string[];
  toBeFlow?: string[];
  methodology?: string[];
  deliverables?: string[];
}

export interface CaseStudyResult {
  metric: string;
  description: string;
}

export interface CaseStudyDetail {
  id: string | number;
  title: string;
  subtitle: string;
  category: string;
  challenge: string;
  solution: string;
  results: CaseStudyResult[];
  tools: string[];
  timeline: string;
  client: string;
  Content: ComponentType<{ components?: MdxComponentsMap }>;
  asIsFlow: string[];
  toBeFlow: string[];
  methodology: string[];
  deliverables: string[];
}

export const parseResults = (raw: unknown): CaseStudyResult[] => {
  if (Array.isArray(raw)) {
    return raw.flatMap((item) => {
      if (item && typeof item === "object" && "metric" in item) {
        const resultItem = item as { metric?: unknown; description?: unknown };
        const metric = String(resultItem.metric ?? "").trim();
        const description = String(resultItem.description ?? "").trim();
        if (metric) return [{ metric, description }];
      }
      return [];
    });
  }
  if (typeof raw === "string") {
    return raw.split(";").flatMap((item) => {
      const pipeIndex = item.indexOf("|");
      const metric = (
        pipeIndex !== -1 ? item.substring(0, pipeIndex) : item
      ).trim();
      if (!metric) return [];
      const description =
        pipeIndex !== -1 ? item.substring(pipeIndex + 1).trim() : "";
      return [{ metric, description }];
    });
  }
  return [];
};

export const parseTools = (raw: unknown): string[] => {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((tool) => tool.trim())
      .filter(Boolean);
  }
  return [];
};

interface CompiledCaseStudyModule {
  readonly id?: string | number;
  readonly frontmatter?: CaseStudyFrontmatter;
  readonly excerpt?: string;
  readonly readTime?: string;
  readonly default: ComponentType;
}

const caseStudyModules = import.meta.glob<CompiledCaseStudyModule>(
  "./caseStudies/*.md",
  {
    eager: true,
  },
);

export const CASE_STUDIES: CaseStudyDetail[] = Object.values(
  caseStudyModules,
).map((mod) => {
  const fm = mod.frontmatter || {};

  let id: number | string =
    fm.id !== undefined && fm.id !== "" ? fm.id : (mod.id ?? "case-study");
  if (typeof id === "string" && !isNaN(Number(id))) id = Number(id);

  return {
    id,
    title: fm.title || "Untitled",
    subtitle: fm.subtitle || "",
    category: fm.category || "",
    challenge: fm.challenge || "",
    solution: fm.solution || "",
    results: parseResults(fm.results),
    tools: parseTools(fm.tools),
    timeline: fm.timeline || "",
    client: fm.client || "",
    Content: mod.default,
    asIsFlow: Array.isArray(fm.asIsFlow) ? fm.asIsFlow : [],
    toBeFlow: Array.isArray(fm.toBeFlow) ? fm.toBeFlow : [],
    methodology: Array.isArray(fm.methodology) ? fm.methodology : [],
    deliverables: Array.isArray(fm.deliverables) ? fm.deliverables : [],
  };
});

export const CASE_STUDIES_BY_ID = new Map<string, CaseStudyDetail>(
  CASE_STUDIES.map((study) => [String(study.id), study]),
);
