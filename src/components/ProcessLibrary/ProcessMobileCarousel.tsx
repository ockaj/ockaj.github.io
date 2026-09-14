import {
  memo,
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
} from "react";
import { LiquidGlass } from "../LiquidGlass/LiquidGlass";
import { Tabs, Tab } from "../LiquidGlass/LiquidGlassTabs";
import { PROCESS_TOPICS, type ProcessTopic } from "../../data/processItems";
import { cn } from "../../utils/cn";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import ProcessVariantStage from "./ProcessVariantStage";

const MOBILE_HIGHLIGHT_STYLE: CSSProperties = {
  "--base-radius": "10px",
} as CSSProperties;

interface ProcessMobileSlideProps {
  topic: ProcessTopic;
  idx: number;
  isActive: boolean;
  prefersReducedMotion: boolean | null;
  cardViewMode: "tobe" | "asis";
  onViewModeChange: (topicId: number, mode: "tobe" | "asis") => void;
  setLightboxItem: (item: {
    id: number;
    title: string;
    description: string;
    image: string;
    type: string;
  }) => void;
}

const ProcessMobileSlide = memo(function ProcessMobileSlide({
  topic,
  idx,
  isActive,
  prefersReducedMotion,
  cardViewMode,
  onViewModeChange,
  setLightboxItem,
}: Readonly<ProcessMobileSlideProps>) {
  const handleModeChange = useCallback(
    (val: string | number) => {
      onViewModeChange(topic.id, val as "tobe" | "asis");
    },
    [onViewModeChange, topic.id],
  );

  let motionClass = "opacity-100 [transform:scale(1)]";
  if (!isActive) {
    motionClass = "opacity-65";
    if (!prefersReducedMotion) {
      motionClass = "opacity-65 [transform:scale(0.96)]";
    }
  }

  return (
    <div
      data-topic-id={topic.id}
      data-no-skeleton={idx > 0 ? "" : undefined}
      className={cn(
        "w-full min-w-0 flex-[0_0_100%] origin-center snap-center [scroll-snap-stop:always]",
        prefersReducedMotion
          ? "transition-opacity duration-200 ease-out"
          : "transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-[transform,opacity]",
        motionClass,
      )}
    >
      <LiquidGlass
        as="div"
        roundedClass="rounded-2xl"
        className="h-full w-full flex-col items-stretch justify-start p-5 text-left sm:p-7 md:p-8"
        innerClassName="flex flex-col flex-1 min-h-0"
      >
        {/* Card Header */}
        <div className="relative z-10 mb-3 flex w-full flex-col gap-2.5 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-display text-text-primary flex min-h-0 items-center text-xl leading-snug tracking-tight text-balance sm:min-h-[3.25rem] sm:text-2xl md:text-3xl">
            {topic.asis.title}
          </h3>

          <div className="w-full shrink-0 sm:w-auto">
            <Tabs
              value={cardViewMode}
              onChange={handleModeChange}
              layoutId={`process-view-mode-pill-mobile-${topic.id}`}
              roundedClass="rounded-xl"
              highlightStyle={MOBILE_HIGHLIGHT_STYLE}
              className="bg-surface/80 isolate inline-flex h-10 w-full [transform:translateZ(0)] items-center rounded-xl border border-white/10 p-1 shadow-md backdrop-blur-md select-none sm:w-auto"
              highlightClassName="bg-white/15 border border-white/20 shadow-sm"
            >
              <Tab
                value="asis"
                className="focus-visible:ring-accent flex h-8 flex-1 cursor-pointer items-center justify-center rounded-lg px-3.5 text-xs font-semibold tracking-wider text-white/70 uppercase transition-colors duration-200 select-none hover:text-white focus-visible:ring-2 focus-visible:outline-none sm:flex-initial"
                activeClassName="font-bold text-white"
              >
                <span>SOURCE</span>
              </Tab>
              <Tab
                value="tobe"
                className="focus-visible:ring-accent flex h-8 flex-1 cursor-pointer items-center justify-center rounded-lg px-3.5 text-xs font-semibold tracking-wider text-white/70 uppercase transition-colors duration-200 select-none hover:text-white focus-visible:ring-2 focus-visible:outline-none sm:flex-initial"
                activeClassName="font-bold text-white"
              >
                <span>OPTIMIZED</span>
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
          badges={false}
        />
      </LiquidGlass>
    </div>
  );
});

