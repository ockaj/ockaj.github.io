import { memo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles, Maximize2 } from "lucide-react";
import { SPRING } from "../../utils/springConfig";
import { cn } from "../../utils/cn";
import { type ProcessTopic } from "../../data/processItems";

type ProcessVariant = ProcessTopic["asis"];

interface ProcessVariantStageProps {
  topic: ProcessTopic;
  activeViewMode: "tobe" | "asis";
  setLightboxItem: (item: {
    id: number;
    title: string;
    description: string;
    image: string;
    type: string;
  }) => void;
  isFirstSlide?: boolean;
  badges?: boolean;
}

const MODES = ["asis", "tobe"] as const;
const SPRING_STAGE_DELAYED = { ...SPRING.stage, delay: 0.04 };

interface DiagramCanvasItemProps {
  topicId: number;
  variant: ProcessVariant;
  mode: "asis" | "tobe";
  isSelected: boolean;
  isFirstSlide: boolean;
  prefersReducedMotion: boolean | null;
  setLightboxItem: ProcessVariantStageProps["setLightboxItem"];
}

const DiagramCanvasItem = memo(function DiagramCanvasItem({
  topicId,
  variant,
  mode,
  isSelected,
  isFirstSlide,
  prefersReducedMotion,
  setLightboxItem,
}: Readonly<DiagramCanvasItemProps>) {
  const offsetDirection = mode === "tobe" ? 1 : -1;
  const xOffset = prefersReducedMotion ? 0 : 14 * offsetDirection;

  return (
    <motion.div
      key={mode}
      aria-hidden={!isSelected}
      inert={!isSelected}
      initial={false}
      animate={isSelected ? { opacity: 1, x: 0 } : { opacity: 0, x: xOffset }}
      transition={isSelected ? SPRING.stage : SPRING.stageExit}
      className={cn(
        "col-start-1 row-start-1 flex size-full items-center justify-center",
        isSelected ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <button
        type="button"
        tabIndex={isSelected ? 0 : -1}
        className="active:scale-0.97 flex size-full min-h-11 cursor-zoom-in items-center justify-center p-3 transition-transform duration-100 ease-out focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none sm:p-5 md:p-6"
        onClick={() => {
          const itemId = mode === "tobe" ? topicId * 2 : topicId * 2 - 1;
          setLightboxItem({
            id: itemId,
            title: variant.title,
            description: variant.description,
            image: variant.image,
            type: variant.type,
          });
        }}
        aria-label={`Zoom diagram: ${variant.title}`}
      >
        <img
          src={variant.image}
          alt={variant.title}
          width={800}
          height={500}
          className="notranslate pointer-events-none select-none group-hover/canvas:scale-1.015 size-full rounded-lg object-contain transition-transform duration-300 ease-out"
          translate="no"
          draggable={false}
          loading={isFirstSlide && isSelected ? "eager" : "lazy"}
          fetchPriority={isFirstSlide && isSelected ? "high" : "low"}
          decoding={isFirstSlide && isSelected ? "sync" : "async"}
        />
      </button>
    </motion.div>
  );
});

interface FooterDetailsItemProps {
  variant: ProcessVariant;
  mode: "asis" | "tobe";
  isSelected: boolean;
  prefersReducedMotion: boolean | null;
  badges?: boolean;
}

const FooterDetailsItem = memo(function FooterDetailsItem({
  variant,
  mode,
  isSelected,
  prefersReducedMotion,
  badges = true,
}: Readonly<FooterDetailsItemProps>) {
  const offsetDirection = mode === "tobe" ? 1 : -1;
  const xOffset = prefersReducedMotion ? 0 : 10 * offsetDirection;

  return (
    <motion.div
      key={mode}
      aria-hidden={!isSelected}
      inert={!isSelected}
      initial={false}
      animate={isSelected ? { opacity: 1, x: 0 } : { opacity: 0, x: xOffset }}
      transition={isSelected ? SPRING_STAGE_DELAYED : SPRING.stageExit}
      className={cn(
        "col-start-1 row-start-1 flex flex-col gap-2.5",
        isSelected ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-accent" />
        <span className="font-body text-sm font-bold tracking-wider text-accent uppercase">
          Operational Insight
        </span>
      </div>
      <p
        className={cn(
          "line-clamp-3 text-base leading-relaxed text-pretty text-text-primary/90",
          badges ? "min-h-18" : "min-h-0",
        )}
      >
        {variant.description}
      </p>
      {badges && variant.specTags && variant.specTags.length > 0 ? (
        <div className="flex min-h-8 flex-wrap gap-2 pt-1">
          {variant.specTags.map((tag: string) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-muted transition-colors select-none hover:border-white/20 hover:text-text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </motion.div>
  );
});

function ProcessVariantStage({
  topic,
  activeViewMode,
  setLightboxItem,
  isFirstSlide = false,
  badges = true,
}: Readonly<ProcessVariantStageProps>) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex w-full flex-1 flex-col justify-start">
      {/* Permanent Solid Blueprint Stage Canvas (Zero Ghosting & Zero Frame Pop) */}
      <div className="group/canvas relative mb-3 flex aspect-video min-h-0 w-full min-w-0 transform-gpu items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white transition-colors duration-300 contain-paint select-none hover:border-white/25 sm:mb-5">
        <div className="relative grid size-full grid-cols-1 grid-rows-1">
          {MODES.map((mode) => (
            <DiagramCanvasItem
              key={mode}
              topicId={topic.id}
              variant={topic[mode]}
              mode={mode}
              isSelected={activeViewMode === mode}
              isFirstSlide={isFirstSlide}
              prefersReducedMotion={prefersReducedMotion}
              setLightboxItem={setLightboxItem}
            />
          ))}
        </div>

        {/* Permanent Expand Badge */}
        <div className="pointer-events-none absolute right-2.5 bottom-2.5 z-10 sm:right-3 sm:bottom-3">
          <span className="inline-flex size-7 items-center justify-center rounded-full border border-white/15 bg-surface/80 text-sm font-semibold text-text-primary shadow-xl backdrop-blur-md transition duration-200 group-hover/canvas:scale-105 group-hover/canvas:border-accent/60 group-hover/canvas:text-accent sm:size-auto sm:gap-1.5 sm:rounded-xl sm:px-3.5 sm:py-1.5">
            <Maximize2 size={13} className="text-accent" />
            <span className="hidden sm:inline">Expand Diagram</span>
          </span>
        </div>
      </div>

      {/* Footer Details Stack with 40ms Hierarchical Stagger */}
      <div className="relative grid w-full grid-cols-1 grid-rows-1">
        {MODES.map((mode) => (
          <FooterDetailsItem
            key={mode}
            variant={topic[mode]}
            mode={mode}
            isSelected={activeViewMode === mode}
            prefersReducedMotion={prefersReducedMotion}
            badges={badges}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(ProcessVariantStage);
