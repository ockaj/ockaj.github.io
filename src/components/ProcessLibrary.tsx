import { useState, useEffect, useCallback, memo } from "react";
import {
  motion,
  AnimatePresence,
  Variants,
  useReducedMotion,
} from "motion/react";
import { ChevronLeft, ChevronRight, Sparkles, Maximize2 } from "lucide-react";
import { PROCESS_TOPICS, PROCESS_ITEMS } from "../data/processItems";
import { LiquidGlass, LiquidGlassButton } from "./LiquidGlass/LiquidGlass";
import { Tabs, Tab } from "./LiquidGlass/LiquidGlassTabs";
import ProcessLightbox from "./ProcessLightbox/ProcessLightbox";
import useEmblaCarousel from "embla-carousel-react";
import { prefetchAsset } from "../utils/quicklink";
import { cn } from "../utils/cn";
import { SPRING } from "../utils/springConfig";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { isBoneyardBuild } from "../utils/boneyard";
import {
  containerStaggerVariants,
  cardStaggerVariants,
  SECTION_VIEWPORT,
} from "../utils/motionVariants";

const isBuildMode = isBoneyardBuild();
const containerVariants = containerStaggerVariants();
const cardVariants = cardStaggerVariants;

interface CustomAnimationProps {
  prefersReducedMotion?: boolean;
  direction?: number;
  isMobile?: boolean;
}

function getTabHiddenX(props: CustomAnimationProps = {}) {
  if (props.prefersReducedMotion) return 0;
  if (props.isMobile) return 30 * (props.direction ?? 1);
  return 0;
}

function getTabHiddenY(props: CustomAnimationProps = {}) {
  if (props.prefersReducedMotion) return 0;
  if (props.isMobile) return 0;
  return 10 * (props.direction ?? 1);
}

function getTabExitX(props: CustomAnimationProps = {}) {
  if (props.prefersReducedMotion) return 0;
  if (props.isMobile) return -30 * (props.direction ?? 1);
  return 0;
}

function getTabExitY(props: CustomAnimationProps = {}) {
  if (props.prefersReducedMotion) return 0;
  if (props.isMobile) return 0;
  return -10 * (props.direction ?? 1);
}

const tabContentVariants: Variants = {
  hidden: (props: CustomAnimationProps = {}) => ({
    opacity: 0,
    x: getTabHiddenX(props),
    y: getTabHiddenY(props),
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
    x: getTabExitX(props),
    y: getTabExitY(props),
    scale: props.prefersReducedMotion ? 1 : 0.99,
    transition: SPRING.exit,
  }),
};

