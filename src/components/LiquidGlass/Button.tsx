import { memo } from "react";
import { InteractiveGlass } from "./Glass";
import { type GlassButtonPropsWithRef } from "./internal/types";

/**
 * Tactile glass button and anchor primitive with physical spring feedback.
 */
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
