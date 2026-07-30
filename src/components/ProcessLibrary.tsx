import { useState, useEffect, useCallback, memo, useRef } from "react";
import {
  motion,
  AnimatePresence,
  Variants,
  useReducedMotion,
} from "motion/react";
import {
  Expand,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { PROCESS_TOPICS, PROCESS_ITEMS } from "../data/processItems";
import { LiquidGlass, LiquidGlassButton } from "./LiquidGlass/LiquidGlass";
import { Tabs, Tab } from "./LiquidGlass/LiquidGlassTabs";
import ProcessLightbox from "./ProcessLightbox/ProcessLightbox";
import { prefetchAsset } from "../utils/quicklink";
import { cn } from "../utils/cn";
import { SPRING } from "../utils/springConfig";

interface CustomAnimationProps {
  prefersReducedMotion: boolean;
  direction: number;
}

const tabContentVariants: Variants = {
  hidden: (custom: unknown) => {
    const props = custom as CustomAnimationProps | undefined;
    const prefersReducedMotion = props?.prefersReducedMotion ?? false;
    const direction = props?.direction ?? 1;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
    return {
      opacity: 0,
      x: prefersReducedMotion ? 0 : isMobile ? 30 * direction : 0,
      y: prefersReducedMotion ? 0 : isMobile ? 0 : 15,
      scale: prefersReducedMotion ? 1 : 0.98,
      transition: SPRING.exit,
    };
  },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: SPRING.modal,
  },
  exit: (custom: unknown) => {
    const props = custom as CustomAnimationProps | undefined;
    const prefersReducedMotion = props?.prefersReducedMotion ?? false;
    const direction = props?.direction ?? 1;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
    return {
      opacity: 0,
      x: prefersReducedMotion ? 0 : isMobile ? -30 * direction : 0,
      y: prefersReducedMotion ? 0 : isMobile ? 0 : 15,
      scale: prefersReducedMotion ? 1 : 0.98,
      transition: SPRING.exit,
    };
  },
};

