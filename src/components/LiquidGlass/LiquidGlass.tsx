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

export const LiquidGlassButton = memo(function LiquidGlassButton({
  href,
  springScale,
  disabled,
  ...props
}: Readonly<GlassButtonPropsWithRef>) {
  return (
    <InteractiveGlass
      as={href ? "a" : "button"}
      href={href}
      disabled={disabled}
      springScale={springScale ?? !disabled}
      {...props}
    />
  );
});
LiquidGlassButton.displayName = "LiquidGlassButton";
