import type { Components } from "react-markdown";

export const COMMON_MARKDOWN_COMPONENTS: Components = {
  strong: ({ children }) => (
    <strong className="font-semibold text-text-primary">{children}</strong>
  ),
  code: ({ children }) => (
    <code className="px-1.5 py-0.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
      {children}
    </code>
  ),
};
