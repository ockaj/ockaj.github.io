import { memo, useCallback, useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import { LiquidGlass, LiquidGlassButton } from "../LiquidGlass/LiquidGlass";
import { useAppStore } from "../../store/useAppStore";
import { cn } from "../../utils/cn";
import { SPRING } from "../../utils/springConfig";
import type { FaqItem as FaqItemType } from "../../data/faqData";

interface FaqItemProps {
  item: FaqItemType;
  isOpen: boolean;
  onToggle: (id: string) => void;
}

export const FaqItem = memo(function FaqItem({
  item,
  isOpen,
  onToggle,
}: FaqItemProps) {
  const contentId = useId();
  const prefersReducedMotion = useReducedMotion();
  const isReduced = !!prefersReducedMotion;

  const handleAction = useCallback(
    (action?: string) => {
      if (!action) return;
      if (action === "cv") {
        useAppStore.getState().setCvOpen(true);
      } else if (
        action === "work" ||
        action === "processes" ||
        action === "contact"
      ) {
        const target = document.getElementById(action);
        if (target) {
          target.scrollIntoView({ behavior: isReduced ? "auto" : "smooth" });
          window.history.pushState(window.history.state, "", `#${action}`);
        }
      }
    },
    [isReduced],
  );

  return (
    <LiquidGlass
      as="div"
      roundedClass="rounded-2xl"
      className="w-full text-left"
      tilt
    >
      <div className="p-6 md:p-7">
        <button
          type="button"
          onClick={() => onToggle(item.id)}
          aria-expanded={isOpen}
          aria-controls={contentId}
          className="focus-visible:ring-accent/60 flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg text-left select-none focus-visible:ring-2 focus-visible:outline-none"
        >
          <div className="flex flex-col">
            <h3 className="font-display text-text-primary text-base font-semibold text-balance transition-colors duration-200 md:text-lg">
              {item.question}
            </h3>
          </div>

          <LiquidGlass
            as="span"
            roundedClass="rounded-full"
            className="text-text-primary flex size-[44px] min-h-[44px] min-w-[44px] flex-shrink-0 cursor-pointer items-center justify-center p-0 shadow-sm transition-colors"
            magnetic
            tilt
            magneticStrength={0.03}
            specularGlow
          >
            <motion.span
              initial={false}
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={isReduced ? { duration: 0.1 } : SPRING.snappy}
              className="text-text-primary flex items-center justify-center transition-colors duration-200"
            >
              <ChevronDown size={18} aria-hidden="true" />
            </motion.span>
          </LiquidGlass>
        </button>

        <div
          id={contentId}
          role="region"
          className={cn(
            "grid transition-[grid-template-rows] duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]",
            isOpen ? "grid-rows-[1fr]" : "pointer-events-none grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <div
              className={cn(
                "mt-4 border-t border-white/[0.06] pt-4 transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]",
                isOpen ? "translate-y-0" : "-translate-y-2",
              )}
            >
              <p className="text-muted text-sm leading-relaxed text-pretty whitespace-pre-line md:text-base">
                {item.answer}
              </p>

              {item.actionLink ? (
                <div className="mt-5 flex items-center p-1.5">
                  <LiquidGlassButton
                    type="button"
                    onClick={() => handleAction(item.actionLink?.action)}
                    roundedClass="rounded-full"
                    className="group/action-btn text-text-primary flex min-h-[44px] cursor-pointer items-center justify-center px-6 py-2.5 text-xs font-semibold shadow-sm transition-colors md:text-sm"
                    ariaLabel={item.actionLink.label}
                    magnetic
                    tilt
                    magneticStrength={0.03}
                    specularGlow
                  >
                    <span className="flex items-center gap-2">
                      <span>{item.actionLink.label}</span>
                      <ArrowUpRight
                        size={16}
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover/action-btn:translate-x-0.5 group-hover/action-btn:-translate-y-0.5"
                      />
                    </span>
                  </LiquidGlassButton>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </LiquidGlass>
  );
});
