import { memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LiquidGlass, LiquidGlassButton } from "../LiquidGlass/LiquidGlass";
import { PROCESS_TOPICS } from "../../data/processItems";
import { useProcessLibraryContext } from "./ProcessLibraryContext";

function ProcessMobileControls() {
  const { state, actions } = useProcessLibraryContext();
  const { activeTopic, prevDisabled, nextDisabled } = state;
  const { onPrevTopic, onNextTopic } = actions;
  return (
    <div className="flex w-full justify-center lg:hidden">
      <LiquidGlass
        as="div"
        interactive={false}
        roundedClass="rounded-full"
        className="px-2.5 py-2 shadow-lg"
        innerClassName="flex items-center gap-3.5"
      >
        <LiquidGlassButton
          onClick={onPrevTopic}
          disabled={prevDisabled}
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
          onClick={onNextTopic}
          disabled={nextDisabled}
          roundedClass="rounded-full"
          className="text-text-primary flex size-[44px] min-h-[44px] min-w-[44px] flex-shrink-0 cursor-pointer items-center justify-center transition-opacity disabled:pointer-events-none disabled:opacity-30"
          aria-label="Next process topic"
        >
          <ChevronRight size={18} />
        </LiquidGlassButton>
      </LiquidGlass>
    </div>
  );
}

export default memo(ProcessMobileControls);
