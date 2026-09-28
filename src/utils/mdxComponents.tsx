import type { ComponentProps, JSX } from "react";

export interface MdxComponentsMap {
  readonly table?: (props: ComponentProps<"table">) => JSX.Element;
  readonly a?: (props: ComponentProps<"a">) => JSX.Element;
}

export const mdxComponents: MdxComponentsMap = {
  table: (props: ComponentProps<"table">) => (
    <div className="table-container">
      <table {...props} />
    </div>
  ),
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
