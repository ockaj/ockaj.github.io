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
}

const MODES = ["asis", "tobe"] as const;

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
        "col-start-1 row-start-1 flex h-full w-full items-center justify-center",
        isSelected ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <button
        type="button"
        tabIndex={isSelected ? 0 : -1}
        className="focus-visible:ring-accent flex h-full min-h-[44px] w-full cursor-zoom-in items-center justify-center p-3 transition-transform duration-100 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none active:scale-[0.99] sm:p-5 md:p-6"
        onClick={() =>
          setLightboxItem({
            id: topicId,
            title: variant.title,
            description: variant.description,
            image: variant.image,
            type: variant.type,
          })
        }
        aria-label={`Zoom diagram: ${variant.title}`}
      >
        <img
          src={variant.image}
          alt={variant.title}
          width={800}
          height={500}
          className="h-full w-full rounded-lg object-contain transition-transform duration-300 ease-out group-hover/canvas:scale-[1.015]"
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
}

const FooterDetailsItem = memo(function FooterDetailsItem({
  variant,
  mode,
  isSelected,
  prefersReducedMotion,
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
      transition={
        isSelected ? { ...SPRING.stage, delay: 0.04 } : SPRING.stageExit
      }
      className={cn(
        "col-start-1 row-start-1 flex flex-col gap-2.5",
        isSelected ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-accent" />
        <span className="text-accent font-body text-xs font-bold tracking-wider uppercase">
          Operational Insight
        </span>
      </div>
      <p className="text-text-primary/90 line-clamp-3 min-h-[4.25rem] text-sm leading-relaxed text-pretty">
        {variant.description}
      </p>
      <div className="flex min-h-[2rem] flex-wrap gap-2 pt-1">
        {variant.specTags?.map((tag: string) => (
          <span
            key={tag}
            className="text-muted hover:text-text-primary rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs transition-colors select-none hover:border-white/20"
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
});

function ProcessVariantStage({
  topic,
  activeViewMode,
  setLightboxItem,
  isFirstSlide = false,
}: Readonly<ProcessVariantStageProps>) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex w-full flex-1 flex-col justify-between">
      {/* Permanent Solid Blueprint Stage Canvas (Zero Ghosting & Zero Frame Pop) */}
      <div className="group/canvas relative mb-4 flex aspect-[16/10] w-full [transform:translateZ(0)] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white transition-colors duration-300 select-none hover:border-white/25 sm:mb-6">
        <div className="relative grid h-full w-full grid-cols-1 grid-rows-1">
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
          <span className="bg-surface/80 text-text-primary group-hover/canvas:border-accent/60 group-hover/canvas:text-accent inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-1.5 text-xs font-semibold shadow-xl backdrop-blur-md transition duration-200 group-hover/canvas:scale-105 sm:px-3.5">
            <Maximize2 size={12} className="text-accent" />
            <span>Expand Diagram</span>
          </span>
        </div>
      </div>

      {/* Footer Details Stack with 40ms Hierarchical Stagger */}
      <div className="relative mt-auto grid w-full grid-cols-1 grid-rows-1">
        {MODES.map((mode) => (
          <FooterDetailsItem
            key={mode}
            variant={topic[mode]}
            mode={mode}
            isSelected={activeViewMode === mode}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(ProcessVariantStage);
