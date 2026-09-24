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
        "pointer-events-none absolute inset-0 z-0 border transition-surface duration-300 ease-out",
        borderActiveClasses,
        roundedClass,
      )}
      style={style}
    />
  );
}

export function DesktopEffectsOverlay({
  roundedClass,
  sheenSize,
  springX,
  springY,
  isHovered,
}: Readonly<{
  roundedClass: string;
  sheenSize: number;
  springX: MotionValue<number>;
  springY: MotionValue<number>;
  isHovered: boolean;
}>) {
  const halfSheen = Math.round(sheenSize / 2);

  return (
    <span
      className={cn(
        "liquid-glass-rim pointer-events-none absolute inset-0 z-10 overflow-hidden transition-opacity duration-300",
        roundedClass,
        isHovered ? "opacity-100" : "opacity-0",
      )}
    >
      {/* Primary Specular Glint */}
      <motion.span
        className="liquid-glass-sheen pointer-events-none absolute rounded-full"
        style={{
          width: sheenSize,
          height: sheenSize,
          marginTop: -halfSheen,
          marginLeft: -halfSheen,
          x: springX,
          y: springY,
          left: "50%",
          top: "50%",
        }}
      />
    </span>
  );
}
