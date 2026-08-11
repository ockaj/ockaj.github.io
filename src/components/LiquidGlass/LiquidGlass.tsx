"use client";

import { memo, type Ref } from "react";
import { useIsMobile } from "../../hooks/useMediaQuery";
import LiquidGlassStatic from "./LiquidGlassStatic";
import LiquidGlassMobile from "./LiquidGlassMobile";
import LiquidGlassDesktop from "./LiquidGlassDesktop";
import { type LiquidGlassProps, type LiquidGlassButtonProps } from "./types";

interface LiquidGlassButtonPropsWithRef extends LiquidGlassButtonProps {
  ref?: Ref<HTMLElement | null>;
}

const LiquidGlass = memo(function LiquidGlass({
  ref,
  ...props
}: LiquidGlassProps & { ref?: Ref<HTMLElement | null> }) {
  const isMobile = useIsMobile();
  const isInteractive = props.interactive ?? true;

  if (!isInteractive) {
    return <LiquidGlassStatic ref={ref} {...props} />;
  }

  if (isMobile) {
    return <LiquidGlassMobile ref={ref} {...props} />;
  }
  return <LiquidGlassDesktop ref={ref} {...props} />;
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
}: Readonly<LiquidGlassButtonPropsWithRef>) {
  return (
    <LiquidGlass
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
    </LiquidGlass>
  );
}

LiquidGlassButtonComponent.displayName = "LiquidGlassButtonComponent";

const LiquidGlassButton = memo(LiquidGlassButtonComponent);
LiquidGlassButton.displayName = "LiquidGlassButton";

export { LiquidGlass, LiquidGlassButton };
