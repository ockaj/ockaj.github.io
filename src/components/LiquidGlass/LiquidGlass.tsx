"use client";

import { memo } from "react";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { StaticGlass } from "./LiquidGlassStatic";
import LiquidGlassMobile from "./LiquidGlassMobile";
import LiquidGlassDesktop from "./LiquidGlassDesktop";
import {
  type LiquidGlassPropsWithRef,
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

/**
 * Backwards-compatible adaptive facade that delegates to StaticGlass or InteractiveGlass.
 */
export const LiquidGlass = memo(function LiquidGlass({
  ref,
  interactive = true,
  springScale,
  magnetic,
  tilt,
  magneticStrength,
  tiltStrength,
  ripple,
  specularGlow,
  ...staticProps
}: Readonly<LiquidGlassPropsWithRef>) {
  if (!interactive) {
    return <StaticGlass ref={ref} {...staticProps} />;
  }

  return (
    <InteractiveGlass
      ref={ref}
      springScale={springScale}
      magnetic={magnetic}
      tilt={tilt}
      magneticStrength={magneticStrength}
      tiltStrength={tiltStrength}
      ripple={ripple}
      specularGlow={specularGlow}
      {...staticProps}
    />
  );
});

LiquidGlass.displayName = "LiquidGlass";

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
