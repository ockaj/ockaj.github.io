import { type ElementType, type Ref } from "react";
import { cn } from "../../utils/cn";
import { INNER_GLASS_STYLE } from "./internal/config";
import { type StaticGlassPropsWithRef } from "./internal/types";
import { InnerBorderOverlay } from "./internal/LiquidGlassOverlays";

/**
 * Static glass surface with layout and styling properties.
 */
export function StaticGlass({
  children,
  as = "div",
  className = "",
  innerClassName = "",
  style,
  roundedClass = "rounded-full",
  ref,
  ...domProps
}: Readonly<StaticGlassPropsWithRef>) {
  const isInline = as === "span";
  const ContentTag = isInline ? "span" : "div";
  const Tag = as as ElementType;

  return (
    <Tag
      ref={ref as Ref<HTMLDivElement | HTMLSpanElement>}
      draggable={false}
      style={style}
      className={cn(
        "group relative isolate inline-flex cursor-default items-center justify-center overflow-hidden bg-surface/35 text-text-primary backdrop-blur-sm backdrop-saturate-150 select-none [-webkit-user-drag:none] [user-drag:none] md:backdrop-blur-lg",
        roundedClass,
        className,
      )}
      {...domProps}
    >
      <InnerBorderOverlay
        borderActiveClasses="bg-white/[0.015]"
        roundedClass={roundedClass}
        style={INNER_GLASS_STYLE}
      />
      <ContentTag
        className={cn(
          "relative z-30 size-full",
          isInline && "flex items-center justify-center gap-2 font-semibold",
          innerClassName,
        )}
      >
        {children}
      </ContentTag>
    </Tag>
  );
}

StaticGlass.displayName = "StaticGlass";
