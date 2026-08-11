import { motion, AnimatePresence, Variants } from "motion/react";
import { Sparkles, Maximize2 } from "lucide-react";
import { LiquidGlass } from "../LiquidGlass/LiquidGlass";
import { Tabs, Tab } from "../LiquidGlass/LiquidGlassTabs";
import { cn } from "../../utils/cn";
import { ProcessTopic } from "../../data/processItems";

interface ProcessDesktopCardProps {
  activeTopic: ProcessTopic;
  activeViewMode: "tobe" | "asis";
  activeVariant: ProcessTopic["tobe"] | ProcessTopic["asis"];
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
  innerContentVariants: Variants;
  tagContainerVariants: Variants;
  tagItemVariants: Variants;
}

export default function ProcessDesktopCard({
  activeTopic,
  activeViewMode,
  activeVariant,
  handleTopicViewModeChange,
  setLightboxItem,
  prefersReducedMotion,
  direction,
  isMobile,
  cardVariants,
  tabContentVariants,
  innerContentVariants,
  tagContainerVariants,
  tagItemVariants,
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
                      "focus-visible:ring-accent relative flex h-7 cursor-pointer items-center justify-center rounded-lg px-3 text-[11px] font-semibold tracking-wider uppercase transition-colors duration-200 select-none before:absolute before:inset-x-0 before:-inset-y-1.5 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-black focus-visible:outline-none sm:h-8.5 sm:px-4 sm:text-xs",
                      activeViewMode === "asis"
                        ? "font-bold text-white"
                        : "text-white/70 hover:text-white",
                    )}
                  >
                    SOURCE
                  </Tab>
                  <Tab
                    value="tobe"
                    className={cn(
                      "focus-visible:ring-accent relative flex h-7 cursor-pointer items-center justify-center rounded-lg px-3 text-[11px] font-semibold tracking-wider uppercase transition-colors duration-200 select-none before:absolute before:inset-x-0 before:-inset-y-1.5 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-black focus-visible:outline-none sm:h-8.5 sm:px-4 sm:text-xs",
                      activeViewMode === "tobe"
                        ? "font-bold text-white"
                        : "text-white/70 hover:text-white",
                    )}
                  >
                    OPTIMIZED
                  </Tab>
                </Tabs>
              </div>
            </div>

            {/* Inner AnimatePresence */}
            <AnimatePresence
              mode="wait"
              initial={false}
              custom={{ prefersReducedMotion, direction }}
            >
              <motion.div
                key={activeViewMode}
                custom={{ prefersReducedMotion, direction }}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={innerContentVariants}
                className="flex w-full flex-1 flex-col justify-between"
              >
                {/* Blueprint Stage */}
                <div className="group/canvas relative mb-6 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white transition-colors duration-300 select-none hover:border-white/25 sm:mb-7">
                  <button
                    type="button"
                    className="focus-visible:ring-accent flex h-full min-h-[44px] w-full cursor-zoom-in items-center justify-center p-4 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none sm:p-6 md:p-7"
                    onClick={() =>
                      setLightboxItem({
                        id: activeTopic.id,
                        title: activeVariant.title,
                        description: activeVariant.description,
                        image: activeVariant.image,
                        type: activeVariant.type,
                      })
                    }
                    aria-label={`Zoom diagram: ${activeVariant.title}`}
                  >
                    <img
                      src={activeVariant.image}
                      alt={activeVariant.title}
                      width={800}
                      height={500}
                      className="h-full w-full rounded-lg object-contain transition-transform duration-300 ease-out group-hover/canvas:scale-[1.015]"
                      loading="lazy"
                    />
                  </button>
                  <div className="pointer-events-none absolute right-3 bottom-3 z-10">
                    <span className="bg-surface/80 text-text-primary group-hover/canvas:border-accent/60 group-hover/canvas:text-accent inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3.5 py-1.5 text-xs font-semibold shadow-xl backdrop-blur-md transition duration-200 group-hover/canvas:scale-105">
                      <Maximize2 size={13} className="text-accent" />
                      <span>Expand Diagram</span>
                    </span>
                  </div>
                </div>

                {/* Canvas Footer Details */}
                <div className="relative z-10 mt-auto flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-accent" />
                      <span className="text-accent font-body text-xs font-bold tracking-wider uppercase">
                        Operational Insight
                      </span>
                    </div>
                  </div>
                  <p className="text-text-primary/90 text-sm leading-relaxed text-pretty">
                    {activeVariant.description}
                  </p>
                  {activeVariant.specTags &&
                    activeVariant.specTags.length > 0 && (
                      <motion.div
                        variants={tagContainerVariants}
                        initial="hidden"
                        animate="visible"
                        custom={{ prefersReducedMotion }}
                        className="flex flex-wrap gap-2 pt-1"
                      >
                        {activeVariant.specTags.map((tag) => (
                          <motion.span
                            key={tag}
                            variants={tagItemVariants}
                            custom={{ prefersReducedMotion }}
                            className="text-muted hover:text-text-primary rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs transition-colors select-none hover:border-white/20"
                          >
                            {tag}
                          </motion.span>
                        ))}
                      </motion.div>
                    )}
                </div>
              </motion.div>
            </AnimatePresence>
          </LiquidGlass>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
