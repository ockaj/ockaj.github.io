import {
  useCallback,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type MouseEventHandler,
  type ReactNode,
  type ElementType,
} from "react";
import { clamp, motion, type MotionStyle } from "motion/react";
import { mergeProps } from "@base-ui/react/merge-props";
import { cn } from "../../utils/cn";
import { SPRING } from "../../utils/springConfig";
import { INNER_GLASS_STYLE } from "./config";
import {
  DEFAULT_STYLE,
  type LiquidGlassTagProps,
  type LiquidGlassAnimationProps,
  type LiquidGlassDomProps,
} from "./types";

export const CAPSULE_HIGHLIGHT_RADIUS =
  "calc((var(--base-radius) * var(--scale-y)) / var(--scale-x)) / var(--base-radius)";

export const TAP_PRESS_TRANSITION = {
  scaleX: SPRING.glassTouchPress,
  scaleY: SPRING.glassTouchPress,
} as const;

export const TAP_RELEASE_TRANSITION = {
  scaleX: SPRING.glassTouchRelease,
  scaleY: SPRING.glassTouchRelease,
} as const;

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

const SEMANTIC_CONTAINERS = new Set(["article"]);

export const TAG_MAP: { readonly [tag: string]: ElementType | undefined } = {
  a: motion.a,
  button: motion.button,
  div: motion.div,
  span: motion.span,
  article: motion.article,
};

type GlassTagElement = (props: LiquidGlassTagProps) => ReactNode;

function preventDefaultOnDragStart(e: DragEvent<HTMLElement>): void {
  (e as { preventDefault?: () => void }).preventDefault?.();
}

type GlassTagType = "div" | "button" | "a" | "article" | "span";

interface GlassSurfaceOptions {
  as?: GlassTagType;
  href?: string;
  download?: string;
  target?: string;
  rel?: string;
  ariaLabel?: string;
  onClick?: unknown;
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void;
  className?: string;
  innerClassName?: string;
  roundedClass?: string;
  isHovered?: boolean;
  tagStyle?: CSSProperties | MotionStyle;
  animationProps?: LiquidGlassAnimationProps;
  domProps?: LiquidGlassDomProps;
}

interface ResolvedGlassSurface {
  isInline: boolean;
  tagProps: LiquidGlassTagProps;
  contentClasses: string;
  borderActiveClasses: string;
  innerGlassStyle: CSSProperties;
}

function resolveBorderActiveClass(isHovered: boolean): string {
  return isHovered ? "bg-white/[0.03]" : "bg-white/[0.015]";
}

function applyInteractiveElementProps(
  tagProps: LiquidGlassTagProps,
  as: GlassTagType,
  href: string | undefined,
  download: string | undefined,
  target: string | undefined,
  rel: string | undefined,
  onClick: unknown,
  onKeyDown: ((e: KeyboardEvent<HTMLElement>) => void) | undefined,
  domProps: LiquidGlassDomProps | undefined,
): void {
  if (href) {
    tagProps.href = href;
    tagProps.download = download;
    tagProps.target = target;
    tagProps.rel = rel;
    tagProps.onClick = onClick as MouseEventHandler<HTMLAnchorElement>;
    return;
  }

  if (as === "button") {
    tagProps.type = "button";
    tagProps.onClick = onClick as MouseEventHandler<HTMLButtonElement>;
    return;
  }

  if (!onClick) return;

  tagProps.onClick = onClick as MouseEventHandler<HTMLElement>;
  if (as !== "a" && !SEMANTIC_CONTAINERS.has(as)) {
    tagProps.role = domProps?.role ?? "button";
    tagProps.tabIndex = domProps?.tabIndex ?? 0;
    tagProps.onKeyDown = onKeyDown;
  }
}

