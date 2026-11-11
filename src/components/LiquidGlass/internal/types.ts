import {
  type CSSProperties,
  type ReactNode,
  type MouseEvent,
  type Ref,
  type AllHTMLAttributes,
} from "react";
import { type MotionStyle } from "motion/react";

export const DEFAULT_STYLE: CSSProperties = {};

type NonInteractiveHtmlProps =
  | "as"
  | "onClick"
  | "href"
  | "download"
  | "target"
  | "rel"
  | "type"
  | "disabled";

/**
 * Pure layout and glass styling properties.
 * Does not include physics or motion properties.
 */
interface StaticGlassProps extends Omit<
  AllHTMLAttributes<HTMLElement>,
  NonInteractiveHtmlProps
> {
  children?: ReactNode;
  as?: "div" | "span";
  className?: string;
  innerClassName?: string;
  style?: CSSProperties;
  roundedClass?: string;
}

/**
 * Interactive glass properties with physics and motion settings.
 */
interface InteractiveGlassProps extends Omit<StaticGlassProps, "as"> {
  as?: "div" | "button" | "a" | "article" | "span";
  href?: string;
  download?: string;
  target?: string;
  rel?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  ariaLabel?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  springScale?: boolean;
  magnetic?: boolean;
  tilt?: boolean;
  magneticStrength?: number;
}

/**
 * Specialized interactive button and anchor properties.
 */
type GlassButtonProps = Omit<InteractiveGlassProps, "as">;

export interface StaticGlassPropsWithRef extends StaticGlassProps {
  ref?: Ref<HTMLElement | null>;
}

export interface InteractiveGlassPropsWithRef extends InteractiveGlassProps {
  ref?: Ref<HTMLElement | null>;
}

export interface GlassButtonPropsWithRef extends GlassButtonProps {
  ref?: Ref<HTMLElement | null>;
}

export interface LiquidGlassAnimationProps {
  whileTap?: unknown;
  transition?: unknown;
  onTapStart?: () => void;
  onTap?: () => void;
  onTapCancel?: () => void;
  onMouseEnter?: (e: MouseEvent<HTMLElement>) => void;
  onMouseMove?: (e: MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (e: MouseEvent<HTMLElement>) => void;
  onPointerDown?: (e: React.PointerEvent<HTMLElement>) => void;
}

export type LiquidGlassDomProps = Partial<
  Omit<AllHTMLAttributes<HTMLElement>, "style" | "onClick" | "onKeyDown">
>;

export interface LiquidGlassTagProps extends Omit<
  AllHTMLAttributes<HTMLElement>,
  "style"
> {
  href?: string;
  download?: string;
  target?: string;
  rel?: string;
  type?: string;
  tabIndex?: number;
  role?: string;
  style?: MotionStyle | CSSProperties;
  whileTap?: unknown;
  transition?: unknown;
  onTapStart?: () => void;
  onTap?: () => void;
  onTapCancel?: () => void;
}

export type TabOrientation = "horizontal" | "vertical";

export type TabVariant = "capsule" | "segmented";
