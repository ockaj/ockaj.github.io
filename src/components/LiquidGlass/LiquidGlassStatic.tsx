import { useMemo, type CSSProperties, type Ref, type ElementType } from "react";
import { type LiquidGlassPropsWithRef, WHITESPACE_REGEX } from "./types";
import { getInnerGlassStyle } from "./config";
import { cn } from "../../utils/cn";

export default function LiquidGlassStatic({
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
  interactive: _interactive,
  springScale: _springScale,
  magnetic: _magnetic,
  tilt: _tilt,
  magneticStrength: _magneticStrength,
  tiltStrength: _tiltStrength,
  ripple: _ripple,
  specularGlow: _specularGlow,
  ref,
  ...domProps
}: Readonly<LiquidGlassPropsWithRef>) {
  const borderActiveClasses = active
    ? "border-white/[0.15] bg-white/[0.04]"
    : "border-white/[0.04] bg-white/[0.015]";

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
          "pointer-events-none absolute inset-0 z-0 border transition-[border-color,background-color,box-shadow] duration-300 ease-out",
          borderActiveClasses,
          roundedClass,
        )}
        style={innerGlassStyle}
      />
      <ContentTag className={contentClasses}>{children}</ContentTag>
    </Tag>
  );
}

LiquidGlassStatic.displayName = "LiquidGlassStatic";
