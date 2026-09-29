import type { ComponentProps, JSX, ReactNode } from "react";

export interface MdxComponentsMap {
  readonly table?: (props: ComponentProps<"table">) => JSX.Element;
  readonly td?: (props: ComponentProps<"td">) => JSX.Element;
  readonly a?: (props: ComponentProps<"a">) => JSX.Element;
}

function renderRatingIndicator(text: string): JSX.Element | null {
  const trimmed = text.trim();
  switch (trimmed) {
    case "Very High":
    case "High":
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-text-primary whitespace-nowrap">
          <span className="size-1.5 shrink-0 rounded-full bg-accent" />
          {trimmed}
        </span>
      );
    case "Medium-High":
    case "Medium":
      return (
        <span className="inline-flex items-center gap-1.5 text-text-primary/75 whitespace-nowrap">
          <span className="size-1.5 shrink-0 rounded-full bg-white/30" />
          {trimmed}
        </span>
      );
    case "Low-Medium":
    case "Low":
    case "Very Low":
      return (
        <span className="inline-flex items-center gap-1.5 text-muted/50 whitespace-nowrap">
          <span className="size-1.5 shrink-0 rounded-full bg-white/10" />
          {trimmed}
        </span>
      );
    default:
      return null;
  }
}

function getSingleText(children: ReactNode): string | null {
  if (typeof children === "string") return children;
  if (
    Array.isArray(children) &&
    children.length === 1 &&
    typeof children[0] === "string"
  ) {
    return children[0];
  }
  return null;
}

export const mdxComponents: MdxComponentsMap = {
  table: (props: ComponentProps<"table">) => (
    <div className="table-container">
      <table {...props} />
    </div>
  ),
  td: ({ children, ...props }: ComponentProps<"td">) => {
    const singleText = getSingleText(children);
    const indicator = singleText ? renderRatingIndicator(singleText) : null;
    return (
      <td {...props}>
        {indicator ?? children}
      </td>
    );
  },
  a: ({ href, children, ...props }: ComponentProps<"a">) => {
    const isExternal = href?.startsWith("http");
    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        {...props}
      >
        {children}
      </a>
    );
  },
};
