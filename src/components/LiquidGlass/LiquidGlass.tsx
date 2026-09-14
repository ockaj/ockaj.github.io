"use client";

import { memo } from "react";
import { useIsMobile } from "../../hooks/useMediaQuery";
import LiquidGlassMobile from "./LiquidGlassMobile";
import LiquidGlassDesktop from "./LiquidGlassDesktop";
import {
  type InteractiveGlassPropsWithRef,
  type GlassButtonPropsWithRef,
} from "./types";

/**
 * Dynamic glass surface with desktop physics and mobile touch support.
 */
export const InteractiveGlass = memo(function InteractiveGlass({
  ref,
  ...props
}: Readonly<InteractiveGlassPropsWithRef>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <LiquidGlassMobile ref={ref} {...props} />;
  }
  return <LiquidGlassDesktop ref={ref} {...props} />;
});

InteractiveGlass.displayName = "InteractiveGlass";

function LiquidGlassButtonComponent({
  children,
  onClick,
  className = "",
  href,
  download,
  target,
  rel,
  ariaLabel,
  magnetic,
  tilt,
  magneticStrength,
  tiltStrength,
  ref,
  ...rest
}: Readonly<GlassButtonPropsWithRef>) {
  return (
    <InteractiveGlass
      ref={ref}
      as={href ? "a" : "button"}
      href={href}
      download={download}
      target={target}
      rel={rel}
      onClick={onClick}
      className={className}
      ariaLabel={ariaLabel}
      springScale
      magnetic={magnetic}
      tilt={tilt}
      magneticStrength={magneticStrength}
      tiltStrength={tiltStrength}
      {...rest}
    >
      {children}
    </InteractiveGlass>
  );
}

LiquidGlassButtonComponent.displayName = "LiquidGlassButtonComponent";

export const LiquidGlassButton = memo(LiquidGlassButtonComponent);
LiquidGlassButton.displayName = "LiquidGlassButton";

export { StaticGlass } from "./LiquidGlassStatic";