export function resolveGlassSurfaceProps({
  as = "div",
  href,
  download,
  target,
  rel,
  ariaLabel,
  onClick,
  onKeyDown,
  className = "",
  innerClassName = "",
  roundedClass = "rounded-full",
  isHovered = false,
  tagStyle = DEFAULT_STYLE,
  animationProps,
  domProps,
}: GlassSurfaceOptions): ResolvedGlassSurface {
  const borderActiveClasses = resolveBorderActiveClass(isHovered);
  const isInteractive = Boolean(as === "button" || href || onClick);
  const cursorAndFocusClasses = isInteractive
    ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    : "cursor-default";

  const baseClasses = cn(
    "group relative isolate inline-flex items-center justify-center bg-surface/35 backdrop-blur-sm md:backdrop-blur-lg backdrop-saturate-150 text-text-primary select-none overflow-hidden [user-drag:none] [-webkit-user-drag:none]",
    cursorAndFocusClasses,
    roundedClass,
    className,
  );

  const resolvedAs: GlassTagType = href ? "a" : as;
  const isInline =
    resolvedAs === "a" || resolvedAs === "button" || resolvedAs === "span";
  const contentClasses = cn(
    "relative z-30 size-full",
    isInline && "flex items-center justify-center gap-2 font-semibold",
    innerClassName,
  );

  const baseSurfaceProps: LiquidGlassTagProps = {
    className: baseClasses,
    style: tagStyle,
    "aria-label": ariaLabel,
    draggable: false,
  };

  const tagProps = mergeProps<GlassTagElement>(
    baseSurfaceProps,
    animationProps as LiquidGlassTagProps | undefined,
    domProps as LiquidGlassTagProps | undefined,
    { onDragStart: preventDefaultOnDragStart },
  ) as LiquidGlassTagProps;

  applyInteractiveElementProps(
    tagProps,
    as,
    href,
    download,
    target,
    rel,
    onClick,
    onKeyDown,
    domProps,
  );

  return {
    isInline,
    tagProps,
    contentClasses,
    borderActiveClasses,
    innerGlassStyle: INNER_GLASS_STYLE,
  };
}

export function getEntryDimensions(entry: ResizeObserverEntry): {
  width: number;
  height: number;
} {
  let width = 0;
  let height = 0;

  if (entry.borderBoxSize) {
    const borderBox = Array.isArray(entry.borderBoxSize)
      ? entry.borderBoxSize[0]
      : entry.borderBoxSize;
    if (borderBox && borderBox.inlineSize > 0 && borderBox.blockSize > 0) {
      width = borderBox.inlineSize;
      height = borderBox.blockSize;
    }
  }

  if (width === 0 || height === 0) {
    width = entry.contentRect?.width ?? 0;
    height = entry.contentRect?.height ?? 0;
  }

  return { width, height };
}

export function computeGlisseBaseScale(
  width: number,
  height: number,
  grow: number,
): number {
  const safeHeight =
    Number.isFinite(height) && height > 0 ? Math.max(height, 20) : 20;
  const safeWidth = Number.isFinite(width) && width > 0 ? width : safeHeight;
  const safeGrow = Number.isFinite(grow) ? grow : 0;
  return 1 + safeGrow / Math.max(safeWidth, safeHeight);
}

export function computeReactiveSheenBoxShadow(
  x: number,
  y: number,
  holding: number,
  width: number,
  height: number,
): string {
  const h = clamp(0, 1, holding);
  const halfW = Math.max(width / 2, 1);
  const halfH = Math.max(height / 2, 1);

  // Stock hover (h=0): full edge travel [-1, 1] and 1.2px multiplier.
  // Hold / drag (h=1): contracted clamp [-0.65, 0.65] and 0.75px multiplier to avoid rim mask blowout.
  const maxNorm = 1 - 0.35 * h;
  const normX = clamp(-maxNorm, maxNorm, x / halfW);
  const normY = clamp(-maxNorm, maxNorm, y / halfH);
  const mult = 1.2 - 0.45 * h;
  const ix = (-normX * mult).toFixed(2);
  const iy = (-normY * mult).toFixed(2);

  return `inset ${ix}px ${iy}px 2px oklch(100% 0 0 / 0.18), inset ${ix}px ${iy}px 6px oklch(100% 0 0 / 0.08)`;
}

const NAVBAR_HIGHLIGHT_REGEX = /navbar-highlight-(?:active|flat)/g;

export function resolveContextHighlightClass(
  contextHighlightClass: string | undefined,
  isNavbarActive: boolean,
): string {
  if (!contextHighlightClass) return "";
  if (contextHighlightClass.includes("navbar-highlight-")) {
    return contextHighlightClass.replace(
      NAVBAR_HIGHLIGHT_REGEX,
      isNavbarActive ? "navbar-highlight-active" : "navbar-highlight-flat",
    );
  }
  return contextHighlightClass;
}
