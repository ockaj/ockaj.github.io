import { useEffect, useRef } from "react";
import type { FocusEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import {
  InteractiveGlass,
  LiquidGlassButton,
} from "../LiquidGlass/LiquidGlass";
import BpmnNodeBadge from "./BpmnNodeBadge";
import { PauseableTimer } from "./pauseableTimer";
import { SPRING } from "../../utils/springConfig";

export interface BpmnHotkeyToastProps {
  readonly onDismiss: () => void;
  readonly durationMs?: number;
}

const DEFAULT_DURATION_MS = 10000;

export default function BpmnHotkeyToast({
  onDismiss,
  durationMs = DEFAULT_DURATION_MS,
}: Readonly<BpmnHotkeyToastProps>) {
  const prefersReducedMotion = useReducedMotion();
  const onDismissRef = useRef(onDismiss);
  const timerRef = useRef<PauseableTimer | null>(null);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    const timer = new PauseableTimer({
      durationMs,
      onExpire: () => {
        onDismissRef.current();
      },
    });
    timerRef.current = timer;
    timer.start();

    return () => {
      timer.dispose();
      if (timerRef.current === timer) {
        timerRef.current = null;
      }
    };
  }, [durationMs]);

  const handlePointerEnter = () => {
    timerRef.current?.setHovered(true);
  };

  const handlePointerLeave = () => {
    timerRef.current?.setHovered(false);
  };

  const handleFocus = () => {
    timerRef.current?.setFocused(true);
  };

  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      timerRef.current?.setFocused(false);
    }
  };

  const handleToastKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      timerRef.current?.dispose();
      onDismissRef.current();
    }
  };

  const handleDismissClick = () => {
    timerRef.current?.dispose();
    onDismissRef.current();
  };

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      initial={{
        opacity: 0,
        y: prefersReducedMotion ? 0 : 30,
        scale: prefersReducedMotion ? 1 : 0.95,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: prefersReducedMotion ? { duration: 0.15 } : SPRING.modal,
      }}
      exit={{
        opacity: 0,
        y: prefersReducedMotion ? 0 : 20,
        scale: prefersReducedMotion ? 1 : 0.95,
        transition: prefersReducedMotion ? { duration: 0.15 } : SPRING.exit,
      }}
      className="pointer-events-auto fixed right-6 bottom-6 z-40 hidden max-w-sm text-sm md:block"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleToastKeyDown}
    >
      <InteractiveGlass
        as="div"
        roundedClass="rounded-xl"
        className="bg-surface/90 p-3"
        innerClassName="flex items-center gap-3 w-full"
        specularGlow
      >
        <BpmnNodeBadge type="script-task" className="shrink-0" />
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-pretty text-text-primary">
            Process Analyst Easter Egg
          </p>
          <p className="mt-0.5 text-sm leading-normal text-pretty text-muted">
            Type{" "}
            <span className="font-mono font-bold text-accent">B-P-M-N</span> on
            your keyboard to reveal the portfolio's meta-diagram.
          </p>
        </div>
        <LiquidGlassButton
          onClick={handleDismissClick}
          className="flex size-10 items-center justify-center text-muted hover:text-text-primary"
          roundedClass="rounded-full"
          ariaLabel="Dismiss tip"
          magnetic
          magneticStrength={0.03}
        >
          <X size={14} />
        </LiquidGlassButton>
      </InteractiveGlass>
    </motion.div>
  );
}
