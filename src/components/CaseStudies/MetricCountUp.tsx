import { memo, useRef } from "react";
import { useInView } from "motion/react";
import NumberFlow from "@number-flow/react";
import { EASE } from "../../utils/springConfig";
import { usePrefersReducedMotion } from "../../hooks/useMediaQuery";

interface MetricCountUpProps {
  value: string;
}

const NUMERIC_REGEX = /[-+]?\d[\d,]*(?:\.\d+)?/;
const EASING_EXPO_OUT = `cubic-bezier(${EASE.out.join(", ")})`;

const MetricCountUp = memo(function MetricCountUp({
  value,
}: MetricCountUpProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(containerRef, {
    once: true,
    margin: "0px 0px -40px 0px",
  });
  const prefersReducedMotion = usePrefersReducedMotion();
  const numericPart = NUMERIC_REGEX.exec(value);
  const cleanedTarget = numericPart ? numericPart[0].replace(/,/g, "") : "";
  const target = cleanedTarget ? parseFloat(cleanedTarget) : 0;

  const displayValue = prefersReducedMotion || isInView ? target : 0;

  if (!numericPart || Number.isNaN(target)) {
    return <span ref={containerRef}>{value}</span>;
  }

  const startIndex = value.indexOf(numericPart[0]);
  const prefix = value.substring(0, startIndex);
  const suffix = value.substring(startIndex + numericPart[0].length);

  return (
    <span ref={containerRef} className="inline-block">
      <NumberFlow
        value={displayValue}
        prefix={prefix}
        suffix={suffix}
        format={{
          minimumFractionDigits: target % 1 === 0 ? 0 : 1,
          maximumFractionDigits: 2,
        }}

        transformTiming={{
          duration: prefersReducedMotion ? 0 : 800,
          easing: EASING_EXPO_OUT,
        }}
      />
    </span>
  );
});

export default MetricCountUp;
