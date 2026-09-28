/// <reference types="vite/client" />

declare module "*.md" {
  import type { ComponentType } from "react";
  import type { MdxComponentsMap } from "./utils/mdxComponents";
  const Content: ComponentType<{ components?: MdxComponentsMap }>;
  export default Content;
  export const id: string | number;
  export const frontmatter: unknown;
  export const excerpt: string;
  export const readTime: string;
}

declare module "*.mdx" {
  import type { ComponentType } from "react";
  import type { MdxComponentsMap } from "./utils/mdxComponents";
  const Content: ComponentType<{ components?: MdxComponentsMap }>;
  export default Content;
  export const id: string | number;
  export const frontmatter: unknown;
  export const excerpt: string;
  export const readTime: string;
}
