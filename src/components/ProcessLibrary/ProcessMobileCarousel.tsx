import { motion, AnimatePresence, Variants } from "motion/react";
import { Sparkles, Maximize2 } from "lucide-react";
import { LiquidGlass } from "../LiquidGlass/LiquidGlass";
import { Tabs, Tab } from "../LiquidGlass/LiquidGlassTabs";
import { cn } from "../../utils/cn";
import { PROCESS_TOPICS } from "../../data/processItems";

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
  direction: number;
  innerContentVariants: Variants;
}

export default function ProcessMobileCarousel({
  emblaRef,
  viewModes,
  handleTopicViewModeChange,
  setLightboxItem,
  prefersReducedMotion,
  direction,
  innerContentVariants,
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
            {PROCESS_TOPICS.map((topic) => {
              const cardViewMode = viewModes[topic.id] || "asis";
              const cardVariant = topic[cardViewMode];

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
                      <h3 className="font-display text-text-primary text-2xl leading-tight tracking-tight text-balance sm:text-3xl">
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

                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={cardViewMode}
                        custom={{ prefersReducedMotion, direction }}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={innerContentVariants}
                        className="flex w-full flex-1 flex-col justify-start"
                      >
                        {/* Blueprint Stage */}
                        <div className="group/canvas relative mb-4 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white select-none sm:mb-5">
                          <button
                            type="button"
                            className="flex h-full w-full cursor-zoom-in items-center justify-center p-3 focus-visible:outline-none sm:p-4"
                            onClick={() =>
                              setLightboxItem({
                                id: topic.id,
                                title: cardVariant.title,
                                description: cardVariant.description,
                                image: cardVariant.image,
                                type: cardVariant.type,
                              })
                            }
                            aria-label={`Zoom diagram: ${cardVariant.title}`}
                          >
                            <img
                              src={cardVariant.image}
                              alt={cardVariant.title}
                              width={800}
                              height={500}
                              className="h-full w-full rounded-lg object-contain"
                              loading="lazy"
                            />
                          </button>
                          <div className="pointer-events-none absolute right-2.5 bottom-2.5 z-10">
                            <span className="bg-surface/80 text-text-primary group-hover/canvas:border-accent/60 group-hover/canvas:text-accent inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-1.5 text-xs font-semibold shadow-xl backdrop-blur-md transition-colors duration-200">
                              <Maximize2 size={12} className="text-accent" />
                              <span>Expand</span>
                            </span>
                          </div>
                        </div>

                        {/* Card Footer Details */}
                        <div className="relative z-10 flex flex-col gap-2.5">
                          <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-accent" />
                            <span className="text-accent font-body text-xs font-bold tracking-wider uppercase">
                              Operational Insight
                            </span>
                          </div>
                          <p className="text-text-primary/90 line-clamp-3 text-sm leading-relaxed text-pretty">
                            {cardVariant.description}
                          </p>
                          {cardVariant.specTags &&
                          cardVariant.specTags.length > 0 ? (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {cardVariant.specTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-muted rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs transition-colors select-none"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </motion.div>
                    </AnimatePresence>
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
