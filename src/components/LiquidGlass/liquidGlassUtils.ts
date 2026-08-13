import {
  useCallback,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type MouseEventHandler,
  type Ref,
  type ElementType,
} from "react";
import { motion, type MotionStyle } from "motion/react";
import { cn } from "../../utils/cn";
import { springs } from "./config";
import {
  type LiquidGlassProps,
  type LiquidGlassTagProps,
  type LiquidGlassAnimationProps,
  type LiquidGlassDomProps,
} from "./types";

export const SCALE_TRANSITION = {
  scaleX: springs.scale,
  scaleY: springs.scale,
} as const;

export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
};

export function assignRef<T>(ref: Ref<T> | undefined, node: T | null): void {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(node);
  } else if ("current" in ref) {
    (ref as { current: T | null }).current = node;
  }
}

export function getContentTagAndClasses(
  as: LiquidGlassProps["as"],
  innerClassName?: string,
) {
  const isInline = as === "a" || as === "button" || as === "span";
  const contentClasses = cn(
    "relative z-30 w-full h-full",
    isInline && "flex items-center justify-center gap-2 font-semibold",
    innerClassName,
  );
  return { isInline, contentClasses };
}

export function useKeyboardClick(
  onClick?: (e: MouseEvent<HTMLElement>) => void,
) {
  return useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if ((e.key === "Enter" || e.key === " ") && onClick) {
        e.preventDefault();
        const syntheticMouseEvent = Object.create(e);
        syntheticMouseEvent.type = "click";
        syntheticMouseEvent.button = 0;
        syntheticMouseEvent.buttons = 1;
        onClick(syntheticMouseEvent as MouseEvent<HTMLElement>);
      }
    },
    [onClick],
  );
}

export function getGlassClasses({
  active = false,
  as = "div",
  href,
  onClick,
  roundedClass = "rounded-full",
  className = "",
}: {
  active?: boolean;
  as?: string;
  href?: string;
  onClick?: unknown;
  roundedClass?: string;
  className?: string;
}) {
  const borderActiveClasses = active
    ? "border-white/[0.15] bg-white/[0.04]"
    : "border-white/[0.04] group-hover:border-white/[0.08] bg-white/[0.015] group-hover:bg-white/[0.03]";

  const cursorAndFocusClasses =
    as === "button" || href || onClick
      ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      : "cursor-default";

  const baseClasses = cn(
    "group relative inline-flex items-center justify-center bg-surface/35 backdrop-blur-sm md:backdrop-blur-lg backdrop-saturate-150 text-text-primary select-none overflow-hidden",
    cursorAndFocusClasses,
    roundedClass,
    className,
  );

  return { borderActiveClasses, baseClasses };
}

export const TAG_MAP: Record<string, ElementType> = {
  a: motion.a,
  button: motion.button,
  div: motion.div,
  span: motion.span,
  article: motion.article,
  section: motion.section,
};

export function setupTagProps(
  href: string | undefined,
  as: string,
  download: string | undefined,
  target: string | undefined,
  rel: string | undefined,
  onClick: unknown,
  handleKeyDown: (e: KeyboardEvent<HTMLElement>) => void,
  baseClasses: string,
  tagStyle: CSSProperties | MotionStyle,
  ariaLabel?: string,
  sharedAnimationProps?: LiquidGlassAnimationProps,
  domProps?: LiquidGlassDomProps,
): LiquidGlassTagProps {
  const tagProps: LiquidGlassTagProps = {
    className: baseClasses,
    style: tagStyle,
    "aria-label": ariaLabel,
    ...sharedAnimationProps,
    ...domProps,
  };

  if (href) {
    tagProps.href = href;
    tagProps.download = download;
    tagProps.target = target;
    tagProps.rel = rel;
    tagProps.onClick = onClick as MouseEventHandler<HTMLAnchorElement>;
  } else if (as === "button") {
    tagProps.type = "button";
    tagProps.onClick = onClick as MouseEventHandler<HTMLButtonElement>;
  } else if (onClick) {
    tagProps.onClick = onClick as MouseEventHandler<HTMLElement>;
    if (as !== "a" && (as as string) !== "button") {
      tagProps.tabIndex = 0;
      tagProps.onKeyDown = handleKeyDown;
      tagProps.role = "button";
    }
  }

  return tagProps;
}
