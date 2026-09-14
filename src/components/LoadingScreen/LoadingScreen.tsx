import { useEffect, useState, useRef, memo } from "react";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useIsMobile } from "../../hooks/useMediaQuery";
import LoadingBpmnDiagram, { type LoadingNodeId } from "./LoadingBpmnDiagram";
import LoadingMethodologyChecklist from "./LoadingMethodologyChecklist";
import { BPMN_STEPS } from "./loadingData";
import { SECTION_ANIMATE } from "../../utils/motionVariants";

const HEADER_INITIAL = { opacity: 0, y: -10 };
const HEADER_TRANSITION = { duration: 0.6 };

interface LoadingScreenProps {
  onComplete: () => void;
}

const NODE_THRESHOLDS: readonly {
  readonly id: LoadingNodeId;
  readonly threshold: number;
}[] = [
  { id: "start", threshold: 5 },
  { id: "task1", threshold: 25 },
  { id: "gateway", threshold: 50 },
  { id: "task2", threshold: 75 },
  { id: "task3", threshold: 75 },
  { id: "mergeGateway", threshold: 90 },
  { id: "end", threshold: 95 },
];

const ALL_LOADING_NODES: ReadonlySet<LoadingNodeId> = new Set<LoadingNodeId>([
  "start",
  "task1",
  "gateway",
  "task2",
  "task3",
  "mergeGateway",
  "end",
]);

function getActiveNodesForProgress(
  current: number,
): ReadonlySet<LoadingNodeId> {
  const set = new Set<LoadingNodeId>();
  for (const node of NODE_THRESHOLDS) {
    if (current >= node.threshold) {
      set.add(node.id);
    }
  }
  return set;
}

interface StepSnapshot {
  idx: number;
  completed: boolean[];
}

function checkStepThresholds(
  current: number,
  prev: StepSnapshot,
): { stepsDirty: boolean; stepIdx: number; completed: boolean[] } {
  const stepIdx = BPMN_STEPS.findIndex(
    (s) => current >= s.threshold && current < s.completedThreshold,
  );
  let stepsDirty = stepIdx !== prev.idx;
  if (!stepsDirty) {
    for (let i = 0; i < BPMN_STEPS.length; i++) {
      if (current >= BPMN_STEPS[i].completedThreshold !== prev.completed[i]) {
        stepsDirty = true;
        break;
      }
    }
  }

  const completed = stepsDirty
    ? BPMN_STEPS.map((s) => current >= s.completedThreshold)
    : prev.completed;

  return { stepsDirty, stepIdx, completed };
}

function StaticLoadingBackground() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] opacity-60" />
      <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(circle_at_center,transparent_20%,hsl(var(--bg))_85%)] md:block" />
    </>
  );
}