const innerContentVariants: Variants = {
  hidden: (props: CustomAnimationProps = {}) => ({
    opacity: 0,
    scale: props.prefersReducedMotion ? 1 : 0.995,
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
  const isMobile = !useMediaQuery("(min-width: 1024px)");

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
        <motion.div
          custom={prefersReducedMotion}
          variants={containerVariants}
          initial={isBuildMode ? "visible" : "hidden"}
          whileInView={isBuildMode ? undefined : "visible"}
          viewport={isBuildMode ? undefined : SECTION_VIEWPORT}
          className="relative z-20 grid grid-cols-1 items-stretch gap-8 md:gap-12 lg:grid-cols-12"
        >
          {/* Left Column: Index Menu Selector (3 Core Process Topics) */}
          <motion.div
            variants={cardVariants}
            custom={prefersReducedMotion}
            className="hidden w-full flex-col justify-center lg:col-span-5 lg:flex"
          >
            <div className="relative w-full">
              <div className="no-scrollbar process-tabs-mask -mx-6 overflow-x-auto overscroll-contain px-6 py-2 md:-mx-10 md:px-10 lg:-mx-4 lg:max-h-[360px] lg:overflow-x-hidden lg:overflow-y-auto lg:px-4 lg:py-6">
                <Tabs
                  value={activeTopicId}
                  onChange={handleTopicChange}
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
                        {/* Badge Index */}
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

                        {/* Metadata */}
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

          {/* Mobile Column: Embla Carousel with 84% Card Width & Full-Bleed Edge Peek */}
          <div className="col-span-1 flex w-full min-w-0 flex-col justify-center lg:hidden">
            <motion.div
              whileInView={
                prefersReducedMotion ? undefined : { x: [0, -24, 0] }
              }
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
                        className="min-w-0 flex-[0_0_96%] sm:flex-[0_0_92%]"
                      >
                        <LiquidGlass
                          as="div"
                          roundedClass="rounded-2xl"
                          className="h-full w-full flex-col items-stretch justify-start p-6 text-left sm:p-8 md:p-9"
                          innerClassName="flex flex-col flex-1 min-h-0"
                        >
                          {/* Card Header (100% Stationary Title & Segmented Control) */}
                          <div className="relative z-10 mb-4 flex w-full flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="font-display text-text-primary text-2xl leading-tight tracking-tight text-balance sm:text-3xl">
                              {topic.asis.title}
                            </h3>

                            {/* Responsive HIG Compliant Segmented Control */}
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
                                  onClick={() => setLightboxItem(cardItem)}
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
                                {/* Tactile Glass Expand Affordance Badge */}
                                <div className="pointer-events-none absolute right-2.5 bottom-2.5 z-10">
                                  <span className="bg-surface/80 text-text-primary group-hover/canvas:border-accent/60 group-hover/canvas:text-accent inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-1.5 text-xs font-semibold shadow-xl backdrop-blur-md transition-all duration-200">
                                    <Maximize2
                                      size={12}
                                      className="text-accent"
                                    />
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
                                  cardVariant.specTags.length > 0 && (
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
          <motion.div
            variants={cardVariants}
            custom={prefersReducedMotion}
            className="hidden w-full min-w-0 flex-col justify-center lg:col-span-7 lg:flex"
          >
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
                      className="flex w-full flex-1 flex-col justify-between"
                    >
                      {/* Seamless Blueprint Stage (Pure Canvas Sheet with Optical Spacing) */}
                      <div className="group/canvas relative mb-6 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white transition-all duration-300 select-none hover:border-white/25 sm:mb-7">
                        {/* Image Zoom Trigger Button */}
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
                        {/* Tactile Glass Expand Affordance Badge */}
                        <div className="pointer-events-none absolute right-3 bottom-3 z-10">
                          <span className="bg-surface/80 text-text-primary group-hover/canvas:border-accent/60 group-hover/canvas:text-accent inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3.5 py-1.5 text-xs font-semibold shadow-xl backdrop-blur-md transition-all duration-200 group-hover/canvas:scale-105">
                            <Maximize2 size={13} className="text-accent" />
                            <span>Expand Diagram</span>
                          </span>
                        </div>
                      </div>

                      {/* Canvas Footer Details: Seamless Operational Insight */}
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

          {/* Mobile Topic Selector (Sleek Glass Dock with Left/Right Buttons) */}
          <div className="flex w-full justify-center lg:hidden">
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
                className="text-text-primary flex size-[44px] min-h-[44px] min-w-[44px] flex-shrink-0 cursor-pointer items-center justify-center transition-opacity disabled:pointer-events-none disabled:opacity-30"
                aria-label="Previous process topic"
              >
                <ChevronLeft size={18} />
              </LiquidGlassButton>

              {/* Center Counter */}
              <span className="font-body flex items-center gap-1 px-1.5 text-xs leading-none tabular-nums select-none">
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
                className="text-text-primary flex size-[44px] min-h-[44px] min-w-[44px] flex-shrink-0 cursor-pointer items-center justify-center transition-opacity disabled:pointer-events-none disabled:opacity-30"
                aria-label="Next process topic"
              >
                <ChevronRight size={18} />
              </LiquidGlassButton>
            </LiquidGlass>
          </div>
        </motion.div>
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
