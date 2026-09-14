import {
  type CSSProperties,
  type ReactNode,
  type MouseEvent,
  type Ref,
  type AllHTMLAttributes,
} from "react";
import { type MotionStyle } from "motion/react";

export const DEFAULT_STYLE: CSSProperties = {};
export const WHITESPACE_REGEX = /\s+/g;

/**
 * Pure layout and glass styling properties.
 * Does not include physics or motion properties.
 */
export interface StaticGlassProps extends AllHTMLAttributes<HTMLElement> {
  children?: ReactNode;
  as?: "div" | "button" | "a" | "article" | "section" | "span";
  href?: string;
  download?: string;
  target?: string;
  rel?: string;
  ariaLabel?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  className?: string;
  innerClassName?: string;
  style?: CSSProperties;
  roundedClass?: string;
  variant?: "flat" | "sunken" | "beveled";
  active?: boolean;
}

/**
 * Interactive glass properties with physics and motion settings.
 */
export interface InteractiveGlassProps extends StaticGlassProps {
  springScale?: boolean;
  magnetic?: boolean;
  tilt?: boolean;
  magneticStrength?: number;
  tiltStrength?: number;
  ripple?: boolean;
  specularGlow?: boolean;
}

/**
 * Specialized interactive button and anchor properties.
 */
type GlassButtonProps = Omit<InteractiveGlassProps, "as" | "springScale">;

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
  whileHover?: unknown;
  whileTap?: unknown;
  transition?: unknown;
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
  whileHover?: unknown;
  whileTap?: unknown;
  transition?: unknown;
}
