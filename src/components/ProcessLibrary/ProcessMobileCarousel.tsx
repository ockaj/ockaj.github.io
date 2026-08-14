import { motion } from "motion/react";
import { LiquidGlass } from "../LiquidGlass/LiquidGlass";
import { Tabs, Tab } from "../LiquidGlass/LiquidGlassTabs";
import { cn } from "../../utils/cn";
import { PROCESS_TOPICS } from "../../data/processItems";
import ProcessVariantStage from "./ProcessVariantStage";

interface ProcessMobileCarouselProps {
  emblaRef: (node: HTMLElement | null) => void;
  viewModes: Record<number, "tobe" | "asis">;
  handleTopicViewModeChange: (topicId: number, mode: "tobe" | "asis") => void;
  setLightboxItem: (item: {
    id: number;
    title: string;
    description: string;
    image: string;
    type: string;
  }) => void;
  prefersReducedMotion: boolean | null;
}

export default function ProcessMobileCarousel({
  emblaRef,
  viewModes,
  handleTopicViewModeChange,
  setLightboxItem,
  prefersReducedMotion,
}: Readonly<ProcessMobileCarouselProps>) {
  return (
    <div className="col-span-1 flex w-full min-w-0 flex-col justify-center lg:hidden">
      <motion.div
        whileInView={prefersReducedMotion ? undefined : { x: [0, -24, 0] }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
        className="flex w-full flex-col"
      >
        <div
          className="-mx-6 overflow-hidden px-6 py-2 sm:-mx-10 sm:px-10"
          ref={emblaRef}
        >
          <div className="flex touch-pan-y gap-4 sm:gap-6">
            {PROCESS_TOPICS.map((topic, idx) => {
              const cardViewMode = viewModes[topic.id] || "asis";

              return (
                <div
                  key={topic.id}
                  className="min-w-0 flex-[0_0_96%] sm:flex-[0_0_92%]"
                >
                  <LiquidGlass
                    as="div"
                    roundedClass="rounded-2xl"
                    className="h-full w-full flex-col items-stretch justify-start p-6 text-left sm:p-8 md:p-9"
                    innerClassName="flex flex-col flex-1 min-h-0"
                  >
                    {/* Card Header */}
                    <div className="relative z-10 mb-4 flex w-full flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-display text-text-primary flex min-h-[3.25rem] items-center text-2xl leading-tight tracking-tight text-balance sm:min-h-0 sm:text-3xl">
                        {topic.asis.title}
                      </h3>

                      <div className="w-full shrink-0 sm:w-auto">
                        <Tabs
                          value={cardViewMode}
                          onChange={(val: string | number) =>
                            handleTopicViewModeChange(
                              topic.id,
                              val as "tobe" | "asis",
                            )
                          }
                          layoutId={`process-view-mode-pill-mobile-${topic.id}`}
                          roundedClass="rounded-xl"
                          highlightStyle={
                            {
                              "--base-radius": "10px",
                            } as React.CSSProperties
                          }
                          className="bg-surface/80 isolate inline-flex h-11 w-full [transform:translateZ(0)] items-center rounded-xl border border-white/10 p-1 shadow-md backdrop-blur-md select-none sm:w-auto"
                          highlightClassName="bg-white/15 border border-white/20 shadow-sm"
                        >
                          <Tab
                            value="asis"
                            className={cn(
                              "focus-visible:ring-accent flex h-9 flex-1 cursor-pointer items-center justify-center rounded-lg px-4 text-xs font-semibold tracking-wider uppercase transition-colors duration-200 select-none focus-visible:ring-2 focus-visible:outline-none sm:flex-initial",
                              cardViewMode === "asis"
                                ? "font-bold text-white"
                                : "text-white/70 hover:text-white",
                            )}
                          >
                            SOURCE
                          </Tab>
                          <Tab
                            value="tobe"
                            className={cn(
                              "focus-visible:ring-accent flex h-9 flex-1 cursor-pointer items-center justify-center rounded-lg px-4 text-xs font-semibold tracking-wider uppercase transition-colors duration-200 select-none focus-visible:ring-2 focus-visible:outline-none sm:flex-initial",
                              cardViewMode === "tobe"
                                ? "font-bold text-white"
                                : "text-white/70 hover:text-white",
                            )}
                          >
                            OPTIMIZED
                          </Tab>
                        </Tabs>
                      </div>
                    </div>

                    {/* Zero-Unmount Layer Staged Content */}
                    <ProcessVariantStage
                      topic={topic}
                      activeViewMode={cardViewMode}
                      setLightboxItem={setLightboxItem}
                      isFirstSlide={idx === 0}
                    />
                  </LiquidGlass>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
