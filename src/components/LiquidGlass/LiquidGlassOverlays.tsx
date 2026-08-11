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
        "pointer-events-none absolute inset-0 z-0 border transition-[border-color,background-color,box-shadow] duration-300 ease-out",
        borderActiveClasses,
        roundedClass,
      )}
      style={style}
    />
  );
}

export function SpecularGlowOverlay({
  roundedClass,
  springX,
  springY,
  lagX,
  lagY,
  springOpacity,
}: Readonly<{
  roundedClass: string;
  springX: MotionValue<number>;
  springY: MotionValue<number>;
  lagX: MotionValue<number>;
  lagY: MotionValue<number>;
  springOpacity: MotionValue<number>;
}>) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        roundedClass,
      )}
    >
      <motion.span
        className="pointer-events-none absolute -mt-24 -ml-24 size-48 rounded-full bg-gradient-to-r from-[#7A7BBF]/6 to-[#6667AB]/6 mix-blend-screen blur-2xl"
        style={{
          x: springX,
          y: springY,
          opacity: springOpacity,
          left: "50%",
          top: "50%",
        }}
      />
      <motion.span
        className="pointer-events-none absolute -mt-16 -ml-16 size-32 rounded-full bg-gradient-to-r from-[#F26B5B]/3 to-[#926AA6]/3 mix-blend-screen blur-xl"
        style={{
          x: lagX,
          y: lagY,
          opacity: springOpacity,
          left: "50%",
          top: "50%",
        }}
      />
    </span>
  );
}
