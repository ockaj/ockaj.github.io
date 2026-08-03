import { useState, useEffect, useCallback, memo } from "react";
import {
  motion,
  AnimatePresence,
  Variants,
  useReducedMotion,
} from "motion/react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { PROCESS_TOPICS, PROCESS_ITEMS } from "../data/processItems";
import { LiquidGlass, LiquidGlassButton } from "./LiquidGlass/LiquidGlass";
import { Tabs, Tab } from "./LiquidGlass/LiquidGlassTabs";
import ProcessLightbox from "./ProcessLightbox/ProcessLightbox";
import useEmblaCarousel from "embla-carousel-react";
import { prefetchAsset } from "../utils/quicklink";
import { cn } from "../utils/cn";
import { SPRING } from "../utils/springConfig";
import { useMediaQuery } from "../hooks/useMediaQuery";

interface CustomAnimationProps {
  prefersReducedMotion?: boolean;
  direction?: number;
  isMobile?: boolean;
}

const tabContentVariants: Variants = {
  hidden: (props: CustomAnimationProps = {}) => ({
    opacity: 0,
    x: props.prefersReducedMotion
      ? 0
      : props.isMobile
        ? 30 * (props.direction ?? 1)
        : 0,
    y: props.prefersReducedMotion
      ? 0
      : props.isMobile
        ? 0
        : 10 * (props.direction ?? 1),
    scale: props.prefersReducedMotion ? 1 : 0.99,
    transition: SPRING.exit,
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: SPRING.modal,
  },
  exit: (props: CustomAnimationProps = {}) => ({
    opacity: 0,
    x: props.prefersReducedMotion
      ? 0
      : props.isMobile
        ? -30 * (props.direction ?? 1)
        : 0,
    y: props.prefersReducedMotion
      ? 0
      : props.isMobile
        ? 0
        : -10 * (props.direction ?? 1),
    scale: props.prefersReducedMotion ? 1 : 0.99,
    transition: SPRING.exit,
  }),
};

const innerContentVariants: Variants = {
  hidden: (props: CustomAnimationProps = {}) => ({
    opacity: 0,
    scale: props.prefersReducedMotion ? 1 : 0.985,
    transition: SPRING.exit,
  }),
  visible: {
    opacity: 1,
    scale: 1,
    transition: SPRING.modal,
  },
};

(innerContentVariants as { exit: unknown }).exit = innerContentVariants.hidden;

const tagContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.035,
    },
  },
};

const tagItemVariants: Variants = {
  hidden: (props: CustomAnimationProps = {}) => ({
    opacity: 0,
    y: props.prefersReducedMotion ? 0 : 5,
    scale: props.prefersReducedMotion ? 1 : 0.96,
    transition: SPRING.exit,
  }),
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING.modal,
  },
};

