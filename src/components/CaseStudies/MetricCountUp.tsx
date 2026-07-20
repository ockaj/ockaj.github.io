import { memo, useEffect } from "react";
import {
  motion,
  animate,
  useMotionValue,
  useTransform,
  useReducedMotion,
} from "motion/react";

interface MetricCountUpProps {
  value: string;
}

const NUMERIC_REGEX = /[-+]?\d*\.?\d+/;

const MetricCountUp = memo(function MetricCountUp({
  value,
}: MetricCountUpProps) {
  const prefersReducedMotion = useReducedMotion();
  const numericPart = value.match(NUMERIC_REGEX);
  const target = numericPart ? parseFloat(numericPart[0]) : 0;
  const isNumeric = !!numericPart;

  const startIndex = numericPart ? value.indexOf(numericPart[0]) : -1;
  const prefix = numericPart ? value.substring(0, startIndex) : "";
  const suffix = numericPart
    ? value.substring(startIndex + numericPart[0].length)
    : "";

  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => {
    const num = target % 1 === 0 ? Math.floor(v) : parseFloat(v.toFixed(1));
    const displayPrefix =
      prefix.startsWith("+") && num === 0 ? prefix.replace("+", "") : prefix;
    return `${displayPrefix}${num}${suffix}`;
  });

  useEffect(() => {
    if (!isNumeric) return;
    const controls = animate(mv, target, {
      duration: prefersReducedMotion ? 0 : 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    });
    return () => controls.stop();
  }, [mv, target, isNumeric, prefersReducedMotion]);

  if (!isNumeric) return <span>{value}</span>;

  return <motion.span>{display}</motion.span>;
});

export default MetricCountUp;
