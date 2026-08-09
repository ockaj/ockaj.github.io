import type { Components } from "react-markdown";

export const COMMON_MARKDOWN_COMPONENTS: Components = {
  strong: ({ children }) => (
    <strong className="text-text-primary font-semibold">{children}</strong>
  ),
  code: ({ children }) => (
    <code className="rounded-xl border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-xs">
      {children}
    </code>
  ),
};
