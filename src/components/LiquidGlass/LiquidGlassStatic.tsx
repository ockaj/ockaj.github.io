import { useMemo, type CSSProperties, type Ref, type ElementType } from "react";
import { type LiquidGlassPropsWithRef, WHITESPACE_REGEX } from "./types";

export default function LiquidGlassStatic({
  children,
  as = "div",
  className = "",
  innerClassName = "",
  style,
  roundedClass = "rounded-full",
  variant = "flat",
  active = false,
  ref,
  ...rest
}: LiquidGlassPropsWithRef) {
  const borderActiveClasses = active
    ? "border-white/[0.15] bg-white/[0.04]"
    : "border-white/[0.04] bg-white/[0.015]";

  const baseClasses = `
    relative inline-flex items-center justify-center
    backdrop-blur-lg
    text-text-primary select-none
    overflow-hidden cursor-default ${roundedClass}
  `
    .replace(WHITESPACE_REGEX, " ")
    .trim();

  const innerGlassStyle = useMemo<CSSProperties>(() => {
    if (variant === "sunken") {
      return {
        boxShadow: active
          ? "inset 0 3px 8px rgba(0, 0, 0, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.12), 0 4px 12px rgba(0, 0, 0, 0.2)"
          : "inset 0 2px 5px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 1px 2px rgba(255, 255, 255, 0.02)",
      };
    }
    if (variant === "beveled") {
      return {
        boxShadow: active
          ? "inset 0 1px 2px rgba(255, 255, 255, 0.4), inset 0 6px 12px rgba(255, 255, 255, 0.06), 0 8px 16px rgba(0, 0, 0, 0.15)"
          : "inset 0 1px 1px rgba(255, 255, 255, 0.25), inset 0 4px 8px rgba(255, 255, 255, 0.03), 0 4px 10px rgba(0, 0, 0, 0.08)",
      };
    }
    return {
      boxShadow:
        "inset 0 1px 1px rgba(255, 255, 255, 0.25), inset 0 4px 8px rgba(255, 255, 255, 0.03), 0 4px 10px rgba(0, 0, 0, 0.08)",
    };
  }, [variant, active]);

  const tagStyle = useMemo<CSSProperties>(() => {
    return {
      WebkitBackfaceVisibility: "hidden",
      backfaceVisibility: "hidden",
      ...style,
    };
  }, [style]);

  const ContentTag =
    as === "a" || as === "button" || as === "span" ? "span" : "div";
  const contentClasses = `relative z-30 w-full h-full ${
    as === "a" || as === "button" || as === "span"
      ? "flex items-center justify-center gap-2 font-semibold"
      : ""
  } ${innerClassName}`.trim();

  const Tag = as as ElementType;

  return (
    <Tag
      ref={ref as Ref<HTMLDivElement>}
      className={`${baseClasses} ${className}`}
      style={tagStyle}
      {...rest}
    >
      <span
        className={`absolute inset-0 pointer-events-none z-0 border ${borderActiveClasses} ${roundedClass} transition-[border-color,background-color,box-shadow] duration-300 ease-out`}
        style={innerGlassStyle}
      />
      <ContentTag className={contentClasses}>{children}</ContentTag>
    </Tag>
  );
}

LiquidGlassStatic.displayName = "LiquidGlassStatic";
