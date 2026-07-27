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
import { PROCESS_ITEMS } from "../data/processItems";
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

function ProcessLibrary() {
  const prefersReducedMotion = useReducedMotion();
  const dotsContainerWidth = 16 + (PROCESS_ITEMS.length - 1) * 12;
  const [activeItem, setActiveItem] = useState(PROCESS_ITEMS[0]);
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

  // sliding-window preloading only pre-fetches the two adjacent diagrams (N-1 and N+1) to conserve bandwidth
  useEffect(() => {
    const currentIndex = PROCESS_ITEMS.findIndex(
      (item) => item.id === activeItem.id,
    );
    if (currentIndex === -1) return;

    const adjacentIndices = [currentIndex - 1, currentIndex + 1];
    adjacentIndices.forEach((idx) => {
      if (idx >= 0 && idx < PROCESS_ITEMS.length) {
        prefetchAsset(PROCESS_ITEMS[idx].image);
      }
    });
  }, [activeItem.id]);

  const handleTabChange = useCallback(
    (id: number) => {
      const selected = PROCESS_ITEMS.find((item) => item.id === id);
      if (!selected) return;

      const newIdx = PROCESS_ITEMS.indexOf(selected);
      const oldIdx = PROCESS_ITEMS.findIndex(
        (item) => item.id === activeItem.id,
      );
      setDirection(newIdx > oldIdx ? 1 : -1);
      setActiveItem(selected);
    },
    [activeItem.id],
  );

  const handlePrev = useCallback(() => {
    const currentIndex = PROCESS_ITEMS.findIndex(
      (item) => item.id === activeItem.id,
    );
    if (currentIndex > 0) {
      setDirection(-1);
      setActiveItem(PROCESS_ITEMS[currentIndex - 1]);
    }
  }, [activeItem.id]);

  const handleNext = useCallback(() => {
    const currentIndex = PROCESS_ITEMS.findIndex(
      (item) => item.id === activeItem.id,
    );
    if (currentIndex < PROCESS_ITEMS.length - 1) {
      setDirection(1);
      setActiveItem(PROCESS_ITEMS[currentIndex + 1]);
    }
  }, [activeItem.id]);

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
    const diffX = touchStart.x - touchEnd.x;
    const diffY = touchStart.y - touchEnd.y;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 60) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  }, [handleNext, handlePrev]);

  // Centering active tab on user click
  useEffect(() => {
    if (activeItem.id === PROCESS_ITEMS[0].id) return;
    document.getElementById(`tab-${activeItem.id}`)?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeItem.id]);

  // Set up intersection observer for top/bottom indicators
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
          {/* Left Column: Index Menu Selector */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-center w-full">
            <div className="relative w-full">
              {/* Scroll wrapper: owns overflow and alignment padding on mobile, height restricted and padded on desktop */}
              <div
                ref={scrollWrapperRef}
                className="-mx-6 px-6 md:-mx-10 md:px-10 lg:-mx-4 lg:px-4 overflow-x-auto lg:overflow-y-auto lg:overflow-x-hidden lg:max-h-[540px] py-2 lg:py-10 no-scrollbar process-tabs-mask overscroll-contain"
              >
                <div
                  ref={topSentinelRef}
                  className="h-px w-full pointer-events-none"
                />
                <Tabs
                  value={activeItem.id}
                  onChange={handleTabChange}
                  layoutId="active-process-highlight"
                  squircle
                  roundedClass="rounded-2xl"
                  className="flex flex-row lg:flex-col gap-2 justify-start lg:justify-center w-max lg:w-full"
                >
                  {PROCESS_ITEMS.map((item, idx) => (
                    <Tab
                      key={item.id}
                      value={item.id}
                      onMouseEnter={() => prefetchAsset(item.image)}
                      onFocus={() => prefetchAsset(item.image)}
                      aria-controls={`tabpanel-${item.id}`}
                      className={cn(
                        "w-auto lg:w-full text-left relative px-5 py-3 lg:px-8 lg:py-4 rounded-2xl flex-shrink-0 transition-colors duration-300 flex items-center gap-3 lg:gap-4 select-none cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-inset",
                        activeItem.id === item.id
                          ? "text-text-primary"
                          : "text-muted hover:text-text-primary",
                      )}
                    >
                      {/* Badge Index */}
                      <span
                        className={cn(
                          "relative z-10 text-xs font-body tabular-nums min-w-[20px] transition-colors duration-300",
                          activeItem.id === item.id
                            ? "font-bold text-accent"
                            : "font-semibold text-accent/80",
                        )}
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </span>

                      {/* Metadata */}
                      <div className="relative z-10">
                        <span className="block text-sm font-semibold font-body transition-transform duration-300 group-hover:translate-x-1 whitespace-nowrap lg:whitespace-normal lg:text-balance line-clamp-1 lg:line-clamp-2">
                          {item.title}
                        </span>
                        <p className="text-[9px] text-muted uppercase mt-0.5 transition-transform duration-300 group-hover:translate-x-1">
                          {item.type}
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

          {/* Right Column: Visual Preview Canvas */}
          <div className="lg:col-span-7 flex flex-col justify-center relative min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                role="tabpanel"
                id={`tabpanel-${activeItem.id}`}
                aria-labelledby={`tab-${activeItem.id}`}
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
                  {/* Canvas Header */}
                  <div className="flex items-start justify-between gap-4 mb-6 relative z-10 w-full">
                    <div className="flex-1">
                      <span className="inline-block text-[10px] text-accent uppercase font-bold bg-accent/20 border border-accent/30 rounded-xl px-2.5 py-0.5">
                        {activeItem.type}
                      </span>
                      <h3 className="text-xl md:text-2xl font-display text-text-primary mt-2 text-balance leading-tight min-h-[2.5em]">
                        {activeItem.title}
                      </h3>
                    </div>
                  </div>

                  {/* Adaptable Grid Canvas Board */}
                  <button
                    type="button"
                    className="relative w-full aspect-[16/10] rounded-lg overflow-hidden border border-white/10 flex items-center justify-center p-0 mb-6 select-none cursor-zoom-in group/canvas z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    onClick={() => setLightboxItem(activeItem)}
                    aria-label={`Zoom diagram: ${activeItem.title}`}
                    style={{
                      background: `radial-gradient(circle, hsl(var(--stroke)) 1px, transparent 1px) 0 0 / 16px 16px, hsl(var(--surface))`,
                      boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.4)",
                    }}
                  >
                    <img
                      src={activeItem.image}
                      alt={activeItem.title}
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
                      <span className="text-[10px] text-accent uppercase font-bold">
                        Expand
                      </span>
                    </div>
                  </button>

                  {/* Canvas Footer Details */}
                  <div className="relative z-10 mt-auto h-auto">
                    <p className="text-[10px] text-muted uppercase font-semibold mb-2">
                      Operational Insight
                    </p>
                    <p className="text-sm text-text-primary/80 leading-relaxed text-pretty min-h-[6.5em]">
                      {activeItem.description}
                    </p>
                  </div>
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
                onClick={handlePrev}
                disabled={activeItem.id === PROCESS_ITEMS[0].id}
                className="size-11 flex items-center justify-center text-text-primary disabled:opacity-20 disabled:pointer-events-none hover:bg-white/5"
                roundedClass="rounded-full"
                ariaLabel="Previous diagram"
              >
                <ChevronLeft size={16} className="text-text-primary" />
              </LiquidGlassButton>

              <div className="flex items-center gap-3.5 px-2">
                <span className="text-[9px] tracking-[0.2em] uppercase text-muted/40 font-bold font-body">
                  Explore
                </span>
                <div
                  className="flex gap-1.5 items-center flex-shrink-0"
                  style={{ width: `${dotsContainerWidth}px` }}
                >
                  {PROCESS_ITEMS.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTabChange(item.id)}
                      aria-label={`Go to process ${idx + 1}`}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
                        activeItem.id === item.id
                          ? "bg-accent w-4 opacity-100"
                          : "bg-white/20 w-1.5 opacity-50 hover:bg-white/40",
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Next Button */}
              <LiquidGlassButton
                onClick={handleNext}
                disabled={
                  activeItem.id === PROCESS_ITEMS[PROCESS_ITEMS.length - 1].id
                }
                className="size-11 flex items-center justify-center text-text-primary disabled:opacity-20 disabled:pointer-events-none hover:bg-white/5"
                roundedClass="rounded-full"
                ariaLabel="Next diagram"
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
