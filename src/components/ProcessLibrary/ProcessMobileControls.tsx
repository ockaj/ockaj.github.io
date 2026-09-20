import { memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StaticGlass, LiquidGlassButton } from "../LiquidGlass/LiquidGlass";
import { PROCESS_TOPICS } from "../../data/processItems";
import { useProcessLibraryContext } from "./ProcessLibraryContext";

function ProcessMobileControls() {
  const { state, actions } = useProcessLibraryContext();
  const { activeTopic, prevDisabled, nextDisabled } = state;
  const { onPrevTopic, onNextTopic } = actions;
  return (
    <div className="flex w-full justify-center lg:hidden">
      <StaticGlass
        as="div"
        roundedClass="rounded-full"
        className="px-2.5 py-2 shadow-lg"
        innerClassName="flex items-center gap-3.5"
      >
        <LiquidGlassButton
          onClick={onPrevTopic}
          disabled={prevDisabled}
          roundedClass="rounded-full"
          className="flex size-11 min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center text-text-primary transition-opacity disabled:pointer-events-none disabled:opacity-30"
          aria-label="Previous process topic"
        >
          <ChevronLeft size={18} />
        </LiquidGlassButton>

        <span className="flex items-center gap-1 px-1.5 font-body text-sm leading-none tabular-nums select-none">
          <span className="font-bold text-accent">
            {String(activeTopic.id).padStart(2, "0")}
          </span>
          <span className="font-medium text-muted/40">/</span>
          <span className="font-medium text-muted/60">
            {String(PROCESS_TOPICS.length).padStart(2, "0")}
          </span>
        </span>

        <LiquidGlassButton
          onClick={onNextTopic}
          disabled={nextDisabled}
          roundedClass="rounded-full"
          className="flex size-11 min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center text-text-primary transition-opacity disabled:pointer-events-none disabled:opacity-30"
          aria-label="Next process topic"
        >
          <ChevronRight size={18} />
        </LiquidGlassButton>
      </StaticGlass>
    </div>
  );
}

export default memo(ProcessMobileControls);