function LoadingScreen({ onComplete }: Readonly<LoadingScreenProps>) {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const initialVal = prefersReducedMotion === true ? 100 : 0;
  const count = useMotionValue(initialVal);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  // Threshold-triggered React states (only re-render when crossed, not every frame)
  const [loadingState, setLoadingState] = useState(() => ({
    activeNodes: getActiveNodesForProgress(initialVal),
    activeStepIdx: -1,
    completedSteps: BPMN_STEPS.map(() => initialVal >= 100),
  }));
  const { activeNodes, activeStepIdx, completedSteps } = loadingState;

  const activeNodeCountRef = useRef(activeNodes.size);

  const handleSkip = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    count.set(100);
    if (!doneRef.current) {
      doneRef.current = true;
      setLoadingState({
        activeNodes: ALL_LOADING_NODES,
        activeStepIdx: BPMN_STEPS.length - 1,
        completedSteps: BPMN_STEPS.map(() => true),
      });
      onComplete();
    }
  };

  // Throttle step state to threshold-crossings only (not every RAF frame)
  const lastStepSnapshotRef = useRef({
    idx: -1,
    completed: BPMN_STEPS.map(() => false),
  });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (prefersReducedMotion) {
      if (!doneRef.current) {
        doneRef.current = true;
        timeoutId = setTimeout(onComplete, 150);
      }
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    }

    const DURATION = 1800;
    startTimeRef.current = null;

    const tick = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased = progress;
      const current = Math.floor(eased * 100);

      count.set(eased * 100);

      const currentActiveNodes = getActiveNodesForProgress(current);
      const nodesUpdated =
        currentActiveNodes.size !== activeNodeCountRef.current;
      if (nodesUpdated) {
        activeNodeCountRef.current = currentActiveNodes.size;
      }

      const { stepsDirty, stepIdx, completed } = checkStepThresholds(
        current,
        lastStepSnapshotRef.current,
      );
      if (stepsDirty) {
        lastStepSnapshotRef.current = { idx: stepIdx, completed };
      }

      if (nodesUpdated || stepsDirty) {
        setLoadingState((prev) => ({
          activeNodes: nodesUpdated ? currentActiveNodes : prev.activeNodes,
          activeStepIdx: stepsDirty ? stepIdx : prev.activeStepIdx,
          completedSteps: stepsDirty ? completed : prev.completedSteps,
        }));
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        count.set(100);
        if (!doneRef.current) {
          doneRef.current = true;
          timeoutId = setTimeout(onComplete, 100);
        }
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [onComplete, prefersReducedMotion, count]);

  const displayText = useTransform(count, (v) =>
    String(Math.floor(v)).padStart(3, "0"),
  );

  return (
    <motion.output
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading portfolio system models"
      className="bg-bg fixed inset-0 z-[9999] flex flex-col justify-between overflow-hidden p-6 contain-strict select-none md:p-12"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25, ease: "easeOut" } }}
    >
      {/* Background aesthetics */}
      <StaticLoadingBackground />

      {/* Top Header Row */}
      <div className="relative z-10 flex w-full items-center justify-between">
        <motion.div
          className="text-muted font-sans text-xs font-semibold uppercase"
          initial={HEADER_INITIAL}
          animate={SECTION_ANIMATE}
          transition={HEADER_TRANSITION}
        >
          ONDREJ MICHAL OČKAJ
        </motion.div>
        <motion.button
          onClick={handleSkip}
          className="text-muted hover:text-text-primary pointer-events-auto z-20 cursor-pointer rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs transition-colors duration-200 hover:border-white/20 hover:bg-white/[0.08] active:scale-95"
          initial={HEADER_INITIAL}
          animate={SECTION_ANIMATE}
          transition={HEADER_TRANSITION}
        >
          Skip
        </motion.button>
      </div>

      {/* Center: BPMN Diagram Area */}
      <div className="relative z-10 flex w-full flex-1 items-center justify-center py-6">
        {!isMobile ? (
          <LoadingBpmnDiagram activeNodes={activeNodes} count={count} />
        ) : null}
        {isMobile ? <div className="flex-1" /> : null}
      </div>

      {/* Bottom Layout Row */}
      <div className="relative z-10 grid w-full grid-cols-1 items-end gap-8 md:grid-cols-12">
        <LoadingMethodologyChecklist
          isMobile={isMobile}
          activeStepIdx={activeStepIdx}
          completedSteps={completedSteps}
        />

        {/* Right column: Large tabular counter & progress indicator */}
        <div className="flex flex-col items-start justify-end gap-3 md:col-span-6 md:items-end">
          <div className="flex items-baseline gap-1 select-none">
            <motion.span className="font-display text-text-primary inline-block min-w-[3ch] text-right text-5xl leading-none tabular-nums md:text-7xl">
              {displayText}
            </motion.span>
            <span className="font-display text-muted/80 text-lg md:text-2xl">
              %
            </span>
          </div>

          {/* Micro progress line */}
          <div className="bg-stroke/60 relative h-[2px] w-full max-w-xs overflow-hidden rounded-full">
            <div className="loading-progress-line absolute top-0 left-0 h-full w-full bg-gradient-to-r from-[hsl(var(--accent))]/70 to-[hsl(var(--accent))]" />
          </div>
        </div>
      </div>
    </motion.output>
  );
}

export default memo(LoadingScreen);
