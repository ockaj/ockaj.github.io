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
    const dateStr = fm.date || "";
    const timestamp = dateStr ? Date.parse(dateStr) || 0 : 0;

    return {
      article: {
        id: String(fm.id || mod.id || "article"),
        title: fm.title || "Untitled",
        subtitle: fm.subtitle || "",
        readTime: mod.readTime || fm.readTime || "1 min read",
        date: dateStr,
        image: fm.image || "",
        excerpt: mod.excerpt || fm.excerpt || "",
        Content: mod.default,
      },
      timestamp,
    };
  })
  .sort((a, b) => b.timestamp - a.timestamp)
  .map((item) => item.article);

export const ARTICLES_BY_ID = new Map<string, Article>(
  ARTICLES.map((article) => [article.id, article]),
);
