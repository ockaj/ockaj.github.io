import { ReactNode } from "react";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "../utils/cn";
import { SPRING } from "../utils/springConfig";

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <BaseTooltip.Provider delay={120}>
      <BaseTooltip.Root>
        <BaseTooltip.Trigger
          render={
            <button
              type="button"
              className="inline-flex cursor-help focus-visible:outline-none text-left bg-transparent border-0 p-0 m-0"
              aria-label={content}
            />
          }
        >
          {children}
        </BaseTooltip.Trigger>
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner
            side="top"
            sideOffset={8}
            className="z-[9999]"
          >
            <BaseTooltip.Popup
              render={
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: prefersReducedMotion ? 1 : 0.95,
                    y: prefersReducedMotion ? 0 : 4,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: prefersReducedMotion ? 1 : 0.95,
                    y: prefersReducedMotion ? 0 : 2,
                  }}
                  transition={
                    prefersReducedMotion ? { duration: 0.1 } : SPRING.tooltip
                  }
                  className={cn(
                    "pointer-events-none px-3.5 py-2 rounded-xl border border-white/15 bg-surface/95 shadow-2xl text-[10px] font-normal text-text-primary tracking-normal max-w-xs leading-relaxed text-center z-[9999]",
                  )}
                />
              }
            >
              {content}
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
}
