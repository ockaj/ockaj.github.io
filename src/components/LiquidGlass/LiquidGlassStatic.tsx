import { useMemo, type CSSProperties, type Ref, type ElementType } from "react";
import { type StaticGlassPropsWithRef, WHITESPACE_REGEX } from "./types";
import { getInnerGlassStyle } from "./config";
import { cn } from "../../utils/cn";

/**
 * Static glass surface with layout and styling properties.
 */
export function StaticGlass({
  children,
  as = "div",
  href,
  download,
  target,
  rel,
  ariaLabel,
  onClick,
  className = "",
  innerClassName = "",
  style,
  roundedClass = "rounded-full",
  variant = "flat",
  active = false,
  ref,
  ...domProps
}: Readonly<StaticGlassPropsWithRef>) {
  const borderActiveClasses = active
    ? "bg-white/[0.04]"
    : "bg-white/[0.015]";

  const baseClasses = `
    relative inline-flex items-center justify-center
    bg-surface/35 backdrop-blur-sm md:backdrop-blur-lg backdrop-saturate-150
    text-text-primary select-none
    overflow-hidden cursor-default ${roundedClass}
  `
    .replace(WHITESPACE_REGEX, " ")
    .trim();

  const innerGlassStyle = useMemo<CSSProperties>(
    () => getInnerGlassStyle(variant, active),
    [variant, active],
  );

  const tagStyle = useMemo<CSSProperties>(() => {
    return {
      WebkitBackfaceVisibility: "hidden",
      backfaceVisibility: "hidden",
      ...style,
    };
  }, [style]);

  const resolvedAs = href ? "a" : as;
  const ContentTag =
    resolvedAs === "a" || resolvedAs === "button" || resolvedAs === "span"
      ? "span"
      : "div";
  const contentClasses = `relative z-30 w-full h-full ${
    resolvedAs === "a" || resolvedAs === "button" || resolvedAs === "span"
      ? "flex items-center justify-center gap-2 font-semibold"
      : ""
  } ${innerClassName}`.trim();

  const Tag = resolvedAs as ElementType;

  return (
    <Tag
      ref={ref as Ref<HTMLDivElement>}
      className={cn(baseClasses, className)}
      style={tagStyle}
      href={href}
      download={download}
      target={target}
      rel={rel}
      onClick={onClick}
      aria-label={ariaLabel}
      {...domProps}
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-0 z-0 transition-surface duration-300 ease-out",
          borderActiveClasses,
          roundedClass,
        )}
        style={innerGlassStyle}
      />
      <ContentTag className={contentClasses}>{children}</ContentTag>
    </Tag>
  );
}

StaticGlass.displayName = "StaticGlass";

/**
 * Default export of the static glass component.
 * @alias
 */
export default StaticGlass;