interface ProcessMobileCarouselProps {
  activeTopicId: number;
  onTopicChange: (topicId: number) => void;
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

function ProcessMobileCarousel({
  activeTopicId,
  onTopicChange,
  viewModes,
  handleTopicViewModeChange,
  setLightboxItem,
  prefersReducedMotion,
}: Readonly<ProcessMobileCarouselProps>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollEndTimeoutRef = useRef<number | null>(null);
  const isInitialMountRef = useRef(true);
  const lastReportedTopicIdRef = useRef<number>(activeTopicId);

  // Smoothly scroll the snap container when activeTopicId changes externally
  useEffect(() => {
    const isInitial = isInitialMountRef.current;
    isInitialMountRef.current = false;

    // Ignore topic changes that were reported internally by carousel scrolling
    if (!isInitial && lastReportedTopicIdRef.current === activeTopicId) {
      return;
    }
    lastReportedTopicIdRef.current = activeTopicId;

    const container = containerRef.current;
    if (!container) return;

    const targetSlide = container.querySelector<HTMLElement>(
      `[data-topic-id="${activeTopicId}"]`,
    );
    if (!targetSlide) return;

    const targetOffset = Math.max(
      0,
      targetSlide.offsetLeft -
        (container.clientWidth - targetSlide.offsetWidth) / 2,
    );

    if (Math.abs(container.scrollLeft - targetOffset) <= 2) {
      return;
    }

    isProgrammaticScrollRef.current = true;
    container.scrollTo({
      left: targetOffset,
      behavior: isInitial || prefersReducedMotion ? "instant" : "smooth",
    });

    if (scrollEndTimeoutRef.current !== null) {
      window.clearTimeout(scrollEndTimeoutRef.current);
    }
    scrollEndTimeoutRef.current = window.setTimeout(
      () => {
        isProgrammaticScrollRef.current = false;
        scrollEndTimeoutRef.current = null;
      },
      isInitial ? 50 : 500,
    );
  }, [activeTopicId, prefersReducedMotion]);

  // Re-align active topic when container width changes (e.g. window resize or becoming visible)
  useResizeObserver(containerRef, (entry) => {
    if (entry.contentRect.width <= 0) return;
    const container = containerRef.current;
    if (!container) return;

    const targetSlide = container.querySelector<HTMLElement>(
      `[data-topic-id="${activeTopicId}"]`,
    );
    if (!targetSlide) return;

    const targetOffset = Math.max(
      0,
      targetSlide.offsetLeft -
        (container.clientWidth - targetSlide.offsetWidth) / 2,
    );

    if (Math.abs(container.scrollLeft - targetOffset) > 2) {
      container.scrollTo({
        left: targetOffset,
        behavior: "instant",
      });
    }
  });

  // Handle user interaction and scrollend events to release scroll lock and sync centered slide
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resetScrollLock = () => {
      isProgrammaticScrollRef.current = false;
      if (scrollEndTimeoutRef.current !== null) {
        window.clearTimeout(scrollEndTimeoutRef.current);
        scrollEndTimeoutRef.current = null;
      }
    };

    const handleScrollEnd = () => {
      resetScrollLock();

      // Ensure active slide is in sync after momentum scroll settles
      const containerRect = container.getBoundingClientRect();
      if (containerRect.width === 0) return;
      const containerCenter = containerRect.left + containerRect.width / 2;

      let closestTopicId = -1;
      let minDistance = Infinity;
      const slides = container.querySelectorAll<HTMLElement>("[data-topic-id]");
      slides.forEach((slide) => {
        const slideRect = slide.getBoundingClientRect();
        const slideCenter = slideRect.left + slideRect.width / 2;
        const dist = Math.abs(slideCenter - containerCenter);
        if (dist < minDistance) {
          minDistance = dist;
          const id = Number(slide.dataset.topicId);
          if (!Number.isNaN(id)) closestTopicId = id;
        }
      });

      if (
        closestTopicId !== -1 &&
        closestTopicId !== lastReportedTopicIdRef.current
      ) {
        lastReportedTopicIdRef.current = closestTopicId;
        onTopicChange(closestTopicId);
      }
    };

    container.addEventListener("scrollend", handleScrollEnd, { passive: true });
    container.addEventListener("touchstart", resetScrollLock, {
      passive: true,
    });
    container.addEventListener("pointerdown", resetScrollLock, {
      passive: true,
    });

    return () => {
      container.removeEventListener("scrollend", handleScrollEnd);
      container.removeEventListener("touchstart", resetScrollLock);
      container.removeEventListener("pointerdown", resetScrollLock);
      if (scrollEndTimeoutRef.current !== null) {
        window.clearTimeout(scrollEndTimeoutRef.current);
        scrollEndTimeoutRef.current = null;
      }
    };
  }, [onTopicChange]);

  // Detect when a slide snaps into center view and notify parent
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) return;

        let bestEntry: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            if (
              !bestEntry ||
              entry.intersectionRatio > bestEntry.intersectionRatio
            ) {
              bestEntry = entry;
            }
          }
        }

        if (bestEntry) {
          const topicIdStr = (bestEntry.target as HTMLElement).dataset.topicId;
          if (topicIdStr) {
            const topicId = Number(topicIdStr);
            if (
              !Number.isNaN(topicId) &&
              topicId !== lastReportedTopicIdRef.current
            ) {
              lastReportedTopicIdRef.current = topicId;
              onTopicChange(topicId);
            }
          }
        }
      },
      {
        root: container,
        threshold: [0.5, 0.65, 0.75],
      },
    );

    const slides = container.querySelectorAll<HTMLElement>("[data-topic-id]");
    slides.forEach((slide) => observer.observe(slide));

    return () => {
      observer.disconnect();
    };
  }, [onTopicChange]);

  return (
    <div className="col-span-1 flex w-full min-w-0 flex-col justify-center lg:hidden">
      <div className="flex w-full flex-col">
        <div
          ref={containerRef}
          className="-webkit-overflow-scrolling-touch relative -mx-6 flex [touch-action:pan-x_pan-y] snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto px-9 py-2 sm:-mx-10 sm:gap-6 sm:px-14 [&::-webkit-scrollbar]:hidden"
        >
          {PROCESS_TOPICS.map((topic, idx) => (
            <ProcessMobileSlide
              key={topic.id}
              topic={topic}
              idx={idx}
              isActive={topic.id === activeTopicId}
              cardViewMode={viewModes[topic.id] || "asis"}
              onViewModeChange={handleTopicViewModeChange}
              setLightboxItem={setLightboxItem}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(ProcessMobileCarousel);
