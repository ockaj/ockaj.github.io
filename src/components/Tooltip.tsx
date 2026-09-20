import { ReactNode } from "react";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { cn } from "../utils/cn";

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export default function Tooltip({ content, children }: Readonly<TooltipProps>) {
  return (
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
        <BaseTooltip.Positioner side="top" sideOffset={8} className="z-9999">
          <BaseTooltip.Popup
            className={cn(
              "pointer-events-none z-9999 max-w-xs rounded-xl border border-white/15 bg-surface/95 px-3.5 py-2 text-center text-sm leading-relaxed font-normal tracking-normal text-text-primary shadow-2xl",
              "transition-all duration-150 ease-out",
              "data-starting-style:translate-y-1 data-starting-style:scale-95 data-starting-style:opacity-0",
              "data-ending-style:translate-y-1 data-ending-style:scale-95 data-ending-style:opacity-0",
              "data-instant:transition-none motion-reduce:transition-none",
            )}
          >
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
