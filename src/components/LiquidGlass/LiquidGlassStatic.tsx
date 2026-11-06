import { useMemo, type CSSProperties, type Ref, type ElementType } from "react";
import { type StaticGlassPropsWithRef } from "./types";
import { resolveGlassSurfaceProps, useKeyboardClick } from "./liquidGlassUtils";
import { InnerBorderOverlay } from "./LiquidGlassOverlays";

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
  const handleKeyDown = useKeyboardClick(onClick);

  const tagStyle = useMemo<CSSProperties>(() => {
    return {
      WebkitBackfaceVisibility: "hidden",
      backfaceVisibility: "hidden",
      ...style,
    };
  }, [style]);

  const {
    isInline,
    tagProps,
    contentClasses,
    borderActiveClasses,
    innerGlassStyle,
  } = resolveGlassSurfaceProps({
    as,
    href,
    download,
    target,
    rel,
    ariaLabel,
    onClick,
    onKeyDown: handleKeyDown,
    className,
    innerClassName,
    roundedClass,
    variant,
    active,
    tagStyle,
    domProps,
  });

  const resolvedAs = href ? "a" : as;
  const ContentTag = isInline ? "span" : "div";
  const Tag = resolvedAs as ElementType;

  return (
    <Tag ref={ref as Ref<HTMLDivElement>} {...tagProps}>
      <InnerBorderOverlay
        borderActiveClasses={borderActiveClasses}
        roundedClass={roundedClass}
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
