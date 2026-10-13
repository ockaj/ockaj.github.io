import { type CSSProperties } from "react";
import { motion, type MotionValue } from "motion/react";
import { cn } from "../../utils/cn";

export function InnerBorderOverlay({
  borderActiveClasses,
  roundedClass,
  style,
}: Readonly<{
  borderActiveClasses: string;
  roundedClass: string;
  style: CSSProperties;
}>) {
  return (
    <>
      <span
        className={cn(
          "pointer-events-none absolute inset-0 z-0 transition-surface duration-300 ease-out",
          borderActiveClasses,
          roundedClass,
        )}
      />
      <span
        className={cn(
          "liquid-glass-vertical-rim pointer-events-none absolute inset-0 z-0 transition-surface duration-300 ease-out",
          roundedClass,
        )}
        style={style}
      />
    </>
  );
}

export function DesktopEffectsOverlay({
  roundedClass,
  boxShadow,
  opacity,
}: Readonly<{
  roundedClass: string;
  boxShadow: MotionValue<string>;
  opacity: MotionValue<number>;
}>) {
  return (
    <motion.span
      className={cn(
        "liquid-glass-vertical-rim liquid-glass-specular-bevel pointer-events-none absolute inset-0 z-0",
        roundedClass,
      )}
      style={{
        opacity,
        boxShadow,
      }}
      aria-hidden="true"
    />
  );
}
