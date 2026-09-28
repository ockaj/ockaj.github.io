import { describe, it, expect } from "vitest";
import { ARTICLES, ARTICLES_BY_ID } from "../articles";
import { compile } from "@mdx-js/mdx";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import { remarkMdxMetadata } from "../../../vite/remarkMdxMetadata.ts";

describe("articles data pipeline", () => {
  describe("MDX compilation pipeline", () => {
    it("transforms markdown into JSX component with frontmatter and metadata exports", async () => {
      const markdown = `---
id: test-article
title: Test Article Title
subtitle: Test Subtitle
date: 2026-06-15
image: /test.jpg
---

This is **bold** text with [link](https://example.com).

| Col 1 | Col 2 |
| :--- | :--- |
| Val 1 | Val 2 |
`;

      const compiled = await compile(
        { value: markdown, path: "/path/to/test-article.md" },
        {
          remarkPlugins: [
            remarkFrontmatter,
            [remarkMdxFrontmatter, { name: "frontmatter" }],
            remarkGfm,
            remarkMdxMetadata,
          ],
        },
      );
      const code = String(compiled);
      expect(code).toContain('id = "test-article"');
      expect(code).toContain("readTime = ");
      expect(code).toContain("excerpt = ");
      expect(code).toContain("export const frontmatter = {");
      expect(code).toContain("export default function MDXContent");
    });

    it("handles markdown with horizontal rules without breaking", async () => {
      const markdown = `---
title: Divider Test
---

First paragraph.

---

Second paragraph.`;

      const compiled = await compile(
        { value: markdown, path: "/path/to/divider.md" },
        {
          remarkPlugins: [
            remarkFrontmatter,
            [remarkMdxFrontmatter, { name: "frontmatter" }],
            remarkGfm,
            remarkMdxMetadata,
          ],
        },
      );
      const code = String(compiled);
      expect(code).toContain("First paragraph");
      expect(code).toContain("Second paragraph");
    });
  });

  describe("ARTICLES and ARTICLES_BY_ID exports", () => {
    it("loads articles and sets up lookup map with compiled Content component", () => {
      expect(ARTICLES.length).toBeGreaterThan(0);
      for (const article of ARTICLES) {
        expect(article.id).toBeTruthy();
        expect(article.title).toBeTruthy();
        expect(article.Content).toBeTypeOf("function");
        expect(article.excerpt).toBeTruthy();
        expect(article.readTime).toBeTruthy();
        expect(ARTICLES_BY_ID.get(article.id)).toBe(article);
      }
    });

    it("sorts articles descending by date timestamp", () => {
      for (let i = 1; i < ARTICLES.length; i++) {
        const prevTime = Date.parse(ARTICLES[i - 1].date) || 0;
        const currTime = Date.parse(ARTICLES[i].date) || 0;
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }
    });
  });
});
