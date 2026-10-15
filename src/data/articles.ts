import type { ComponentType } from "react";
import type { MdxComponentsMap } from "../utils/mdxComponents";

interface ArticleFrontmatter {
  id?: string;
  title?: string;
  subtitle?: string;
  readTime?: string;
  date?: string;
  image?: string;
  excerpt?: string;
}

interface CompiledArticleModule {
  readonly id?: string;
  readonly frontmatter?: ArticleFrontmatter;
  readonly excerpt?: string;
  readonly readTime?: string;
  readonly default: ComponentType;
}

const articleModules = import.meta.glob<CompiledArticleModule>(
  "./articles/*.md",
  {
    eager: true,
  },
);

export interface Article {
  id: string;
  title: string;
  subtitle: string;
  readTime: string;
  date: string;
  image: string;
  excerpt: string;
  Content: ComponentType<{ components?: MdxComponentsMap }>;
}

export const ARTICLES: Article[] = Object.values(articleModules)
  .map((mod) => {
    const fm = mod.frontmatter || {};
    return {
      id: String(fm.id || mod.id || "article")
        .trim()
        .toLowerCase(),
      title: fm.title || "Untitled",
      subtitle: fm.subtitle || "",
      readTime: fm.readTime || mod.readTime || "1 min read",
      date: fm.date || "",
      image: fm.image || "",
      excerpt: fm.excerpt || mod.excerpt || "",
      Content: mod.default,
    };
  })
  .toSorted((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));

export const ARTICLES_BY_ID = new Map<string, Article>(
  ARTICLES.map((article) => [article.id, article]),
);