function ProcessLibrary() {
  const prefersReducedMotion = useReducedMotion();
  const [activeTopicId, setActiveTopicId] = useState(PROCESS_TOPICS[0].id);
  const [viewModes, setViewModes] = useState<Record<number, "tobe" | "asis">>(
    {},
  );

  const handleTopicViewModeChange = useCallback(
    (topicId: number, mode: "tobe" | "asis") => {
      setViewModes((prev) => ({ ...prev, [topicId]: mode }));
    },
    [],
  );

  const [lightboxItem, setLightboxItem] = useState<{
    id: number;
    title: string;
    description: string;
    image: string;
    type: string;
  } | null>(null);
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "center",
    containScroll: false,
  });

  const [direction, setDirection] = useState(1);

  const activeTopic =
    PROCESS_TOPICS.find((t) => t.id === activeTopicId) || PROCESS_TOPICS[0];
  const activeViewMode = viewModes[activeTopic.id] || "asis";
  const activeVariant = activeTopic[activeViewMode];

  // Preload all diagram SVGs on mount
  useEffect(() => {
    PROCESS_ITEMS.forEach((item) => {
      prefetchAsset(item.image);
    });
  }, []);

  // Sync Embla scroll snaps with activeTopicId
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      const selectedIdx = emblaApi.selectedScrollSnap();
      const targetTopic = PROCESS_TOPICS[selectedIdx];
      if (targetTopic && targetTopic.id !== activeTopicId) {
        setActiveTopicId(targetTopic.id);
      }
    };

    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, activeTopicId]);

  const handleTopicChange = useCallback(
    (id: number) => {
      const newIdx = PROCESS_TOPICS.findIndex((t) => t.id === id);
      const oldIdx = PROCESS_TOPICS.findIndex((t) => t.id === activeTopicId);
      if (newIdx !== -1 && oldIdx !== -1 && newIdx !== oldIdx) {
        setDirection(newIdx > oldIdx ? 1 : -1);
        setActiveTopicId(id);
        if (emblaApi && isMobile) {
          emblaApi.scrollTo(newIdx);
        }
      }
    },
    [activeTopicId, emblaApi, isMobile],
  );

  const handlePrevTopic = useCallback(() => {
    if (isMobile && emblaApi) {
      emblaApi.scrollPrev();
      return;
    }
    const currentIndex = PROCESS_TOPICS.findIndex(
      (t) => t.id === activeTopicId,
    );
    if (currentIndex > 0) {
      const prevTopic = PROCESS_TOPICS[currentIndex - 1];
      setDirection(-1);
      setActiveTopicId(prevTopic.id);
    }
  }, [isMobile, emblaApi, activeTopicId]);

  const handleNextTopic = useCallback(() => {
    if (isMobile && emblaApi) {
      emblaApi.scrollNext();
      return;
    }
    const currentIndex = PROCESS_TOPICS.findIndex(
      (t) => t.id === activeTopicId,
    );
    if (currentIndex >= 0 && currentIndex < PROCESS_TOPICS.length - 1) {
      const nextTopic = PROCESS_TOPICS[currentIndex + 1];
      setDirection(1);
      setActiveTopicId(nextTopic.id);
    }
  }, [isMobile, emblaApi, activeTopicId]);

  return (
    <>
      {/* Interactive Split Dashboard */}
      <div className="px-6 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-stretch relative z-20">
          {/* Left Column: Index Menu Selector (3 Core Process Topics) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-center w-full">
            <div className="relative w-full">
              <div className="-mx-6 px-6 md:-mx-10 md:px-10 lg:-mx-4 lg:px-4 py-2 lg:py-6 overflow-x-auto lg:overflow-y-auto lg:overflow-x-hidden lg:max-h-[360px] no-scrollbar process-tabs-mask overscroll-contain">
                <Tabs
                  value={activeTopicId}
                  onChange={handleTopicChange}
                  layoutId="active-process-highlight"
                  squircle
                  roundedClass="rounded-2xl"
                  className="flex flex-row lg:flex-col gap-2.5 justify-start lg:justify-center w-max lg:w-full"
                >
                  {PROCESS_TOPICS.map((topic, idx) => {
                    const isActive = activeTopicId === topic.id;
                    return (
                      <Tab
                        key={topic.id}
                        value={topic.id}
                        aria-controls={`tabpanel-${topic.id}`}
                        className={cn(
                          "w-auto lg:w-full text-left relative px-5 py-3.5 lg:px-7 lg:py-4.5 rounded-2xl flex-shrink-0 transition-colors duration-300 flex items-center gap-3.5 select-none cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-inset",
                          isActive
                            ? "text-text-primary font-medium"
                            : "text-muted hover:text-text-primary",
                        )}
                      >
                        {/* Badge Index */}
                        <span
                          className={cn(
                            "relative z-10 text-xs font-body tabular-nums transition-colors duration-300 min-w-[20px]",
                            isActive
                              ? "font-bold text-accent"
                              : "font-medium text-muted/60 group-hover:text-muted",
                          )}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </span>

                        {/* Metadata */}
                        <div className="relative z-10">
                          <span className="block text-base font-semibold font-body transition-transform duration-300 group-hover:translate-x-0.5 whitespace-nowrap lg:whitespace-normal lg:text-balance line-clamp-1">
                            {topic.title}
                          </span>
                          <p className="text-xs text-muted/70 uppercase tracking-wider mt-0.5 transition-transform duration-300 group-hover:translate-x-0.5">
                            {topic.metrics ?? topic.category}
                          </p>
                        </div>
                      </Tab>
                    );
                  })}
                </Tabs>
              </div>
            </div>
          </div>

          {/* Mobile Column: Embla Carousel with 84% Card Width & Full-Bleed Edge Peek */}
          <div className="lg:hidden col-span-1 flex flex-col justify-center w-full min-w-0">
            <motion.div
              whileInView={
                prefersReducedMotion ? undefined : { x: [0, -24, 0] }
              }
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
              className="w-full flex flex-col"
            >
              <div
                className="-mx-6 px-6 sm:-mx-10 sm:px-10 overflow-hidden py-2"
                ref={emblaRef}
              >
                <div className="flex gap-4 sm:gap-6 touch-pan-y">
                  {PROCESS_TOPICS.map((topic) => {
                    const cardViewMode = viewModes[topic.id] || "asis";
                    const cardVariant = topic[cardViewMode];
                    const cardItem = {
                      id: topic.id,
                      title: cardVariant.title,
                      description: cardVariant.description,
                      image: cardVariant.image,
                      type: cardVariant.type,
                    };

                    return (
                      <div
                        key={topic.id}
                        className="flex-[0_0_96%] sm:flex-[0_0_92%] min-w-0"
                      >
                        <LiquidGlass
                          as="div"
                          roundedClass="rounded-2xl"
                          className="w-full h-full p-6 sm:p-8 md:p-9 flex-col text-left justify-start items-stretch"
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                              key={cardViewMode}
                              custom={{ prefersReducedMotion, direction }}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              variants={innerContentVariants}
                              className="w-full flex-1 flex flex-col justify-between"
                            >
                              {/* Card Header */}
                              <div className="mb-4 sm:mb-6 relative z-10 w-full">
                                <h3 className="text-2xl sm:text-3xl font-display text-text-primary text-balance tracking-tight leading-tight">
                                  {cardVariant.title}
                                </h3>
                              </div>

                              {/* Blueprint Stage */}
                              <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-white/10 bg-white flex items-center justify-center mb-5 select-none group/canvas">
                                <button
                                  type="button"
                                  className="w-full h-full p-3 sm:p-4 flex items-center justify-center cursor-zoom-in focus-visible:outline-none"
                                  onClick={() => setLightboxItem(cardItem)}
                                  aria-label={`Zoom diagram: ${cardVariant.title}`}
                                >
                                  <img
                                    src={cardVariant.image}
                                    alt={cardVariant.title}
                                    width={800}
                                    height={500}
                                    className="w-full h-full object-contain rounded-lg"
                                    loading="lazy"
                                  />
                                </button>

                                {/* View Mode Toggle Pill inside each card */}
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
                                  <Tabs
                                    value={cardViewMode}
                                    onChange={(val) =>
                                      handleTopicViewModeChange(
                                        topic.id,
                                        val as "tobe" | "asis",
                                      )
                                    }
                                    layoutId={`process-view-mode-pill-mobile-${topic.id}`}
                                    roundedClass="rounded-xl"
                                    highlightStyle={
                                      {
                                        "--base-radius": "8px",
                                      } as React.CSSProperties
                                    }
                                    className="inline-flex items-center bg-surface/80 backdrop-blur-md border border-white/10 p-[5px] rounded-xl shadow-2xl select-none isolate [transform:translateZ(0)]"
                                    highlightClassName="bg-white/15 border border-white/20 shadow-md"
                                  >
                                    <Tab
                                      value="asis"
                                      className={cn(
                                        "relative h-8 px-3.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors duration-200 cursor-pointer select-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                                        cardViewMode === "asis"
                                          ? "text-white font-bold"
                                          : "text-white/70 hover:text-white",
                                      )}
                                    >
                                      SOURCE
                                    </Tab>
                                    <Tab
                                      value="tobe"
                                      className={cn(
                                        "relative h-8 px-3.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors duration-200 cursor-pointer select-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                                        cardViewMode === "tobe"
                                          ? "text-white font-bold"
                                          : "text-white/70 hover:text-white",
                                      )}
                                    >
                                      OPTIMIZED
                                    </Tab>
                                  </Tabs>
                                </div>
                              </div>

                              {/* Card Footer Details */}
                              <div className="relative z-10 mt-auto flex flex-col gap-2.5">
                                <div className="flex items-center gap-2">
                                  <Sparkles size={14} className="text-accent" />
                                  <span className="text-xs font-bold uppercase tracking-wider text-accent font-body">
                                    Operational Insight
                                  </span>
                                </div>
                                <p className="text-sm text-text-primary/90 leading-relaxed text-pretty">
                                  {cardVariant.description}
                                </p>
                                {cardVariant.specTags &&
                                  cardVariant.specTags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                      {cardVariant.specTags.map((tag) => (
                                        <span
                                          key={tag}
                                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.04] border border-white/10 text-text-primary/90 transition-colors select-none"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
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

          {/* Desktop Right Column: Display Stage & Blueprint Canvas */}
          <div className="hidden lg:flex lg:col-span-7 flex-col justify-center w-full min-w-0">
            {/* Outer AnimatePresence: Original full card animation when switching TOPICS */}
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
                className="w-full h-full flex flex-col"
              >
                <LiquidGlass
                  as="div"
                  roundedClass="rounded-2xl"
                  className="w-full h-full p-5 sm:p-7 md:p-8 flex-col text-left justify-start items-stretch touch-pan-y"
                  tilt
                >
                  {/* Canvas Header (100% Full-Width Title with Optical Lens Refocus) */}
                  <div className="mb-5 sm:mb-6 relative z-10 w-full">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.h3
                        key={activeViewMode}
                        custom={{ prefersReducedMotion }}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={innerContentVariants}
                        className="text-2xl sm:text-3xl font-display text-text-primary text-balance tracking-tight leading-tight"
                      >
                        {activeVariant.title}
                      </motion.h3>
                    </AnimatePresence>
                  </div>

                  {/* Inner AnimatePresence: Subtle 200ms diagram micro-crossfade when switching MODE (TO-BE vs AS-IS) */}
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
                      className="w-full flex-1 flex flex-col justify-between"
                    >
                      {/* Seamless Blueprint Stage (Pure Canvas Sheet with Optical Spacing & Floating Dock) */}
                      <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-white/10 bg-white flex items-center justify-center mb-6 sm:mb-7 select-none group/canvas transition-all duration-300 hover:border-white/25">
                        {/* Image Zoom Trigger Button */}
                        <button
                          type="button"
                          className="w-full h-full min-h-[44px] p-4 sm:p-6 md:p-7 flex items-center justify-center cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
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
                            className="w-full h-full object-contain rounded-lg transition-transform duration-300 ease-out group-hover/canvas:scale-[1.015]"
                            loading="lazy"
                          />
                        </button>

                        {/* Floating Apple Bottom-Center Glass Control Dock */}
                        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
                          <Tabs
                            value={activeViewMode}
                            onChange={(val) =>
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
                            className="inline-flex items-center bg-surface/90 backdrop-blur-md border border-white/10 p-[5px] rounded-xl shadow-2xl select-none isolate [transform:translateZ(0)]"
                            highlightClassName="bg-white/15 border border-white/20 shadow-md"
                          >
                            <Tab
                              value="asis"
                              className={cn(
                                "relative h-8 sm:h-8.5 px-3.5 sm:px-4 rounded-lg text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition-colors duration-200 cursor-pointer select-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-black before:absolute before:-inset-y-1.5 before:inset-x-0",
                                activeViewMode === "asis"
                                  ? "text-white font-bold"
                                  : "text-white/70 hover:text-white",
                              )}
                            >
                              SOURCE
                            </Tab>
                            <Tab
                              value="tobe"
                              className={cn(
                                "relative h-8 sm:h-8.5 px-3.5 sm:px-4 rounded-lg text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition-colors duration-200 cursor-pointer select-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-black before:absolute before:-inset-y-1.5 before:inset-x-0",
                                activeViewMode === "tobe"
                                  ? "text-white font-bold"
                                  : "text-white/70 hover:text-white",
                              )}
                            >
                              OPTIMIZED
                            </Tab>
                          </Tabs>
                        </div>
                      </div>

                      {/* Canvas Footer Details: Seamless Operational Insight */}
                      <div className="relative z-10 mt-auto flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-accent" />
                            <span className="text-xs font-bold uppercase tracking-wider text-accent font-body">
                              Operational Insight
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-text-primary/90 leading-relaxed text-pretty">
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
                                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.03] border border-white/[0.08] text-text-primary/80 transition-colors hover:border-accent/40 hover:text-accent select-none"
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
          </div>

          {/* Mobile Topic Selector (Sleek Glass Dock with Left/Right Buttons) */}
          <div className="lg:hidden flex justify-center w-full">
            <LiquidGlass
              as="div"
              roundedClass="rounded-full"
              className="px-2.5 py-2 shadow-lg"
              innerClassName="flex items-center gap-3.5"
            >
              {/* Previous Topic Button */}
              <LiquidGlassButton
                onClick={handlePrevTopic}
                disabled={activeTopicId === PROCESS_TOPICS[0].id}
                roundedClass="rounded-full"
                className="size-[44px] min-h-[44px] min-w-[44px] flex items-center justify-center text-text-primary disabled:opacity-30 disabled:pointer-events-none transition-opacity flex-shrink-0 cursor-pointer"
                aria-label="Previous process topic"
              >
                <ChevronLeft size={18} />
              </LiquidGlassButton>

              {/* Center Counter */}
              <span className="text-xs font-body tabular-nums flex items-center gap-1 leading-none select-none px-1.5">
                <span className="text-accent font-bold">
                  {String(activeTopic.id).padStart(2, "0")}
                </span>
                <span className="text-muted/40 font-medium">/</span>
                <span className="text-muted/60 font-medium">
                  {String(PROCESS_TOPICS.length).padStart(2, "0")}
                </span>
              </span>

              {/* Next Topic Button */}
              <LiquidGlassButton
                onClick={handleNextTopic}
                disabled={
                  activeTopicId === PROCESS_TOPICS[PROCESS_TOPICS.length - 1].id
                }
                roundedClass="rounded-full"
                className="size-[44px] min-h-[44px] min-w-[44px] flex items-center justify-center text-text-primary disabled:opacity-30 disabled:pointer-events-none transition-opacity flex-shrink-0 cursor-pointer"
                aria-label="Next process topic"
              >
                <ChevronRight size={18} />
              </LiquidGlassButton>
            </LiquidGlass>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {lightboxItem ? (
          <ProcessLightbox
            key={lightboxItem.id}
            item={lightboxItem}
            onClose={() => setLightboxItem(null)}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default memo(ProcessLibrary);
