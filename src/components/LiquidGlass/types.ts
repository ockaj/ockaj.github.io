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

export interface LiquidGlassProps extends AllHTMLAttributes<HTMLElement> {
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
  interactive?: boolean;
  springScale?: boolean;
  roundedClass?: string;
  magnetic?: boolean;
  tilt?: boolean;
  magneticStrength?: number;
  tiltStrength?: number;
  ripple?: boolean;
  variant?: "flat" | "sunken" | "beveled";
  active?: boolean;
  specularGlow?: boolean;
}

export type LiquidGlassButtonProps = Omit<
  LiquidGlassProps,
  "as" | "springScale"
>;

export interface LiquidGlassPropsWithRef extends LiquidGlassProps {
  ref?: Ref<HTMLElement | null>;
}

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
