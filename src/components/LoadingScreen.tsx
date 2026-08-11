import { useEffect, useState, useRef } from "react";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useIsMobile } from "../hooks/useMediaQuery";
import LoadingBpmnDiagram from "./LoadingScreen/LoadingBpmnDiagram";
import LoadingMethodologyChecklist from "./LoadingScreen/LoadingMethodologyChecklist";
import { BPMN_STEPS } from "./LoadingScreen/loadingData";

interface LoadingScreenProps {
  onComplete: () => void;
}

function checkNodeThresholds(
  current: number,
  refs: {
    start: { current: boolean };
    task1: { current: boolean };
    gateway: { current: boolean };
    task2: { current: boolean };
    task3: { current: boolean };
    mergeGateway: { current: boolean };
    end: { current: boolean };
  },
) {
  const updatedNodes: Record<string, boolean> = {};
  let nodesUpdated = false;

  if (current >= 5 && !refs.start.current) {
    refs.start.current = true;
    updatedNodes.start = true;
    nodesUpdated = true;
  }
  if (current >= 25 && !refs.task1.current) {
    refs.task1.current = true;
    updatedNodes.task1 = true;
    nodesUpdated = true;
  }
  if (current >= 50 && !refs.gateway.current) {
    refs.gateway.current = true;
    updatedNodes.gateway = true;
    nodesUpdated = true;
  }
  if (current >= 75 && !refs.task2.current) {
    refs.task2.current = true;
    refs.task3.current = true;
    updatedNodes.task2 = true;
    updatedNodes.task3 = true;
    nodesUpdated = true;
  }
  if (current >= 90 && !refs.mergeGateway.current) {
    refs.mergeGateway.current = true;
    updatedNodes.mergeGateway = true;
    nodesUpdated = true;
  }
  if (current >= 95 && !refs.end.current) {
    refs.end.current = true;
    updatedNodes.end = true;
    nodesUpdated = true;
  }

  return { nodesUpdated, updatedNodes };
}

