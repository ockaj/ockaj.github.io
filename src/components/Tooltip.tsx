import { ReactNode } from "react";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "../utils/cn";
import { SPRING } from "../utils/springConfig";

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export default function Tooltip({ content, children }: Readonly<TooltipProps>) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <BaseTooltip.Provider delay={120}>
      <BaseTooltip.Root>
        <BaseTooltip.Trigger
          render={
            <button
              type="button"
              className="m-0 inline-flex cursor-help border-0 bg-transparent p-0 text-left focus-visible:outline-none"
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
                    "bg-surface/95 text-text-primary pointer-events-none z-[9999] max-w-xs rounded-xl border border-white/15 px-3.5 py-2 text-center text-xs leading-relaxed font-normal tracking-normal shadow-2xl",
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
