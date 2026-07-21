import { memo, useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import NumberFlow from "@number-flow/react";

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

  const [currentValue, setCurrentValue] = useState(
    prefersReducedMotion ? target : 0,
  );

  useEffect(() => {
    if (!numericPart || prefersReducedMotion) return;
    const timer = setTimeout(() => {
      setCurrentValue(target);
    }, 300);
    return () => clearTimeout(timer);
  }, [target, numericPart, prefersReducedMotion]);

  if (!numericPart) {
    return <span>{value}</span>;
  }

  const startIndex = value.indexOf(numericPart[0]);
  const prefix = value.substring(0, startIndex);
  const suffix = value.substring(startIndex + numericPart[0].length);

  return (
    <NumberFlow
      value={currentValue}
      prefix={prefix}
      suffix={suffix}
      format={{
        minimumFractionDigits: target % 1 === 0 ? 0 : 1,
        maximumFractionDigits: 1,
      }}
      transformTiming={{
        duration: prefersReducedMotion ? 0 : 600,
        easing: "cubic-bezier(0.25, 0.1, 0.25, 1)",
      }}
    />
  );
});

export default MetricCountUp;
