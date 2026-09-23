import { memo, useCallback } from "react";
import { Tabs, Tab } from "../LiquidGlass/LiquidGlassTabs";
import { cn } from "../../utils/cn";

interface ProcessCardHeaderProps {
  topicId: number;
  title: string;
  viewMode: "tobe" | "asis";
  onViewModeChange: (topicId: number, mode: "tobe" | "asis") => void;
  isMobile?: boolean;
}

function ProcessCardHeader({
  topicId,
  title,
  viewMode,
  onViewModeChange,
  isMobile = false,
}: Readonly<ProcessCardHeaderProps>) {
  const handleModeChange = useCallback(
    (val: string | number) => {
      onViewModeChange(topicId, val as "tobe" | "asis");
    },
    [onViewModeChange, topicId],
  );

  return (
    <div
      className={cn(
        "relative z-10 flex w-full",
        isMobile
          ? "mb-3 flex-col gap-2.5 sm:mb-5 sm:flex-row sm:items-center sm:justify-between"
          : "mb-6 flex-row items-center justify-between",
      )}
    >
      <h3
        className={cn(
          "font-display tracking-tight text-balance text-text-primary",
          isMobile
            ? "flex min-h-0 items-center text-xl leading-snug sm:min-h-13 sm:text-2xl md:text-3xl"
            : "text-3xl leading-tight",
        )}
      >
        {title}
      </h3>

      <div
        className={cn(
          "shrink-0",
          isMobile ? "self-start sm:self-auto" : "self-auto",
        )}
      >
        <Tabs
          value={viewMode}
          onChange={handleModeChange}
          layoutId={
            isMobile
              ? `process-view-mode-pill-mobile-${topicId}`
              : `process-view-mode-pill-${topicId}`
          }
          variant="segmented"
          roundedClass="rounded-xl"
          className={cn(
            "isolate inline-flex transform-gpu items-center rounded-xl border border-white/10 p-1 backdrop-blur-md select-none",
            isMobile
              ? "h-9 bg-surface/80 shadow-md"
              : "bg-surface/90 shadow-lg",
          )}
          highlightClassName={cn(
            "border border-white/20 bg-white/15",
            isMobile ? "shadow-sm" : "shadow-md",
          )}
        >
          <Tab
            value="asis"
            roundedClass="rounded-lg"
            className={cn(
              "relative flex cursor-pointer items-center justify-center rounded-lg text-sm font-medium tracking-wide text-white/80 transition-colors duration-200 select-none hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              isMobile
                ? "h-7 px-6 before:absolute before:-inset-y-2 before:inset-x-0"
                : "h-9 px-4 before:absolute before:inset-x-0 before:-inset-y-1.5 focus-visible:ring-offset-1 focus-visible:ring-offset-black",
            )}
            activeClassName="font-semibold text-white"
          >
            <span>Source</span>
          </Tab>
          <Tab
            value="tobe"
            roundedClass="rounded-lg"
            className={cn(
              "relative flex cursor-pointer items-center justify-center rounded-lg text-sm font-medium tracking-wide text-white/80 transition-colors duration-200 select-none hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              isMobile
                ? "h-7 px-6 before:absolute before:-inset-y-2 before:inset-x-0"
                : "h-9 px-4 before:absolute before:inset-x-0 before:-inset-y-1.5 focus-visible:ring-offset-1 focus-visible:ring-offset-black",
            )}
            activeClassName="font-semibold text-white"
          >
            <span>Optimized</span>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}

export default memo(ProcessCardHeader);
