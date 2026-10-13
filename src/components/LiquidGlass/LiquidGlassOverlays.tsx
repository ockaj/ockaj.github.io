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
  sheenRadius,
  sheenX,
  sheenY,
  sheenOpacity,
}: Readonly<{
  roundedClass: string;
  sheenRadius: number;
  sheenX: MotionValue<number>;
  sheenY: MotionValue<number>;
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
          "liquid-glass-sheen pointer-events-none absolute top-0 left-0",
          roundedClass,
        )}
        style={{
          width: sheenRadius * 2,
          height: sheenRadius * 2,
          x: sheenX,
          y: sheenY,
          background:
            "radial-gradient(circle closest-side, var(--color-glass-sheen-core) 0%, var(--color-glass-sheen-mid) 40%, var(--color-glass-sheen-edge) 80%)",
        }}
        aria-hidden="true"
      />
    </motion.span>
  );
}