export default function LoadingScreen({
  onComplete,
}: Readonly<LoadingScreenProps>) {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const initialVal = prefersReducedMotion === true ? 100 : 0;
  const count = useMotionValue(initialVal);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  // Threshold-triggered React states (only re-render when crossed, not every frame)
  const [loadingState, setLoadingState] = useState(() => ({
    nodes: {
      start: initialVal >= 5,
      task1: initialVal >= 25,
      gateway: initialVal >= 50,
      task2: initialVal >= 75,
      task3: initialVal >= 75,
      mergeGateway: initialVal >= 90,
      end: initialVal >= 95,
    },
    activeStepIdx: -1,
    completedSteps: BPMN_STEPS.map(() => initialVal >= 100),
  }));
  const { nodes, activeStepIdx, completedSteps } = loadingState;

  // Refs to avoid stale closures in RAF
  const nodeStartRef = useRef(initialVal >= 5);
  const nodeTask1Ref = useRef(initialVal >= 25);
  const nodeGatewayRef = useRef(initialVal >= 50);
  const nodeTask2Ref = useRef(initialVal >= 75);
  const nodeTask3Ref = useRef(initialVal >= 75);
  const nodeMergeGatewayRef = useRef(initialVal >= 90);
  const nodeEndRef = useRef(initialVal >= 95);

  const handleSkip = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    count.set(100);
    if (!doneRef.current) {
      doneRef.current = true;
      setLoadingState({
        nodes: {
          start: true,
          task1: true,
          gateway: true,
          task2: true,
          task3: true,
          mergeGateway: true,
          end: true,
        },
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

    const tick = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased = progress;
      const current = Math.floor(eased * 100);

      count.set(eased * 100);

      const nodeRefs = {
        start: nodeStartRef,
        task1: nodeTask1Ref,
        gateway: nodeGatewayRef,
        task2: nodeTask2Ref,
        task3: nodeTask3Ref,
        mergeGateway: nodeMergeGatewayRef,
        end: nodeEndRef,
      };
      const { nodesUpdated, updatedNodes } = checkNodeThresholds(
        current,
        nodeRefs,
      );

      const stepIdx = BPMN_STEPS.findIndex(
        (s) => current >= s.threshold && current < s.completedThreshold,
      );
      const prev = lastStepSnapshotRef.current;
      let stepsDirty = false;
      if (stepIdx !== prev.idx) stepsDirty = true;
      if (!stepsDirty) {
        for (let i = 0; i < BPMN_STEPS.length; i++) {
          if (
            current >= BPMN_STEPS[i].completedThreshold !==
            prev.completed[i]
          ) {
            stepsDirty = true;
            break;
          }
        }
      }

      let completed: boolean[] = [];
      if (stepsDirty) {
        completed = BPMN_STEPS.map((s) => current >= s.completedThreshold);
        lastStepSnapshotRef.current = { idx: stepIdx, completed };
      }

      if (nodesUpdated || stepsDirty) {
        setLoadingState((prev) => {
          const nextNodes = nodesUpdated
            ? { ...prev.nodes, ...updatedNodes }
            : prev.nodes;
          const nextActiveStepIdx = stepsDirty ? stepIdx : prev.activeStepIdx;
          const nextCompletedSteps = stepsDirty
            ? completed
            : prev.completedSteps;
          return {
            nodes: nextNodes,
            activeStepIdx: nextActiveStepIdx,
            completedSteps: nextCompletedSteps,
          };
        });
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        count.set(100);
        if (!doneRef.current) {
          doneRef.current = true;
          timeoutId = setTimeout(onComplete, 300);
        }
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [onComplete, prefersReducedMotion, count]);

  // Derived motion values — update without React re-renders
  const path1 = useTransform(count, [10, 25], [0, 1]);
  const path2 = useTransform(count, [35, 50], [0, 1]);
  const path3a = useTransform(count, [60, 75], [0, 1]);
  const path3b = useTransform(count, [60, 75], [0, 1]);
  const path4a = useTransform(count, [80, 90], [0, 1]);
  const path4b = useTransform(count, [80, 90], [0, 1]);
  const path5 = useTransform(count, [90, 95], [0, 1]);

  const path1Visible = useTransform<number, number>(count, (v) =>
    v >= 10 ? 1 : 0,
  );
  const path2Visible = useTransform<number, number>(count, (v) =>
    v >= 35 ? 1 : 0,
  );
  const path3Visible = useTransform<number, number>(count, (v) =>
    v >= 60 ? 1 : 0,
  );
  const path4Visible = useTransform<number, number>(count, (v) =>
    v >= 80 ? 1 : 0,
  );
  const path5Visible = useTransform<number, number>(count, (v) =>
    v >= 90 ? 1 : 0,
  );

  const displayText = useTransform(count, (v) =>
    String(Math.floor(v)).padStart(3, "0"),
  );
  const progressScale = useTransform(count, [0, 100], [0, 1]);

  return (
    <motion.output
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading portfolio system models"
      className="bg-bg fixed inset-0 z-[9999] flex flex-col justify-between overflow-hidden p-6 select-none md:p-12"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25, ease: "easeOut" } }}
    >
      {/* Background aesthetics */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] opacity-60" />
      <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(circle_at_center,transparent_20%,hsl(var(--bg))_85%)] md:block" />

      {/* Top Header Row */}
      <div className="relative z-10 flex w-full items-center justify-between">
        <motion.div
          className="text-muted font-sans text-xs font-semibold uppercase"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          ONDREJ MICHAL OČKAJ
        </motion.div>
        <motion.button
          onClick={handleSkip}
          className="text-muted hover:text-text-primary pointer-events-auto z-20 cursor-pointer rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs transition-colors duration-200 hover:border-white/20 hover:bg-white/[0.08] active:scale-95"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Skip
        </motion.button>
      </div>

      {/* Center: BPMN Diagram Area */}
      <div className="relative z-10 flex w-full flex-1 items-center justify-center py-6">
        {!isMobile && (
          <LoadingBpmnDiagram
            nodes={nodes}
            path1={path1}
            path2={path2}
            path3a={path3a}
            path3b={path3b}
            path4a={path4a}
            path4b={path4b}
            path5={path5}
            path1Visible={path1Visible}
            path2Visible={path2Visible}
            path3Visible={path3Visible}
            path4Visible={path4Visible}
            path5Visible={path5Visible}
          />
        )}
        {isMobile && <div className="flex-1" />}
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
            <motion.div
              className="absolute top-0 left-0 h-full origin-left bg-gradient-to-r from-[hsl(var(--accent))]/70 to-[hsl(var(--accent))]"
              style={{
                scaleX: progressScale,
                width: "100%",
              }}
            />
          </div>
        </div>
      </div>
    </motion.output>
  );
}
