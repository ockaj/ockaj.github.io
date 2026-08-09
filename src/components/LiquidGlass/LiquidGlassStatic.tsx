import { useMemo, type CSSProperties, type Ref, type ElementType } from "react";
import { type LiquidGlassPropsWithRef, WHITESPACE_REGEX } from "./types";
import { getInnerGlassStyle } from "./config";
import { cn } from "../../utils/cn";

const CUSTOM_PROPS = [
  "interactive",
  "springScale",
  "magnetic",
  "tilt",
  "magneticStrength",
  "tiltStrength",
  "ripple",
  "specularGlow",
] as const;

function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
}

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
  ref,
  ...rest
}: Readonly<LiquidGlassPropsWithRef>) {
  const borderActiveClasses = active
    ? "border-white/[0.15] bg-white/[0.04]"
    : "border-white/[0.04] bg-white/[0.015]";

  const domProps = useMemo(() => omit(rest, CUSTOM_PROPS), [rest]);

  const baseClasses = `
    relative inline-flex items-center justify-center
    backdrop-blur-sm md:backdrop-blur-lg
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
