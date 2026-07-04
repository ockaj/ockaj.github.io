import { useEffect, useState, useRef } from "react";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useIsMobile } from "../hooks/useMediaQuery";

const nodeOpacityAnimate = (active: boolean) => ({ opacity: active ? 1 : 0 });
const nodeOpacityTransition = { duration: 0.4 };

const nodePulseAnimate = (active: boolean) => ({
  scale: active ? [1, 1.08, 1] : 1,
  opacity: active ? 1 : 0,
});
const nodePulseTransition = (active: boolean) => ({
  scale: {
    duration: 1.8,
    repeat: active ? Infinity : 0,
    repeatType: "reverse" as const,
    ease: "easeInOut" as const,
  },
  opacity: { duration: 0.4, ease: "easeOut" as const },
});

interface LoadingScreenProps {
  onComplete: () => void;
}

const BPMN_STEPS = [
  {
    label: "Process Identification and Information Gathering",
    threshold: 0,
    completedThreshold: 15,
  },
  {
    label: "Process Decomposition into Activities",
    threshold: 15,
    completedThreshold: 30,
  },
  {
    label: "Determination of Activity Sequence and Responsibilities",
    threshold: 30,
    completedThreshold: 45,
  },
  {
    label: "Identification of Inputs and Outputs",
    threshold: 45,
    completedThreshold: 60,
  },
  {
    label: "Identification of Decision and Branching Points in the Process",
    threshold: 60,
    completedThreshold: 75,
  },
  {
    label: "Creation of the BPMN Model",
    threshold: 75,
    completedThreshold: 90,
  },
  {
    label: "Verification of Model Logic and Quality",
    threshold: 90,
    completedThreshold: 98,
  },
];

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const initialVal = prefersReducedMotion ? 100 : 0;
  const count = useMotionValue(initialVal);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  // Threshold-triggered React states (only re-render when crossed, not every frame)
  const [loadingState, setLoadingState] = useState({
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
  });
  const { nodes, activeStepIdx, completedSteps } = loadingState;
  const {
    start: nodeStart,
    task1: nodeTask1,
    gateway: nodeGateway,
    task2: nodeTask2,
    task3: nodeTask3,
    mergeGateway: nodeMergeGateway,
    end: nodeEnd,
  } = nodes;

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
  const lastStepSnapshot = useRef({
    idx: -1,
    completed: BPMN_STEPS.map(() => false),
  });

  useEffect(() => {
    if (prefersReducedMotion) {
      if (!doneRef.current) {
        doneRef.current = true;
        setTimeout(onComplete, 150);
      }
      return;
    }

    const DURATION = 1800;

    const tick = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased = progress; // Linear progression for rhythmic step intervals
      const current = Math.floor(eased * 100);

      // Update motion value with high-precision float — buttery smooth at native monitor refresh rate!
      count.set(eased * 100);

      // Check thresholds — update React state only when crossed
      let nodesUpdated = false;
      const updatedNodes: Partial<typeof nodes> = {};
      if (current >= 5 && !nodeStartRef.current) {
        nodeStartRef.current = true;
        updatedNodes.start = true;
        nodesUpdated = true;
      }
      if (current >= 25 && !nodeTask1Ref.current) {
        nodeTask1Ref.current = true;
        updatedNodes.task1 = true;
        nodesUpdated = true;
      }
      if (current >= 50 && !nodeGatewayRef.current) {
        nodeGatewayRef.current = true;
        updatedNodes.gateway = true;
        nodesUpdated = true;
      }
      if (current >= 75 && !nodeTask2Ref.current) {
        nodeTask2Ref.current = true;
        nodeTask3Ref.current = true;
        updatedNodes.task2 = true;
        updatedNodes.task3 = true;
        nodesUpdated = true;
      }
      if (current >= 90 && !nodeMergeGatewayRef.current) {
        nodeMergeGatewayRef.current = true;
        updatedNodes.mergeGateway = true;
        nodesUpdated = true;
      }
      if (current >= 95 && !nodeEndRef.current) {
        nodeEndRef.current = true;
        updatedNodes.end = true;
        nodesUpdated = true;
      }

      // Step checklist — only setState when a threshold actually crosses
      const stepIdx = BPMN_STEPS.findIndex(
        (s) => current >= s.threshold && current < s.completedThreshold,
      );
      const prev = lastStepSnapshot.current;
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
        lastStepSnapshot.current = { idx: stepIdx, completed };
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
          setTimeout(onComplete, 300);
        }
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
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

  const path1Visible = useTransform(count, (v) => (v >= 10 ? 1 : 0));
  const path2Visible = useTransform(count, (v) => (v >= 35 ? 1 : 0));
  const path3Visible = useTransform(count, (v) => (v >= 60 ? 1 : 0));
  const path4Visible = useTransform(count, (v) => (v >= 80 ? 1 : 0));
  const path5Visible = useTransform(count, (v) => (v >= 90 ? 1 : 0));

  const displayText = useTransform(count, (v) =>
    String(Math.floor(v)).padStart(3, "0"),
  );
  const progressScale = useTransform(count, [0, 100], [0, 1]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-bg flex flex-col justify-between p-6 md:p-12 overflow-hidden select-none"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25, ease: "easeOut" } }}
    >
      {/* Background aesthetics */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] opacity-60 pointer-events-none" />
      <div className="hidden md:block absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,hsl(var(--bg))_85%)] pointer-events-none" />

      {/* Top Header Row */}
      <div className="relative z-10 flex justify-between items-center w-full">
        <motion.div
          className="text-[10px] md:text-xs text-muted uppercase font-sans font-semibold"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          ONDREJ MICHAL OČKAJ
        </motion.div>
        <motion.button
          onClick={handleSkip}
          className="px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 text-[10px] md:text-xs text-muted hover:text-text-primary transition-colors duration-200 cursor-pointer active:scale-95 z-20 pointer-events-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Skip
        </motion.button>
      </div>

      {/* Center: BPMN Diagram Area */}
      <div className="relative z-10 flex-1 flex items-center justify-center py-6 w-full">
        {/* Desktop Diagram */}
        {!isMobile && (
          <div className="w-full max-w-4xl px-4">
            <svg
              viewBox="0 0 800 240"
              className="w-full h-auto text-[hsl(var(--accent))]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Inactive Base Connections (Dim solid paths) */}
              <path
                d="M 98 120 L 170 120"
                stroke="hsl(var(--stroke))"
                strokeWidth="2"
              />
              <path
                d="M 290 120 L 367 120"
                stroke="hsl(var(--stroke))"
                strokeWidth="2"
              />
              <path
                d="M 423 120 L 440 120 L 440 65 L 480 65"
                stroke="hsl(var(--stroke))"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M 423 120 L 440 120 L 440 175 L 480 175"
                stroke="hsl(var(--stroke))"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M 600 65 L 650 65 L 650 92"
                stroke="hsl(var(--stroke))"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M 600 175 L 650 175 L 650 148"
                stroke="hsl(var(--stroke))"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M 678 120 L 692 120"
                stroke="hsl(var(--stroke))"
                strokeWidth="2"
                fill="none"
              />

              {/* Active Drawing Connections — style with MotionValues = zero React re-renders */}
              <motion.path
                d="M 98 120 L 170 120"
                stroke="hsl(var(--accent))"
                strokeWidth="2"
                strokeLinecap="round"
                style={{
                  pathLength: path1,
                  opacity: path1Visible,
                }}
              />
              <motion.path
                d="M 290 120 L 367 120"
                stroke="hsl(var(--accent))"
                strokeWidth="2"
                strokeLinecap="round"
                style={{
                  pathLength: path2,
                  opacity: path2Visible,
                }}
              />
              <motion.path
                d="M 423 120 L 440 120 L 440 65 L 480 65"
                stroke="hsl(var(--accent))"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                style={{
                  pathLength: path3a,
                  opacity: path3Visible,
                }}
              />
              <motion.path
                d="M 423 120 L 440 120 L 440 175 L 480 175"
                stroke="hsl(var(--accent))"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                style={{
                  pathLength: path3b,
                  opacity: path3Visible,
                }}
              />
              <motion.path
                d="M 600 65 L 650 65 L 650 92"
                stroke="hsl(var(--accent))"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                style={{
                  pathLength: path4a,
                  opacity: path4Visible,
                }}
              />
              <motion.path
                d="M 600 175 L 650 175 L 650 148"
                stroke="hsl(var(--accent))"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                style={{
                  pathLength: path4b,
                  opacity: path4Visible,
                }}
              />
              <motion.path
                d="M 678 120 L 692 120"
                stroke="hsl(var(--accent))"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                style={{
                  pathLength: path5,
                  opacity: path5Visible,
                }}
              />

              {/* NODE 1: Start Event (BPMN standard: single thin border circle) */}
              <circle
                cx="80"
                cy="120"
                r="18"
                stroke="hsl(var(--stroke))"
                strokeWidth="1.5"
                fill="hsl(var(--bg))"
              />
              <motion.circle
                cx="80"
                cy="120"
                r="18"
                stroke="hsl(var(--accent))"
                strokeWidth="2"
                fill="hsl(var(--accent) / 0.05)"
                style={{
                  filter: nodeStart
                    ? "drop-shadow(0px 0px 6px hsla(var(--accent), 0.45))"
                    : "none",
                }}
                animate={nodePulseAnimate(nodeStart)}
                transition={nodePulseTransition(nodeStart)}
              />

              {/* NODE 2: Task 1 (Analyze) */}
              <rect
                x="170"
                y="90"
                width="120"
                height="60"
                rx="6"
                stroke="hsl(var(--stroke))"
                strokeWidth="2"
                fill="hsl(var(--bg))"
              />
              <motion.rect
                x="170"
                y="90"
                width="120"
                height="60"
                rx="6"
                stroke="hsl(var(--accent))"
                strokeWidth="2"
                fill="hsl(var(--accent) / 0.03)"
                style={{
                  filter: nodeTask1
                    ? "drop-shadow(0px 0px 6px hsla(var(--accent), 0.45))"
                    : "none",
                }}
                animate={nodeOpacityAnimate(nodeTask1)}
                transition={nodeOpacityTransition}
              />

              {/* NODE 3: Gateway */}
              <path
                d="M 395 92 L 423 120 L 395 148 L 367 120 Z"
                stroke="hsl(var(--stroke))"
                strokeWidth="2"
                fill="hsl(var(--bg))"
              />
              <motion.path
                d="M 395 92 L 423 120 L 395 148 L 367 120 Z"
                stroke="hsl(var(--accent))"
                strokeWidth="2"
                fill="hsl(var(--accent) / 0.03)"
                style={{
                  filter: nodeGateway
                    ? "drop-shadow(0px 0px 6px hsla(var(--accent), 0.45))"
                    : "none",
                }}
                animate={nodeOpacityAnimate(nodeGateway)}
                transition={nodeOpacityTransition}
              />
              <g
                stroke={
                  nodeGateway ? "hsl(var(--accent))" : "hsl(var(--stroke))"
                }
                strokeWidth="2.5"
                className="transition-colors duration-300"
              >
                <line x1="395" y1="112" x2="395" y2="128" />
                <line x1="387" y1="120" x2="403" y2="120" />
              </g>

              {/* NODE 4a: Task 2 (Model) */}
              <rect
                x="480"
                y="35"
                width="120"
                height="60"
                rx="6"
                stroke="hsl(var(--stroke))"
                strokeWidth="2"
                fill="hsl(var(--bg))"
              />
              <motion.rect
                x="480"
                y="35"
                width="120"
                height="60"
                rx="6"
                stroke="hsl(var(--accent))"
                strokeWidth="2"
                fill="hsl(var(--accent) / 0.03)"
                style={{
                  filter: nodeTask2
                    ? "drop-shadow(0px 0px 6px hsla(var(--accent), 0.45))"
                    : "none",
                }}
                animate={nodeOpacityAnimate(nodeTask2)}
                transition={nodeOpacityTransition}
              />

              {/* NODE 4b: Task 3 (Optimize) */}
              <rect
                x="480"
                y="145"
                width="120"
                height="60"
                rx="6"
                stroke="hsl(var(--stroke))"
                strokeWidth="2"
                fill="hsl(var(--bg))"
              />
              <motion.rect
                x="480"
                y="145"
                width="120"
                height="60"
                rx="6"
                stroke="hsl(var(--accent))"
                strokeWidth="2"
                fill="hsl(var(--accent) / 0.03)"
                style={{
                  filter: nodeTask3
                    ? "drop-shadow(0px 0px 6px hsla(var(--accent), 0.45))"
                    : "none",
                }}
                animate={nodeOpacityAnimate(nodeTask3)}
                transition={nodeOpacityTransition}
              />

              {/* NODE 4c: Merge Gateway */}
              <path
                d="M 650 92 L 678 120 L 650 148 L 622 120 Z"
                stroke="hsl(var(--stroke))"
                strokeWidth="2"
                fill="hsl(var(--bg))"
              />
              <motion.path
                d="M 650 92 L 678 120 L 650 148 L 622 120 Z"
                stroke="hsl(var(--accent))"
                strokeWidth="2"
                fill="hsl(var(--accent) / 0.03)"
                style={{
                  filter: nodeMergeGateway
                    ? "drop-shadow(0px 0px 6px hsla(var(--accent), 0.45))"
                    : "none",
                }}
                animate={nodeOpacityAnimate(nodeMergeGateway)}
                transition={nodeOpacityTransition}
              />
              <g
                stroke={
                  nodeMergeGateway ? "hsl(var(--accent))" : "hsl(var(--stroke))"
                }
                strokeWidth="2.5"
                className="transition-colors duration-300"
              >
                <line x1="650" y1="112" x2="650" y2="128" />
                <line x1="642" y1="120" x2="658" y2="120" />
              </g>

              {/* NODE 5: End Event (BPMN standard: single thick border circle) */}
              <circle
                cx="710"
                cy="120"
                r="18"
                stroke="hsl(var(--stroke))"
                strokeWidth="4.5"
                fill="hsl(var(--bg))"
              />
              <motion.circle
                cx="710"
                cy="120"
                r="18"
                stroke="hsl(var(--accent))"
                strokeWidth="5"
                fill="hsl(var(--accent) / 0.05)"
                style={{
                  filter: nodeEnd
                    ? "drop-shadow(0px 0px 6px hsla(var(--accent), 0.45))"
                    : "none",
                }}
                animate={nodePulseAnimate(nodeEnd)}
                transition={nodePulseTransition(nodeEnd)}
              />
            </svg>
          </div>
        )}

        {/* Mobile Spacer */}
        {isMobile && <div className="flex-1" />}
      </div>

      {/* Bottom Layout Row */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-end w-full">
        {/* Left column: Methodology checklist */}
        <div className="md:col-span-6 flex flex-col items-start gap-3">
          <span className="text-[10px] text-muted/70 uppercase font-sans font-semibold">
            Process Modeling Methodology
          </span>
          {/* Methodology checklist — Desktop Only */}
          {!isMobile && (
            <div className="flex flex-col gap-1.5 md:gap-2 text-left w-full max-w-md select-none">
              {BPMN_STEPS.map((step, idx) => {
                const isActive = activeStepIdx === idx;
                const isCompleted = completedSteps[idx];

                return (
                  <div
                    key={step.label}
                    className={`flex items-center gap-3 text-[10px] md:text-xs font-sans ${
                      isActive
                        ? "text-text-primary font-semibold"
                        : isCompleted
                          ? "text-muted/70"
                          : "text-muted/45"
                    }`}
                  >
                    <span className="size-4 flex-shrink-0 relative">
                      <motion.span
                        initial={false}
                        animate={{
                          scale: isCompleted ? 1 : 0,
                          opacity: isCompleted ? 1 : 0,
                        }}
                        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
                        className="absolute inset-0 flex items-center justify-center text-[hsl(var(--accent))] font-bold text-[10px] md:text-xs"
                      >
                        ✓
                      </motion.span>
                      <motion.span
                        initial={false}
                        animate={{
                          scale: isActive ? 1 : 0,
                          opacity: isActive ? 1 : 0,
                        }}
                        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <span className="relative flex size-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--accent))] opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[hsl(var(--accent))]" />
                        </span>
                      </motion.span>
                      <motion.span
                        initial={false}
                        animate={{
                          scale: !isCompleted && !isActive ? 1 : 0,
                          opacity: !isCompleted && !isActive ? 0.4 : 0,
                        }}
                        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
                        className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-muted"
                      >
                        •
                      </motion.span>
                    </span>
                    <span
                      className={`text-pretty transition-transform duration-300 inline-block origin-left ${isActive ? "translate-x-1" : ""}`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Compact Active Phase Badge — Mobile Only */}
          {isMobile && (
            <div className="flex flex-col gap-1 text-left w-full select-none h-[64px] justify-center">
              {(() => {
                const displayIdx =
                  activeStepIdx >= 0
                    ? activeStepIdx
                    : completedSteps[BPMN_STEPS.length - 1]
                      ? BPMN_STEPS.length - 1
                      : 0;

                return (
                  <div className="flex items-center gap-3 text-xs text-text-primary font-sans h-full">
                    <span className="size-6 rounded-full bg-[hsl(var(--accent))]/10 border border-[hsl(var(--accent))]/20 flex items-center justify-center flex-shrink-0">
                      <span className="size-2 rounded-full bg-[hsl(var(--accent))] shadow-[0_0_10px_hsla(var(--accent),0.8)] animate-pulse" />
                    </span>
                    <div className="flex-1 min-w-0 relative overflow-hidden h-[50px]">
                      <motion.div
                        animate={{ y: -displayIdx * 50 }}
                        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
                        className="flex flex-col w-full"
                      >
                        {BPMN_STEPS.map((step, idx) => (
                          <div
                            key={step.label}
                            className="h-[50px] flex flex-col justify-center pr-2"
                          >
                            <span className="text-[9px] text-accent/80 font-bold uppercase tracking-wider mb-0.5">
                              Phase {idx + 1} of 7
                            </span>
                            <span className="text-text-primary font-semibold text-xs leading-snug block text-pretty">
                              {step.label}
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Right column: Large tabular counter & progress indicator */}
        <div className="md:col-span-6 flex flex-col items-start md:items-end gap-3 justify-end">
          <div className="flex items-baseline gap-1 select-none">
            <motion.span className="text-5xl md:text-7xl font-display text-text-primary tabular-nums leading-none min-w-[3ch] inline-block text-right">
              {displayText}
            </motion.span>
            <span className="text-lg md:text-2xl font-display text-muted/80">
              %
            </span>
          </div>

          {/* Micro progress line */}
          <div className="w-full max-w-xs h-[2px] bg-stroke/60 relative overflow-hidden rounded-full">
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-[hsl(var(--accent))]/70 to-[hsl(var(--accent))] origin-left"
              style={{
                scaleX: progressScale,
                width: "100%",
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
