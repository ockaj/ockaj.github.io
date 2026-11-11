import { type CSSProperties, type ElementType, type Ref } from "react";
import { cn } from "../../utils/cn";
import { INNER_GLASS_STYLE } from "./config";
import { type StaticGlassPropsWithRef } from "./types";
import { InnerBorderOverlay } from "./LiquidGlassOverlays";

const STATIC_BACKFACE_STYLE: CSSProperties = {
  WebkitBackfaceVisibility: "hidden",
  backfaceVisibility: "hidden",
};

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
  const tagStyle = style
    ? { ...STATIC_BACKFACE_STYLE, ...style }
    : STATIC_BACKFACE_STYLE;

  return (
    <Tag
      ref={ref as Ref<HTMLDivElement>}
      draggable={false}
      style={tagStyle}
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
