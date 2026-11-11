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
  magnetic,
  tilt,
  magneticStrength,
  ...props
}: Readonly<InteractiveGlassPropsWithRef>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <LiquidGlassMobile ref={ref} {...props} />;
  }
  return (
    <LiquidGlassDesktop
      ref={ref}
      magnetic={magnetic}
      tilt={tilt}
      magneticStrength={magneticStrength}
      {...props}
    />
  );
});

InteractiveGlass.displayName = "InteractiveGlass";

export const LiquidGlassButton = memo(function LiquidGlassButton({
  href,
  springScale,
  disabled,
  onClick,
  role,
  tabIndex,
  "aria-disabled": ariaDisabled,
  ...props
}: Readonly<GlassButtonPropsWithRef>) {
  const isLink = Boolean(href);
  const isDisabledLink = isLink && Boolean(disabled);

  return (
    <InteractiveGlass
      {...props}
      as={isLink ? "a" : "button"}
      href={isDisabledLink ? undefined : href}
      disabled={isLink ? undefined : disabled}
      role={isDisabledLink ? "link" : role}
      aria-disabled={isDisabledLink ? "true" : ariaDisabled}
      tabIndex={isDisabledLink ? -1 : tabIndex}
      onClick={isDisabledLink ? undefined : onClick}
      springScale={springScale ?? !disabled}
    />
  );
});
LiquidGlassButton.displayName = "LiquidGlassButton";
