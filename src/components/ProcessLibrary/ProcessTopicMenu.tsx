import { memo } from "react";
import { motion } from "motion/react";
import { Tabs, Tab } from "../LiquidGlass/LiquidGlassTabs";
import { PROCESS_TOPICS } from "../../data/processItems";
import { cn } from "../../utils/cn";
import { useProcessLibraryContext } from "./ProcessLibraryContext";

function ProcessTopicMenu() {
  const { state, actions } = useProcessLibraryContext();
  const { activeTopicId, cardVariants, prefersReducedMotion } = state;
  const { onTopicChange } = actions;
  return (
    <motion.div
      variants={cardVariants}
      custom={prefersReducedMotion}
      className="hidden w-full flex-col justify-center lg:col-span-5 lg:flex"
    >
      <div className="relative w-full">
        <div className="no-scrollbar process-tabs-mask -mx-4 max-h-[360px] overflow-y-auto px-4 py-6">
          <Tabs
            value={activeTopicId}
            onChange={onTopicChange}
            layoutId="active-process-highlight"
            squircle
            roundedClass="rounded-2xl"
            className="flex w-full flex-col justify-center gap-2.5"
          >
            {PROCESS_TOPICS.map((topic, idx) => {
              const isActive = activeTopicId === topic.id;
              return (
                <Tab
                  key={topic.id}
                  value={topic.id}
                  aria-controls={`tabpanel-${topic.id}`}
                  className={cn(
                    "group focus-visible:ring-accent/60 relative flex w-full cursor-pointer items-center gap-3.5 rounded-2xl px-7 py-4.5 text-left transition-colors duration-300 select-none focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
                    isActive
                      ? "text-text-primary font-medium"
                      : "text-muted hover:text-text-primary",
                  )}
                >
                  <span
                    className={cn(
                      "font-body relative z-10 min-w-[20px] text-sm tabular-nums transition-colors duration-300",
                      isActive
                        ? "text-accent font-bold"
                        : "text-muted/60 group-hover:text-muted font-medium",
                    )}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  <div className="relative z-10">
                    <span className="font-body block text-base font-semibold text-balance whitespace-normal transition-transform duration-300 group-hover:translate-x-0.5">
                      {topic.title}
                    </span>
                    <p className="text-muted/90 mt-0.5 text-sm tabular-nums transition-transform duration-300 group-hover:translate-x-0.5">
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
