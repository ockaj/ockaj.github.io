import { memo, useCallback } from "react";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import { Accordion } from "@base-ui/react/accordion";
import {
  InteractiveGlass,
  LiquidGlassButton,
} from "../LiquidGlass/LiquidGlass";
import { useAppStore } from "../../store/useAppStore";
import { navigateTo } from "../../hooks/useAppNavigation";
import { cn } from "../../utils/cn";
import type { FaqItem as FaqItemType } from "../../data/faqData";

interface FaqItemProps {
  item: FaqItemType;
}

export const FaqItem = memo(function FaqItem({ item }: FaqItemProps) {
  const handleAction = useCallback((action?: string) => {
    if (!action) return;
    if (action === "cv") {
      useAppStore.getState().mountCv();
      useAppStore.getState().openModal("cv");
    } else if (
      action === "work" ||
      action === "processes" ||
      action === "contact"
    ) {
      navigateTo(action);
    }
  }, []);

  return (
    <Accordion.Item value={item.id} className="w-full">
      <InteractiveGlass
        as="div"
        roundedClass="rounded-2xl"
        className="w-full text-left"
        tilt={false}
        specularGlow
      >
        <div className="p-6 md:p-7">
          <Accordion.Header className="m-0 p-0 font-normal">
            <Accordion.Trigger className="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg text-left select-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none">
              <div className="flex flex-col">
                <span className="font-display text-lg font-normal text-balance text-text-primary transition-colors duration-200 md:text-xl">
                  {item.question}
                </span>
              </div>

              <InteractiveGlass
                as="span"
                roundedClass="rounded-full"
                className="flex size-11 min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center p-0 text-text-primary shadow-sm transition-colors"
                magnetic
                tilt
                magneticStrength={0.03}
                specularGlow
              >
                <span
                  data-no-skeleton=""
                  className="flex items-center justify-center text-text-primary transition-transform duration-300 ease-out group-data-panel-open:rotate-180 motion-reduce:transition-none"
                >
                  <ChevronDown size={18} aria-hidden="true" />
                </span>
              </InteractiveGlass>
            </Accordion.Trigger>
          </Accordion.Header>

          <Accordion.Panel
            keepMounted
            hiddenUntilFound
            data-no-skeleton=""
            className={cn(
              "h-(--accordion-panel-height) overflow-hidden accordion-panel-transition duration-350 ease-expo-out",
              "data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none",
            )}
          >
            <div className="mt-4 border-t border-white/6 pt-4 select-text">
              <p className="text-base leading-relaxed text-pretty whitespace-pre-line text-muted select-text">
                {item.answer}
              </p>

              {item.actionLink ? (
                <div className="mt-5 flex items-center p-1.5">
                  <LiquidGlassButton
                    type="button"
                    onClick={() => handleAction(item.actionLink?.action)}
                    roundedClass="rounded-full"
                    className="group/action-btn flex min-h-11 cursor-pointer items-center justify-center px-6 py-2.5 text-sm font-semibold text-text-primary shadow-sm transition-colors"
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
          </Accordion.Panel>
        </div>
      </InteractiveGlass>
    </Accordion.Item>
  );
});
