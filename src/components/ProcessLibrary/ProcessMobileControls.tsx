import { memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LiquidGlassButton } from "../LiquidGlass/Button";
import { StaticGlass } from "../LiquidGlass/StaticGlass";
import { PROCESS_TOPICS } from "../../data/processItems";
import {
  useProcessStore,
  selectActiveIndex,
  selectPrevDisabled,
  selectNextDisabled,
} from "../../store/useProcessStore";

function ProcessMobileControls() {
  const activeIndex = useProcessStore(selectActiveIndex);
  const prevDisabled = useProcessStore(selectPrevDisabled);
  const nextDisabled = useProcessStore(selectNextDisabled);
  const selectPreviousTopic = useProcessStore(
    (state) => state.selectPreviousTopic,
  );
  const selectNextTopic = useProcessStore((state) => state.selectNextTopic);
  const activePosition = activeIndex + 1;
  return (
    <div className="flex w-full justify-center">
      <StaticGlass
        as="div"
        roundedClass="rounded-full"
        className="px-2.5 py-2 shadow-lg"
        innerClassName="flex items-center gap-3.5"
      >
        <LiquidGlassButton
          onClick={selectPreviousTopic}
          disabled={prevDisabled}
          roundedClass="rounded-full"
          className="flex size-11 min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center text-text-primary transition-opacity disabled:pointer-events-none disabled:opacity-30"
          aria-label="Previous process topic"
        >
          <ChevronLeft size={18} />
        </LiquidGlassButton>

        <span className="flex items-center gap-1 px-1.5 font-body text-sm leading-none tabular-nums select-none">
          <span className="font-bold text-accent">
            {String(activePosition).padStart(2, "0")}
          </span>
          <span className="font-medium text-muted/40">/</span>
          <span className="font-medium text-muted/60">
            {String(PROCESS_TOPICS.length).padStart(2, "0")}
          </span>
        </span>

        <LiquidGlassButton
          onClick={selectNextTopic}
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