const innerContentVariants: Variants = {
  hidden: (custom: unknown) => {
    const props = custom as CustomAnimationProps | undefined;
    const prefersReducedMotion = props?.prefersReducedMotion ?? false;
    const direction = props?.direction ?? 1;
    return {
      opacity: 0,
      x: prefersReducedMotion ? 0 : 12 * direction,
      transition: { duration: 0.15, ease: "easeOut" },
    };
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: (custom: unknown) => {
    const props = custom as CustomAnimationProps | undefined;
    const prefersReducedMotion = props?.prefersReducedMotion ?? false;
    const direction = props?.direction ?? 1;
    return {
      opacity: 0,
      x: prefersReducedMotion ? 0 : -12 * direction,
      transition: { duration: 0.15, ease: "easeIn" },
    };
  },
};

const TOPIC_INDEX_MAP = new Map(
  PROCESS_TOPICS.map((topic, index) => [topic.id, index]),
);

function ProcessLibrary() {
  const prefersReducedMotion = useReducedMotion();
  const dotsContainerWidth = 16 + (PROCESS_TOPICS.length - 1) * 12;
  const [activeTopicId, setActiveTopicId] = useState(PROCESS_TOPICS[0].id);
  const [viewMode, setViewMode] = useState<"tobe" | "asis">("asis");
  const [lightboxItem, setLightboxItem] = useState<
    (typeof PROCESS_ITEMS)[0] | null
  >(null);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);

  const [direction, setDirection] = useState(1);

  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const [isTopVisible, setIsTopVisible] = useState(true);
  const [isBottomVisible, setIsBottomVisible] = useState(true);

  const hasScroll = !(isTopVisible && isBottomVisible);
  const showScrollUp = !isTopVisible;
  const showScrollDown = !isBottomVisible;

  const activeTopic =
    PROCESS_TOPICS.find((t) => t.id === activeTopicId) || PROCESS_TOPICS[0];
  const activeVariant = activeTopic[viewMode];

  const activeItem =
    PROCESS_ITEMS.find(
      (item) =>
        item.title === activeVariant.title ||
        item.image === activeVariant.image,
    ) || PROCESS_ITEMS[0];

  // Schedule low-priority background preloading for all diagram SVGs via Quicklink on mount
  useEffect(() => {
    PROCESS_ITEMS.forEach((item) => {
      prefetchAsset(item.image);
    });
  }, []);

  const handleTopicChange = useCallback(
    (id: number) => {
      const newIdx = TOPIC_INDEX_MAP.get(id);
      const oldIdx = TOPIC_INDEX_MAP.get(activeTopicId);
      if (newIdx !== undefined && oldIdx !== undefined && newIdx !== oldIdx) {
        const nextTopic = PROCESS_TOPICS[newIdx];
        prefetchAsset(nextTopic.tobe.image);
        prefetchAsset(nextTopic.asis.image);
        setDirection(newIdx > oldIdx ? 1 : -1);
        setActiveTopicId(id);
        setViewMode("asis");
      }
    },
    [activeTopicId],
  );

  const handleViewModeChange = useCallback(
    (mode: "tobe" | "asis") => {
      if (mode !== viewMode) {
        setDirection(mode === "tobe" ? 1 : -1);
        setViewMode(mode);
      }
    },
    [viewMode],
  );

  const handlePrevTopic = useCallback(() => {
    const currentIndex = TOPIC_INDEX_MAP.get(activeTopicId) ?? -1;
    if (currentIndex > 0) {
      const prevTopic = PROCESS_TOPICS[currentIndex - 1];
      prefetchAsset(prevTopic.tobe.image);
      setDirection(-1);
      setActiveTopicId(prevTopic.id);
      setViewMode("asis");
    }
  }, [activeTopicId]);

  const handleNextTopic = useCallback(() => {
    const currentIndex = TOPIC_INDEX_MAP.get(activeTopicId) ?? -1;
    if (currentIndex >= 0 && currentIndex < PROCESS_TOPICS.length - 1) {
      const nextTopic = PROCESS_TOPICS[currentIndex + 1];
      prefetchAsset(nextTopic.tobe.image);
      setDirection(1);
      setActiveTopicId(nextTopic.id);
      setViewMode("asis");
    }
  }, [activeTopicId]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchEndRef.current = null;
    touchStartRef.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndRef.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback(() => {
    const touchStart = touchStartRef.current;
    const touchEnd = touchEndRef.current;
    if (!touchStart || !touchEnd) return;

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    const minSwipeDistance = 50;

    if (
      Math.abs(deltaX) > Math.abs(deltaY) &&
      Math.abs(deltaX) > minSwipeDistance
    ) {
      if (deltaX > 0) {
        handleNextTopic();
      } else {
        handlePrevTopic();
      }
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
  }, [handleNextTopic, handlePrevTopic]);

  useEffect(() => {
    const container = scrollWrapperRef.current;
    const top = topSentinelRef.current;
    const bottom = bottomSentinelRef.current;

    if (!container || !top || !bottom) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === top) {
            setIsTopVisible(entry.isIntersecting);
          } else if (entry.target === bottom) {
            setIsBottomVisible(entry.isIntersecting);
          }
        });
      },
      {
        root: container,
        threshold: 0.1,
      },
    );

    observer.observe(top);
    observer.observe(bottom);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Interactive Split Dashboard */}
      <div className="px-6 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-stretch relative z-20">
          {/* Left Column: Index Menu Selector (3 Core Process Topics) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-center w-full">
            <div className="relative w-full">
              {/* Scroll wrapper */}
              <div
                ref={scrollWrapperRef}
                className="-mx-6 px-6 md:-mx-10 md:px-10 lg:-mx-4 lg:px-4 overflow-x-auto lg:overflow-y-auto lg:overflow-x-hidden lg:max-h-[540px] py-2 lg:py-10 no-scrollbar process-tabs-mask overscroll-contain"
              >
                <div
                  ref={topSentinelRef}
                  className="h-px w-full pointer-events-none"
                />
                <Tabs
                  value={activeTopicId}
                  onChange={handleTopicChange}
                  layoutId="active-process-highlight"
                  squircle
                  roundedClass="rounded-2xl"
                  className="flex flex-row lg:flex-col gap-2 justify-start lg:justify-center w-max lg:w-full"
                >
                  {PROCESS_TOPICS.map((topic, idx) => (
                    <Tab
                      key={topic.id}
                      value={topic.id}
                      onMouseEnter={() => {
                        prefetchAsset(topic.tobe.image);
                        prefetchAsset(topic.asis.image);
                      }}
                      onFocus={() => {
                        prefetchAsset(topic.tobe.image);
                        prefetchAsset(topic.asis.image);
                      }}
                      aria-controls={`tabpanel-${topic.id}`}
                      className={cn(
                        "w-auto lg:w-full text-left relative px-5 py-3.5 lg:px-8 lg:py-5 rounded-2xl flex-shrink-0 transition-colors duration-300 flex items-center gap-3 lg:gap-4 select-none cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-inset",
                        activeTopicId === topic.id
                          ? "text-text-primary"
                          : "text-muted hover:text-text-primary",
                      )}
                    >
                      {/* Badge Index */}
                      <span
                        className={cn(
                          "relative z-10 text-xs font-body tabular-nums min-w-[20px] transition-colors duration-300",
                          activeTopicId === topic.id
                            ? "font-bold text-accent"
                            : "font-semibold text-accent/80",
                        )}
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </span>

                      {/* Metadata */}
                      <div className="relative z-10">
                        <span className="block text-base font-semibold font-body transition-transform duration-300 group-hover:translate-x-1 whitespace-nowrap lg:whitespace-normal lg:text-balance line-clamp-1 lg:line-clamp-2">
                          {topic.title}
                        </span>
                        <p className="text-xs text-muted uppercase mt-0.5 transition-transform duration-300 group-hover:translate-x-1">
                          {topic.category}
                        </p>
                      </div>
                    </Tab>
                  ))}
                </Tabs>
                <div
                  ref={bottomSentinelRef}
                  className="h-px w-full pointer-events-none"
                />
              </div>

              {/* Top Scroll Indicator */}
              <div
                className="absolute -top-8 left-1/2 pointer-events-none z-30 shadow-lg transition-opacity duration-300"
                style={{
                  opacity: hasScroll ? (showScrollUp ? 1.0 : 0.2) : 0,
                  transform: "translate(-50%, 0)",
                }}
              >
                <LiquidGlass
                  as="div"
                  roundedClass="rounded-full"
                  interactive={false}
                  className="p-2"
                >
                  <ChevronUp size={14} className="text-text-primary" />
                </LiquidGlass>
              </div>

              {/* Bottom Scroll Indicator */}
              <div
                className="absolute -bottom-8 left-1/2 pointer-events-none z-30 shadow-lg transition-opacity duration-300"
                style={{
                  opacity: hasScroll ? (showScrollDown ? 1.0 : 0.2) : 0,
                  transform: "translate(-50%, 0)",
                }}
              >
                <LiquidGlass
                  as="div"
                  roundedClass="rounded-full"
                  interactive={false}
                  className="p-2"
                >
                  <ChevronDown size={14} className="text-text-primary" />
                </LiquidGlass>
              </div>
            </div>
          </div>

          {/* Right Column: Display Stage & Blueprint Canvas */}
          <div className="lg:col-span-7 flex flex-col justify-center w-full min-w-0">
            {/* Outer AnimatePresence: Original full card animation when switching TOPICS */}
            <AnimatePresence
              mode="wait"
              initial={false}
              custom={{ prefersReducedMotion, direction }}
            >
              <motion.div
                key={activeTopic.id}
                id={`tabpanel-${activeTopic.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${activeTopic.id}`}
                custom={{ prefersReducedMotion, direction }}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={tabContentVariants}
                className="w-full h-full flex flex-col"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <LiquidGlass
                  as="div"
                  roundedClass="rounded-2xl"
                  className="w-full h-full p-6 md:p-8 flex-col text-left justify-start items-stretch touch-pan-y"
                  tilt
                >
                  {/* Canvas Header (Title & Mode Switcher) */}
                  <div className="flex items-center justify-between gap-4 mb-6 relative z-10 w-full">
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-display text-text-primary text-balance leading-tight">
                        {activeVariant.title}
                      </h3>
                    </div>

                    {/* Segmented Mode Switcher */}
                    <Tabs
                      value={viewMode}
                      onChange={(val) =>
                        handleViewModeChange(val as "tobe" | "asis")
                      }
                      layoutId={`process-view-mode-pill-${activeTopic.id}`}
                      roundedClass="rounded-xl"
                      highlightStyle={
                        { "--base-radius": "12px" } as React.CSSProperties
                      }
                      className="self-start flex-shrink-0 rounded-2xl border border-white/10 bg-surface/50 p-1 backdrop-blur-md"
                      highlightClassName="bg-white/15 border border-white/20 shadow-md"
                    >
                      <Tab
                        value="asis"
                        className={cn(
                          "h-9 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors duration-200 cursor-pointer select-none flex items-center justify-center",
                          viewMode === "asis"
                            ? "text-text-primary font-bold"
                            : "text-muted/70 hover:text-text-primary",
                        )}
                      >
                        SOURCE
                      </Tab>
                      <Tab
                        value="tobe"
                        className={cn(
                          "h-9 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors duration-200 cursor-pointer select-none flex items-center justify-center",
                          viewMode === "tobe"
                            ? "text-text-primary font-bold"
                            : "text-muted/70 hover:text-text-primary",
                        )}
                      >
                        OPTIMIZED
                      </Tab>
                    </Tabs>
                  </div>

                  {/* Inner AnimatePresence: Subtle 200ms diagram micro-crossfade when switching MODE (TO-BE vs AS-IS) */}
                  <AnimatePresence
                    mode="wait"
                    initial={false}
                    custom={{ prefersReducedMotion, direction }}
                  >
                    <motion.div
                      key={viewMode}
                      custom={{ prefersReducedMotion, direction }}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={innerContentVariants}
                      className="w-full flex-1 flex flex-col justify-between"
                    >
                      {/* Adaptable Grid Canvas Board */}
                      <button
                        type="button"
                        className="relative w-full aspect-[16/10] rounded-lg overflow-hidden border border-white/10 flex items-center justify-center p-0 mb-6 select-none cursor-zoom-in group/canvas z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        onClick={() => setLightboxItem(activeItem)}
                        aria-label={`Zoom diagram: ${activeVariant.title}`}
                        style={{
                          background: `radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px) 0 0 / 20px 20px, #0f0f14`,
                          boxShadow: `inset 0 0 30px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)`,
                        }}
                      >
                        {/* Technical Blueprint Corner Target Marks */}
                        <div className="absolute top-2 left-2 size-2 border-t border-l border-white/20 pointer-events-none" />
                        <div className="absolute top-2 right-2 size-2 border-t border-r border-white/20 pointer-events-none" />
                        <div className="absolute bottom-2 left-2 size-2 border-b border-l border-white/20 pointer-events-none" />
                        <div className="absolute bottom-2 right-2 size-2 border-b border-r border-white/20 pointer-events-none" />

                        <img
                          src={activeVariant.image}
                          alt={activeVariant.title}
                          width={800}
                          height={500}
                          className="w-full h-full object-contain rounded-lg p-6 transition-transform duration-300 ease-out group-hover/canvas:scale-102"
                          loading="lazy"
                        />

                        {/* Glass glare overlay */}
                        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03)_0%,transparent_60%)]" />

                        {/* Permanent expand affordance */}
                        <div className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 bg-accent/20 border border-accent/30 rounded-xl px-2.5 py-1 pointer-events-none">
                          <Expand size={13} className="text-accent" />
                          <span className="text-[10px] text-accent uppercase font-bold tracking-wider">
                            Expand
                          </span>
                        </div>
                      </button>

                      {/* Canvas Footer Details */}
                      <div className="relative z-10 mt-auto h-auto">
                        <p className="text-xs text-muted uppercase font-semibold mb-2">
                          Operational Insight
                        </p>
                        <p className="text-sm text-text-primary/80 leading-relaxed text-pretty min-h-[6.5em]">
                          {activeVariant.description}
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </LiquidGlass>
              </motion.div>
            </AnimatePresence>

            {/* Mobile Pagination Indicator Bar with Integrated Arrow Switchers */}
            <LiquidGlass
              as="div"
              roundedClass="rounded-full"
              interactive={false}
              className="lg:hidden mt-4 w-fit mx-auto select-none"
              innerClassName="flex items-center justify-center gap-2.5 py-2 px-1.5"
            >
              {/* Prev Button */}
              <LiquidGlassButton
                onClick={handlePrevTopic}
                disabled={activeTopicId === PROCESS_TOPICS[0].id}
                className="size-11 flex items-center justify-center text-text-primary disabled:opacity-20 disabled:pointer-events-none hover:bg-white/5"
                roundedClass="rounded-full"
                ariaLabel="Previous process topic"
              >
                <ChevronLeft size={16} className="text-text-primary" />
              </LiquidGlassButton>

              <div className="flex items-center gap-3.5 px-2">
                <span className="text-xs tracking-[0.2em] uppercase text-muted/40 font-bold font-body">
                  Explore
                </span>
                <div
                  className="flex gap-1.5 items-center flex-shrink-0"
                  style={{ width: `${dotsContainerWidth}px` }}
                >
                  {PROCESS_TOPICS.map((topic, idx) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => handleTopicChange(topic.id)}
                      aria-label={`Go to topic ${idx + 1}`}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
                        activeTopicId === topic.id
                          ? "bg-accent w-4 opacity-100"
                          : "bg-white/20 w-1.5 opacity-50 hover:bg-white/40",
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Next Button */}
              <LiquidGlassButton
                onClick={handleNextTopic}
                disabled={
                  activeTopicId === PROCESS_TOPICS[PROCESS_TOPICS.length - 1].id
                }
                className="size-11 flex items-center justify-center text-text-primary disabled:opacity-20 disabled:pointer-events-none hover:bg-white/5"
                roundedClass="rounded-full"
                ariaLabel="Next process topic"
              >
                <ChevronRight size={16} className="text-text-primary" />
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
