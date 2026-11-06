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
import { SPRING } from "../../utils/springConfig";
import { getInnerGlassStyle, type LiquidGlassVariant } from "./config";
import {
  type LiquidGlassTagProps,
  type LiquidGlassAnimationProps,
  type LiquidGlassDomProps,
} from "./types";

export const TAP_PRESS_TRANSITION = {
  scaleX: SPRING.glassTouchPress,
  scaleY: SPRING.glassTouchPress,
} as const;

export const TAP_RELEASE_TRANSITION = {
  scaleX: SPRING.glassTouchRelease,
  scaleY: SPRING.glassTouchRelease,
} as const;

export function assignRef<T>(ref: Ref<T> | undefined, node: T | null): void {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(node);
  } else if ("current" in ref) {
    (ref as { current: T | null }).current = node;
  }
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

const SEMANTIC_CONTAINERS = new Set([
  "article",
  "section",
  "nav",
  "aside",
  "header",
  "footer",
  "main",
]);

export const TAG_MAP: { readonly [tag: string]: ElementType | undefined } = {
  a: motion.a,
  button: motion.button,
  div: motion.div,
  span: motion.span,
  article: motion.article,
  section: motion.section,
};

function attachComposedEventHandlers(
  tagProps: LiquidGlassTagProps,
  sharedAnimationProps?: LiquidGlassAnimationProps,
  domProps?: LiquidGlassDomProps,
): void {
  if (sharedAnimationProps?.onPointerDown) {
    const internalPointerDown = sharedAnimationProps.onPointerDown;
    const domPointerDown = domProps?.onPointerDown;
    tagProps.onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
      internalPointerDown(e);
      domPointerDown?.(e);
    };
  }

  if (sharedAnimationProps?.onMouseEnter) {
    const internalMouseEnter = sharedAnimationProps.onMouseEnter;
    const domMouseEnter = domProps?.onMouseEnter;
    tagProps.onMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
      internalMouseEnter(e);
      domMouseEnter?.(e);
    };
  }

  if (sharedAnimationProps?.onMouseMove) {
    const internalMouseMove = sharedAnimationProps.onMouseMove;
    const domMouseMove = domProps?.onMouseMove;
    tagProps.onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
      internalMouseMove(e);
      domMouseMove?.(e);
    };
  }

  if (sharedAnimationProps?.onMouseLeave) {
    const internalMouseLeave = sharedAnimationProps.onMouseLeave;
    const domMouseLeave = domProps?.onMouseLeave;
    tagProps.onMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
      internalMouseLeave(e);
      domMouseLeave?.(e);
    };
  }
}

export function computeInnerGlassStyle(
  variant: LiquidGlassVariant = "flat",
  isActive = false,
  specularGlow = false,
): CSSProperties {
  const baseStyle = getInnerGlassStyle(variant, isActive);
  if (specularGlow && isActive && variant === "flat") {
    return {
      boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.24), inset 0 8px 16px rgba(255, 255, 255, 0.06), ${baseStyle.boxShadow ?? ""}`,
    };
  }
  return baseStyle;
}

type GlassTagType = "div" | "button" | "a" | "article" | "section" | "span";

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
  variant?: LiquidGlassVariant;
  active?: boolean;
  isHovered?: boolean;
  specularGlow?: boolean;
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

function resolveBorderActiveClass(active: boolean, isHovered: boolean): string {
  if (active) return "bg-white/[0.05]";
  if (isHovered) return "bg-white/[0.03]";
  return "bg-white/[0.015]";
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
  variant = "flat",
  active = false,
  isHovered = false,
  specularGlow = false,
  tagStyle = {},
  animationProps,
  domProps,
}: GlassSurfaceOptions): ResolvedGlassSurface {
  const borderActiveClasses = resolveBorderActiveClass(active, isHovered);
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

  const tagProps: LiquidGlassTagProps = {
    className: baseClasses,
    style: tagStyle,
    "aria-label": ariaLabel,
    draggable: false,
    ...animationProps,
    ...domProps,
  };

  attachComposedEventHandlers(tagProps, animationProps, domProps);

  tagProps.onDragStart = (e: unknown) => {
    (e as { preventDefault?: () => void }).preventDefault?.();
    domProps?.onDragStart?.(e as React.DragEvent<HTMLElement>);
  };

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

  const innerGlassStyle = computeInnerGlassStyle(variant, active, specularGlow);

  return {
    isInline,
    tagProps,
    contentClasses,
    borderActiveClasses,
    innerGlassStyle,
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
  const h = Math.max(0, Math.min(1, holding));
  const halfW = Math.max(width / 2, 1);
  const halfH = Math.max(height / 2, 1);

  // Stock hover (h=0): full edge travel [-1, 1] and 1.2px multiplier.
  // Hold / drag (h=1): contracted clamp [-0.65, 0.65] and 0.75px multiplier to avoid rim mask blowout.
  const maxNorm = 1 - 0.35 * h;
  const normX = Math.max(-maxNorm, Math.min(maxNorm, x / halfW));
  const normY = Math.max(-maxNorm, Math.min(maxNorm, y / halfH));
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
