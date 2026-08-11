import { useState, useEffect, useCallback, memo } from "react";
import {
  motion,
  AnimatePresence,
  Variants,
  useReducedMotion,
} from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
import ProcessDesktopCard from "./ProcessLibrary/ProcessDesktopCard";
import ProcessMobileCarousel from "./ProcessLibrary/ProcessMobileCarousel";

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

  useEffect(() => {
    PROCESS_ITEMS.forEach((item) => {
      prefetchAsset(item.image);
    });
  }, []);

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
      <div className="px-6 md:px-10 lg:px-16">
        <motion.div
          custom={prefersReducedMotion}
          variants={containerVariants}
          initial={isBuildMode ? "visible" : "hidden"}
          whileInView={isBuildMode ? undefined : "visible"}
          viewport={isBuildMode ? undefined : SECTION_VIEWPORT}
          className="relative z-20 grid grid-cols-1 items-stretch gap-8 md:gap-12 lg:grid-cols-12"
        >
          {/* Left Column: Index Menu Selector */}
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

          {/* Mobile Column: Embla Carousel */}
          <ProcessMobileCarousel
            emblaRef={emblaRef}
            viewModes={viewModes}
            handleTopicViewModeChange={handleTopicViewModeChange}
            setLightboxItem={setLightboxItem}
            prefersReducedMotion={prefersReducedMotion}
            direction={direction}
            innerContentVariants={innerContentVariants}
          />

          {/* Desktop Right Column: Display Stage */}
          <ProcessDesktopCard
            activeTopic={activeTopic}
            activeViewMode={activeViewMode}
            activeVariant={activeVariant}
            handleTopicViewModeChange={handleTopicViewModeChange}
            setLightboxItem={setLightboxItem}
            prefersReducedMotion={prefersReducedMotion}
            direction={direction}
            isMobile={isMobile}
            cardVariants={cardVariants}
            tabContentVariants={tabContentVariants}
            innerContentVariants={innerContentVariants}
            tagContainerVariants={tagContainerVariants}
            tagItemVariants={tagItemVariants}
          />

          {/* Mobile Topic Selector Dock */}
          <div className="flex w-full justify-center lg:hidden">
            <LiquidGlass
              as="div"
              roundedClass="rounded-full"
              className="px-2.5 py-2 shadow-lg"
              innerClassName="flex items-center gap-3.5"
            >
              <LiquidGlassButton
                onClick={handlePrevTopic}
                disabled={activeTopicId === PROCESS_TOPICS[0].id}
                roundedClass="rounded-full"
                className="text-text-primary flex size-[44px] min-h-[44px] min-w-[44px] flex-shrink-0 cursor-pointer items-center justify-center transition-opacity disabled:pointer-events-none disabled:opacity-30"
                aria-label="Previous process topic"
              >
                <ChevronLeft size={18} />
              </LiquidGlassButton>

              <span className="font-body flex items-center gap-1 px-1.5 text-xs leading-none tabular-nums select-none">
                <span className="text-accent font-bold">
                  {String(activeTopic.id).padStart(2, "0")}
                </span>
                <span className="text-muted/40 font-medium">/</span>
                <span className="text-muted/60 font-medium">
                  {String(PROCESS_TOPICS.length).padStart(2, "0")}
                </span>
              </span>

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
