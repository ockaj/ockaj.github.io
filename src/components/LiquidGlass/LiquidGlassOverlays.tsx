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
    <span
      className={cn(
        "pointer-events-none absolute inset-0 z-0 transition-surface duration-300 ease-out",
        borderActiveClasses,
        roundedClass,
      )}
      style={style}
    />
  );
}

export function DesktopEffectsOverlay({
  roundedClass,
  sheenGradient,
  sheenOpacity,
}: Readonly<{
  roundedClass: string;
  sheenGradient: MotionValue<string>;
  sheenOpacity: MotionValue<number>;
}>) {
  return (
    <motion.span
      className={cn(
        "liquid-glass-rim pointer-events-none absolute inset-0 z-10 overflow-hidden",
        roundedClass,
      )}
      style={{
        opacity: sheenOpacity,
      }}
      aria-hidden="true"
    >
      <motion.span
        className={cn(
          "liquid-glass-sheen pointer-events-none absolute inset-0",
          roundedClass,
        )}
        style={{
          background: sheenGradient,
        }}
        aria-hidden="true"
      />
    </motion.span>
  );
}
