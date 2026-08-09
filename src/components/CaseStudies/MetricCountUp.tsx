import { memo, useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import NumberFlow from "@number-flow/react";

interface MetricCountUpProps {
  value: string;
}

const NUMERIC_REGEX = /[-+]?\d*\.?\d+/;

const MetricCountUp = memo(function MetricCountUp({
  value,
}: MetricCountUpProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(containerRef, {
    once: true,
    margin: "0px 0px -40px 0px",
  });
  const prefersReducedMotion = useReducedMotion();
  const numericPart = NUMERIC_REGEX.exec(value);
  const target = numericPart ? parseFloat(numericPart[0]) : 0;

  const [currentValue, setCurrentValue] = useState(
    prefersReducedMotion ? target : 0,
  );

  useEffect(() => {
    if (!numericPart || prefersReducedMotion) return;
    if (isInView) {
      setCurrentValue(target);
    }
  }, [isInView, target, numericPart, prefersReducedMotion]);

  if (!numericPart) {
    return <span ref={containerRef}>{value}</span>;
  }

  const startIndex = value.indexOf(numericPart[0]);
  const prefix = value.substring(0, startIndex);
  const suffix = value.substring(startIndex + numericPart[0].length);

  return (
    <span ref={containerRef} className="inline-block">
      <NumberFlow
        value={currentValue}
        prefix={prefix}
        suffix={suffix}
        format={{
          minimumFractionDigits: target % 1 === 0 ? 0 : 1,
          maximumFractionDigits: 1,
        }}
        transformTiming={{
          duration: prefersReducedMotion ? 0 : 800,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
    </span>
  );
});

export default MetricCountUp;
