import { parse } from "yaml";

const caseStudyModules = import.meta.glob("./caseStudies/*.md", {
  query: "?raw",
  eager: true,
}) as Record<string, { default: string }>;

export interface CaseStudyFrontmatter {
  id?: string | number;
  title?: string;
  subtitle?: string;
  category?: string;
  challenge?: string;
  solution?: string;
  results?: string;
  tools?: string;
  timeline?: string;
  client?: string;
  asIsFlow?: string[];
  toBeFlow?: string[];
  methodology?: string[];
  deliverables?: string[];
}

export interface CaseStudyDetail {
  id: string | number;
  title: string;
  subtitle: string;
  category: string;
  challenge: string;
  solution: string;
  results: { metric: string; description: string }[];
  tools: string[];
  timeline: string;
  client: string;
  longDescription: string;
  asIsFlow: string[];
  toBeFlow: string[];
  methodology: string[];
  deliverables: string[];
}

const parseResults = (raw: string): { metric: string; description: string }[] =>
  raw.split(";").flatMap((item) => {
    const pipeIndex = item.indexOf("|");
    const metric = (
      pipeIndex !== -1 ? item.substring(0, pipeIndex) : item
    ).trim();
    if (!metric) return [];
    const description =
      pipeIndex !== -1 ? item.substring(pipeIndex + 1).trim() : "";
    return [{ metric, description }];
  });

const parseTools = (raw: string): string[] =>
  raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

export const CASE_STUDIES: CaseStudyDetail[] = Object.entries(
  caseStudyModules,
).map(([path, module]) => {
  const filename = path.split("/").pop() || "";
  const raw = module.default;
  const parts = raw.split("---");
  const fm = (parse(parts[1]) || {}) as CaseStudyFrontmatter;
  const body = parts.slice(2).join("---").trim();

  let id: number | string = (fm.id as string) || filename.replace(/\.md$/, "");
  if (typeof id === "string" && !isNaN(Number(id))) id = Number(id);

  return {
    id,
    title: (fm.title as string) || "Untitled",
    subtitle: (fm.subtitle as string) || "",
    category: (fm.category as string) || "",
    challenge: (fm.challenge as string) || "",
    solution: (fm.solution as string) || "",
    results: parseResults((fm.results as string) || ""),
    tools: parseTools((fm.tools as string) || ""),
    timeline: (fm.timeline as string) || "",
    client: (fm.client as string) || "",
    longDescription: body,
    asIsFlow: (fm.asIsFlow as string[]) || [],
    toBeFlow: (fm.toBeFlow as string[]) || [],
    methodology: (fm.methodology as string[]) || [],
    deliverables: (fm.deliverables as string[]) || [],
  };
});
