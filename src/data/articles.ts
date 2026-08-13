import { parse } from "yaml";

const markdownModules = import.meta.glob("./articles/*.md", {
  query: "?raw",
  eager: true,
}) as Record<string, { default: string }>;

const MD_EXT_REGEX = /\.md$/;
const WHITESPACE_REGEX = /\s+/;

interface ArticleFrontmatter {
  id?: string;
  title?: string;
  subtitle?: string;
  readTime?: string;
  date?: string;
  image?: string;
}

export interface Article {
  id: string;
  title: string;
  subtitle: string;
  readTime: string;
  date: string;
  image: string;
  body: string;
}

export const ARTICLES: Article[] = Object.entries(markdownModules)
  .map(([path, module]) => {
    const filename = path.split("/").pop() || "";
    const raw = module.default;
    const parts = raw.split("---");
    const frontmatter = (parse(parts[1]) || {}) as ArticleFrontmatter;
    const body = parts.slice(2).join("---").trim();

    const wordCount = body.split(WHITESPACE_REGEX).filter(Boolean).length;

    return {
      id: frontmatter.id || filename.replace(MD_EXT_REGEX, ""),
      title: frontmatter.title || "Untitled",
      subtitle: frontmatter.subtitle || "",
      readTime:
        frontmatter.readTime ||
        `${Math.max(1, Math.ceil(wordCount / 200))} min read`,
      date: frontmatter.date || "",
      image: frontmatter.image || "",
      body,
    };
  })
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
