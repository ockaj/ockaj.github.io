import { memo, useEffect, useRef } from "react";
import { InteractiveGlass } from "../LiquidGlass/LiquidGlass";
import { PROCESS_TOPICS, type ProcessTopic } from "../../data/processItems";
import { cn } from "../../utils/cn";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import ProcessCardHeader from "./ProcessCardHeader";
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
        <ProcessCardHeader
          topicId={topic.id}
          title={topic.asis.title}
          viewMode={cardViewMode}
          onViewModeChange={onViewModeChange}
          isMobile
        />

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

    const resetProgrammaticScroll = () => {
      isProgrammaticScrollRef.current = false;
      if (scrollEndTimeoutRef.current !== null) {
        window.clearTimeout(scrollEndTimeoutRef.current);
        scrollEndTimeoutRef.current = null;
      }
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
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
      updateActiveTopic();
      isUserScrollingRef.current = false;
    };

    const handleProgrammaticScrollInterruption = () => {
      resetProgrammaticScroll();
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    container.addEventListener("scrollend", handleScrollEnd, { passive: true });
    container.addEventListener("pointerdown", handleProgrammaticScrollInterruption, {
      passive: true,
    });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("scrollend", handleScrollEnd);
      container.removeEventListener(
        "pointerdown",
        handleProgrammaticScrollInterruption,
      );
      if (scrollEndTimeoutRef.current !== null) {
        window.clearTimeout(scrollEndTimeoutRef.current);
        scrollEndTimeoutRef.current = null;
      }
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
  }, [selectTopic]);

  return (
    <div className="col-span-1 flex w-full min-w-0 flex-col justify-center">
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
