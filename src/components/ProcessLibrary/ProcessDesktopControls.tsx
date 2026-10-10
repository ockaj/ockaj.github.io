import {
  memo,
  useRef,
  useCallback,
  useLayoutEffect,
  useState,
  useMemo,
} from "react";
import { Tabs, Tab } from "../LiquidGlass/LiquidGlassTabs";
import { LiquidGlassButton } from "../LiquidGlass/LiquidGlass";
import { ChevronDown } from "lucide-react";
import { PROCESS_TOPICS } from "../../data/processItems";
import { cn } from "../../utils/cn";
import {
  useProcessLibraryState,
  useProcessLibraryActions,
} from "./ProcessLibraryContext";
import { useResizeObserver } from "../../hooks/useResizeObserver";

const PAGE_SIZE = 10;

function ProcessDesktopControls() {
  const { activeTopicId } = useProcessLibraryState();
  const { selectTopic } = useProcessLibraryActions();
  const containerRef = useRef<HTMLDivElement>(null);

  const activeIndex = useMemo(
    () => PROCESS_TOPICS.findIndex((t) => t.id === activeTopicId),
    [activeTopicId],
  );

  const [visibleCount, setVisibleCount] = useState(() =>
    Math.max(PAGE_SIZE, activeIndex + 1),
  );

  const effectiveVisibleCount = Math.max(visibleCount, activeIndex + 1);

  const visibleTopics = useMemo(
    () => PROCESS_TOPICS.slice(0, effectiveVisibleCount),
    [effectiveVisibleCount],
  );

  const hasMore = effectiveVisibleCount < PROCESS_TOPICS.length;

  const handleShowMore = useCallback(() => {
    setVisibleCount((prev) =>
      Math.min(
        Math.max(prev, activeIndex + 1) + PAGE_SIZE,
        PROCESS_TOPICS.length,
      ),
    );
  }, [activeIndex]);

  const checkOverflow = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const overflowing = el.scrollHeight > el.clientHeight;
    const nextValue = overflowing ? "true" : "false";
    if (el.dataset.overflow !== nextValue) {
      el.dataset.overflow = nextValue;
    }
  }, []);

  useLayoutEffect(() => {
    checkOverflow();
  }, [checkOverflow]);

  useResizeObserver(containerRef, checkOverflow);

  return (
    <div className="flex w-full flex-col justify-center lg:col-span-5">
      <div className="relative w-full">
        <div
          ref={containerRef}
          className="no-scrollbar process-tabs-mask -mx-4 max-h-140 overflow-y-auto px-4 py-6"
        >
          <Tabs
            value={activeTopicId}
            onChange={selectTopic}
            layoutId="active-process-highlight"
            variant="segmented"
            roundedClass="rounded-2xl"
            highlightClassName="navbar-highlight-flat"
            className="flex w-full flex-col justify-center gap-2.5"
          >
            {visibleTopics.map((topic, idx) => {
              const isActive = activeTopicId === topic.id;
              return (
                <Tab
                  key={topic.id}
                  value={topic.id}
                  aria-controls={`tabpanel-${topic.id}`}
                  className={cn(
                    "group relative flex w-full cursor-pointer items-center gap-3.5 rounded-2xl px-7 py-4.5 text-left transition-colors duration-300 select-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none focus-visible:ring-inset",
                    isActive
                      ? "font-medium text-text-primary"
                      : "text-muted hover:text-text-primary",
                  )}
                >
                  <span
                    className={cn(
                      "relative z-10 min-w-5 font-body text-sm tabular-nums transition-colors duration-300",
                      isActive
                        ? "font-bold text-accent"
                        : "font-medium text-muted/60 group-hover:text-muted",
                    )}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  <div className="relative z-10">
                    <span className="process-tab-label block font-body text-base font-semibold text-balance whitespace-normal transition-transform duration-300">
                      {topic.title}
                    </span>
                    <p className="process-tab-label mt-0.5 text-sm text-muted/90 tabular-nums transition-transform duration-300">
                      {topic.metrics ?? topic.category}
                    </p>
                  </div>
                </Tab>
              );
            })}
          </Tabs>

          {hasMore ? (
            <div className="flex justify-center pt-3">
              <LiquidGlassButton
                type="button"
                onClick={handleShowMore}
                roundedClass="rounded-full"
                className="group/more-btn flex min-h-10 cursor-pointer items-center justify-center px-5 py-2.5 text-xs font-semibold whitespace-nowrap text-text-primary shadow-sm transition-colors"
                ariaLabel="Show more process topics"
                magnetic
                tilt
                magneticStrength={0.02}
                specularGlow
              >
                <span className="flex items-center gap-1.5">
                  <span>
                    Show more ({PROCESS_TOPICS.length - effectiveVisibleCount}{" "}
                    remaining)
                  </span>
                  <ChevronDown
                    size={14}
                    aria-hidden="true"
                    className="shrink-0 transition-transform duration-300 ease-out group-hover/more-btn:translate-y-0.5"
                  />
                </span>
              </LiquidGlassButton>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default memo(ProcessDesktopControls);
