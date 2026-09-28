import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import { remarkMdxMetadata } from "./remarkMdxMetadata.ts";

export function createMdxPlugin() {
  return {
    enforce: "pre" as const,
    ...mdx({
      remarkPlugins: [
        remarkFrontmatter,
        [remarkMdxFrontmatter, { name: "frontmatter" }],
        remarkGfm,
        remarkMdxMetadata,
      ],
    }),
  };
}
