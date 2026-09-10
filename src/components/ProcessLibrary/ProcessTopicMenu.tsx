import { memo } from "react";
import { motion, type Variants } from "motion/react";
import { Tabs, Tab } from "../LiquidGlass/LiquidGlassTabs";
import { PROCESS_TOPICS } from "../../data/processItems";
import { cn } from "../../utils/cn";

interface ProcessTopicMenuProps {
  activeTopicId: number;
  onTopicChange: (id: number) => void;
  cardVariants: Variants;
  prefersReducedMotion?: boolean | null;
}

function ProcessTopicMenu({
  activeTopicId,
  onTopicChange,
  cardVariants,
  prefersReducedMotion,
}: Readonly<ProcessTopicMenuProps>) {
  return (
    <motion.div
      variants={cardVariants}
      custom={prefersReducedMotion}
      className="hidden w-full flex-col justify-center lg:col-span-5 lg:flex"
    >
      <div className="relative w-full">
        <div className="no-scrollbar process-tabs-mask -mx-6 touch-pan-y overflow-x-auto overscroll-contain px-6 py-2 md:-mx-10 md:px-10 lg:-mx-4 lg:max-h-[360px] lg:overflow-x-hidden lg:overflow-y-auto lg:px-4 lg:py-6">
          <Tabs
            value={activeTopicId}
            onChange={onTopicChange}
            layoutId="active-process-highlight"
            squircle
            roundedClass="rounded-2xl"
            className="flex w-max flex-row justify-start gap-2.5 lg:w-full lg:flex-col lg:justify-center"
          >
            {PROCESS_TOPICS.map((topic, idx) => {
              const isActive = activeTopicId === topic.id;
              return (
                <Tab
                  key={topic.id}
                  value={topic.id}
                  aria-controls={`tabpanel-${topic.id}`}
                  className={cn(
                    "group focus-visible:ring-accent/60 relative flex w-auto flex-shrink-0 cursor-pointer items-center gap-3.5 rounded-2xl px-5 py-3.5 text-left transition-colors duration-300 select-none focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset lg:w-full lg:px-7 lg:py-4.5",
                    isActive
                      ? "text-text-primary font-medium"
                      : "text-muted hover:text-text-primary",
                  )}
                >
                  <span
                    className={cn(
                      "font-body relative z-10 min-w-[20px] text-xs tabular-nums transition-colors duration-300",
                      isActive
                        ? "text-accent font-bold"
                        : "text-muted/60 group-hover:text-muted font-medium",
                    )}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  <div className="relative z-10">
                    <span className="font-body line-clamp-1 block text-base font-semibold whitespace-nowrap transition-transform duration-300 group-hover:translate-x-0.5 lg:text-balance lg:whitespace-normal">
                      {topic.title}
                    </span>
                    <p className="text-muted/70 mt-0.5 text-xs tracking-wider uppercase transition-transform duration-300 group-hover:translate-x-0.5">
                      {topic.metrics ?? topic.category}
                    </p>
                  </div>
                </Tab>
              );
            })}
          </Tabs>
        </div>
      </div>
    </motion.div>
  );
}

export default memo(ProcessTopicMenu);
