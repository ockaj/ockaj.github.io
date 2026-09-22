import { memo, useCallback, useEffect, useRef } from "react";
import { InteractiveGlass } from "../LiquidGlass/LiquidGlass";
import { Tabs, Tab } from "../LiquidGlass/LiquidGlassTabs";
import { PROCESS_TOPICS, type ProcessTopic } from "../../data/processItems";
import { cn } from "../../utils/cn";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import ProcessVariantStage from "./ProcessVariantStage";
import { useProcessLibraryContext } from "./ProcessLibraryContext";

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
        "w-full min-w-0 shrink-0 basis-full origin-center snap-center snap-always",
        prefersReducedMotion
          ? "transition-opacity duration-200 ease-out"
          : "transition-slide duration-300 ease-quint-out will-change-slide",
        motionClass,
      )}
    >
      <InteractiveGlass
        as="div"
        roundedClass="rounded-2xl"
        className="size-full flex-col items-stretch justify-start p-5 text-left sm:p-7 md:p-8"
        innerClassName="flex flex-col flex-1 min-h-0"
      >
        {/* Card Header */}
        <div className="relative z-10 mb-3 flex w-full flex-col gap-2.5 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex min-h-0 items-center font-display text-xl leading-snug tracking-tight text-balance text-text-primary sm:min-h-13 sm:text-2xl md:text-3xl">
            {topic.asis.title}
          </h3>

          <div className="shrink-0 self-start sm:self-auto">
            <Tabs
              value={cardViewMode}
              onChange={handleModeChange}
              layoutId={`process-view-mode-pill-mobile-${topic.id}`}
              variant="segmented"
              roundedClass="rounded-xl"
              className="isolate inline-flex h-9 transform-gpu items-center rounded-xl border border-white/10 bg-surface/80 p-1 shadow-md backdrop-blur-md select-none"
              highlightClassName="bg-white/15 border border-white/20 shadow-sm"
            >
              <Tab
                value="asis"
                roundedClass="rounded-lg"
                className="relative flex h-7 cursor-pointer items-center justify-center rounded-lg px-6 text-sm font-medium tracking-wide text-white/80 transition-colors duration-200 select-none before:absolute before:-inset-y-2 before:inset-x-0 hover:text-white focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                activeClassName="font-semibold text-white"
              >
                <span>Source</span>
              </Tab>
              <Tab
                value="tobe"
                roundedClass="rounded-lg"
                className="relative flex h-7 cursor-pointer items-center justify-center rounded-lg px-6 text-sm font-medium tracking-wide text-white/80 transition-colors duration-200 select-none before:absolute before:-inset-y-2 before:inset-x-0 hover:text-white focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                activeClassName="font-semibold text-white"
              >
                <span>Optimized</span>
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
      </InteractiveGlass>
    </div>
  );
});

function ProcessMobileCarousel() {
  const { state, actions } = useProcessLibraryContext();
  const { activeTopicId, viewModes, prefersReducedMotion } = state;
  const { selectTopic, handleTopicViewModeChange, setLightboxItem } = actions;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollEndTimeoutRef = useRef<number | null>(null);
  const isUserScrollingRef = useRef(false);
  const scrollFrameRef = useRef<number | null>(null);
  const fallbackScrollEndTimeoutRef = useRef<number | null>(null);
  const isTouchActiveRef = useRef(false);
  const isInitialMountRef = useRef(true);

  // Smoothly scroll the snap container when activeTopicId changes externally
  useEffect(() => {
    const isInitial = isInitialMountRef.current;
    isInitialMountRef.current = false;

    // Ignore topic changes that were reported internally by carousel scrolling
    if (
      !isInitial &&
      (isProgrammaticScrollRef.current || isUserScrollingRef.current)
    ) {
      return;
    }

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

  // Track the nearest slide during scrolling without reading layout on every raw event.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const supportsScrollEnd = "onscrollend" in window;

    const resetProgrammaticScroll = () => {
      isProgrammaticScrollRef.current = false;
      if (scrollEndTimeoutRef.current !== null) {
        window.clearTimeout(scrollEndTimeoutRef.current);
        scrollEndTimeoutRef.current = null;
      }
    };

    const finishUserScroll = () => {
      if (fallbackScrollEndTimeoutRef.current !== null) {
        window.clearTimeout(fallbackScrollEndTimeoutRef.current);
        fallbackScrollEndTimeoutRef.current = null;
      }
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
      updateActiveTopic();
      isUserScrollingRef.current = false;
    };

    const armFallbackScrollEnd = () => {
      if (supportsScrollEnd) return;
      if (fallbackScrollEndTimeoutRef.current !== null) {
        window.clearTimeout(fallbackScrollEndTimeoutRef.current);
      }
      fallbackScrollEndTimeoutRef.current = window.setTimeout(() => {
        fallbackScrollEndTimeoutRef.current = null;
        if (!isTouchActiveRef.current) finishUserScroll();
      }, 140);
    };

    const updateActiveTopic = () => {
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

      if (closestTopicId !== -1) selectTopic(closestTopicId);
    };

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) return;
      isUserScrollingRef.current = true;
      armFallbackScrollEnd();
      if (scrollFrameRef.current !== null) return;

      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        updateActiveTopic();
      });
    };

    const handleScrollEnd = () => {
      if (isProgrammaticScrollRef.current) {
        resetProgrammaticScroll();
        isUserScrollingRef.current = false;
        return;
      }
      finishUserScroll();
    };

    const handleProgrammaticScrollInterruption = () => {
      resetProgrammaticScroll();
    };

    const handleTouchStart = () => {
      isTouchActiveRef.current = true;
      handleProgrammaticScrollInterruption();
    };

    const handleTouchEnd = () => {
      isTouchActiveRef.current = false;
      if (isUserScrollingRef.current) armFallbackScrollEnd();
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    if (supportsScrollEnd) {
      container.addEventListener("scrollend", handleScrollEnd, {
        passive: true,
      });
    }
    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    container.addEventListener("touchcancel", handleTouchEnd, {
      passive: true,
    });
    container.addEventListener("pointerdown", handleProgrammaticScrollInterruption, {
      passive: true,
    });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (supportsScrollEnd) {
        container.removeEventListener("scrollend", handleScrollEnd);
      }
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
      container.removeEventListener(
        "pointerdown",
        handleProgrammaticScrollInterruption,
      );
      if (scrollEndTimeoutRef.current !== null) {
        window.clearTimeout(scrollEndTimeoutRef.current);
        scrollEndTimeoutRef.current = null;
      }
      if (fallbackScrollEndTimeoutRef.current !== null) {
        window.clearTimeout(fallbackScrollEndTimeoutRef.current);
        fallbackScrollEndTimeoutRef.current = null;
      }
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
  }, [selectTopic]);

  return (
    <div className="col-span-1 flex w-full min-w-0 flex-col justify-center lg:hidden">
      <div className="flex w-full flex-col">
        <div
          ref={containerRef}
          className="-webkit-overflow-scrolling-touch relative -mx-6 flex [touch-action:pan-x_pan-y] snap-x snap-mandatory scrollbar-none gap-4 overflow-x-auto px-9 py-2 sm:-mx-10 sm:gap-6 sm:px-14 [&::-webkit-scrollbar]:hidden"
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
