import { motion, AnimatePresence, type Variants } from "motion/react";
import { LiquidGlass } from "../LiquidGlass/LiquidGlass";
import { Tabs, Tab } from "../LiquidGlass/LiquidGlassTabs";
import { cn } from "../../utils/cn";
import { type ProcessTopic } from "../../data/processItems";
import ProcessVariantStage from "./ProcessVariantStage";

interface ProcessDesktopCardProps {
  activeTopic: ProcessTopic;
  activeViewMode: "tobe" | "asis";
  handleTopicViewModeChange: (topicId: number, mode: "tobe" | "asis") => void;
  setLightboxItem: (item: {
    id: number;
    title: string;
    description: string;
    image: string;
    type: string;
  }) => void;
  prefersReducedMotion: boolean | null;
  direction: number;
  isMobile: boolean;
  cardVariants: Variants;
  tabContentVariants: Variants;
}

export default function ProcessDesktopCard({
  activeTopic,
  activeViewMode,
  handleTopicViewModeChange,
  setLightboxItem,
  prefersReducedMotion,
  direction,
  isMobile,
  cardVariants,
  tabContentVariants,
}: Readonly<ProcessDesktopCardProps>) {
  return (
    <motion.div
      variants={cardVariants}
      custom={prefersReducedMotion}
      className="hidden w-full min-w-0 flex-col justify-center lg:col-span-7 lg:flex"
    >
      <AnimatePresence
        mode="wait"
        initial={false}
        custom={{ prefersReducedMotion, direction, isMobile }}
      >
        <motion.div
          key={activeTopic.id}
          id={`tabpanel-${activeTopic.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTopic.id}`}
          custom={{ prefersReducedMotion, direction, isMobile }}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={tabContentVariants}
          className="flex h-full w-full flex-col"
        >
          <LiquidGlass
            as="div"
            roundedClass="rounded-2xl"
            className="h-full w-full touch-pan-y flex-col items-stretch justify-start p-5 text-left sm:p-7 md:p-8"
            tilt
          >
            {/* Canvas Header */}
            <div className="relative z-10 mb-5 flex w-full flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-display text-text-primary text-2xl leading-tight tracking-tight text-balance sm:text-3xl">
                {activeTopic.asis.title}
              </h3>

              {/* View Mode Segmented Control */}
              <div className="shrink-0 self-start sm:self-auto">
                <Tabs
                  value={activeViewMode}
                  onChange={(val: string | number) =>
                    handleTopicViewModeChange(
                      activeTopic.id,
                      val as "tobe" | "asis",
                    )
                  }
                  layoutId={`process-view-mode-pill-${activeTopic.id}`}
                  roundedClass="rounded-xl"
                  highlightStyle={
                    { "--base-radius": "8px" } as React.CSSProperties
                  }
                  className="bg-surface/90 isolate inline-flex [transform:translateZ(0)] items-center rounded-xl border border-white/10 p-[4px] shadow-lg backdrop-blur-md select-none"
                  highlightClassName="bg-white/15 border border-white/20 shadow-md"
                >
                  <Tab
                    value="asis"
                    className={cn(
                      "focus-visible:ring-accent relative flex h-7 cursor-pointer items-center justify-center rounded-lg px-3 text-xs font-semibold tracking-wider uppercase transition-colors duration-200 select-none before:absolute before:inset-x-0 before:-inset-y-1.5 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-black focus-visible:outline-none sm:h-8.5 sm:px-4 sm:text-xs",
                      activeViewMode === "asis"
                        ? "font-bold text-white"
                        : "text-white/70 hover:text-white",
                    )}
                  >
                    <span>SOURCE</span>
                  </Tab>
                  <Tab
                    value="tobe"
                    className={cn(
                      "focus-visible:ring-accent relative flex h-7 cursor-pointer items-center justify-center rounded-lg px-3 text-xs font-semibold tracking-wider uppercase transition-colors duration-200 select-none before:absolute before:inset-x-0 before:-inset-y-1.5 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-black focus-visible:outline-none sm:h-8.5 sm:px-4 sm:text-xs",
                      activeViewMode === "tobe"
                        ? "font-bold text-white"
                        : "text-white/70 hover:text-white",
                    )}
                  >
                    <span>OPTIMIZED</span>
                  </Tab>
                </Tabs>
              </div>
            </div>

            {/* Zero-Unmount Layer Staged Content */}
            <ProcessVariantStage
              topic={activeTopic}
              activeViewMode={activeViewMode}
              setLightboxItem={setLightboxItem}
            />
          </LiquidGlass>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
