import { memo } from "react";
import { useIsMobile } from "../../hooks/useMediaQuery";
import LiquidGlassMobile from "./internal/LiquidGlassMobile";
import LiquidGlassDesktop from "./internal/LiquidGlassDesktop";
import { type InteractiveGlassPropsWithRef } from "./internal/types";

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
