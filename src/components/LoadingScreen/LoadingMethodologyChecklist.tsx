import { motion } from "motion/react";
import { cn } from "../../utils/cn";
import { BPMN_STEPS } from "./loadingData";

function getStepColorClass(isActive: boolean, isCompleted: boolean) {
  if (isActive) return "text-text-primary font-semibold";
  if (isCompleted) return "text-muted/70";
  return "text-muted/45";
}

function getMobileDisplayIdx(activeStepIdx: number, isLastCompleted: boolean) {
  if (activeStepIdx >= 0) return activeStepIdx;
  if (isLastCompleted) return BPMN_STEPS.length - 1;
  return 0;
}

interface LoadingMethodologyChecklistProps {
  isMobile: boolean;
  activeStepIdx: number;
  completedSteps: boolean[];
}

export default function LoadingMethodologyChecklist({
  isMobile,
  activeStepIdx,
  completedSteps,
}: Readonly<LoadingMethodologyChecklistProps>) {
  return (
    <div className="flex flex-col items-start gap-3 md:col-span-6">
      <span className="text-muted/70 font-sans text-xs font-semibold uppercase">
        Process Modeling Methodology
      </span>
      {/* Methodology checklist — Desktop Only */}
      {!isMobile ? (
        <div className="flex w-full max-w-md flex-col gap-1.5 text-left select-none md:gap-2">
          {BPMN_STEPS.map((step, idx) => {
            const isActive = activeStepIdx === idx;
            const isCompleted = completedSteps[idx];

            return (
              <div
                key={step.label}
                className={cn(
                  "flex items-center gap-3 font-sans text-xs",
                  getStepColorClass(isActive, isCompleted),
                )}
              >
                <span className="relative size-4 flex-shrink-0">
                  <motion.span
                    initial={false}
                    animate={{
                      scale: isCompleted ? 1 : 0,
                      opacity: isCompleted ? 1 : 0,
                    }}
                    transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
                    className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[hsl(var(--accent))]"
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
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--accent))] opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
                    </span>
                  </motion.span>
                  <motion.span
                    initial={false}
                    animate={{
                      scale: !isCompleted && !isActive ? 1 : 0,
                      opacity: !isCompleted && !isActive ? 0.4 : 0,
                    }}
                    transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
                    className="text-muted absolute inset-0 flex items-center justify-center font-mono text-xs"
                  >
                    •
                  </motion.span>
                </span>
                <span
                  className={cn(
                    "inline-block origin-left text-pretty transition-transform duration-300",
                    isActive && "translate-x-1",
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Compact Active Phase Badge — Mobile Only */}
      {isMobile ? (
        <div className="flex h-[64px] w-full flex-col justify-center gap-1 text-left select-none">
          {(() => {
            const displayIdx = getMobileDisplayIdx(
              activeStepIdx,
              completedSteps[BPMN_STEPS.length - 1],
            );

            return (
              <div className="text-text-primary flex h-full items-center gap-3 font-sans text-xs">
                <span className="flex size-6 flex-shrink-0 items-center justify-center rounded-full border border-[hsl(var(--accent))]/20 bg-[hsl(var(--accent))]/10">
                  <span className="size-2 animate-pulse rounded-full bg-[hsl(var(--accent))] shadow-[0_0_10px_hsla(var(--accent),0.8)]" />
                </span>
                <div className="relative h-[50px] min-w-0 flex-1 overflow-hidden">
                  <motion.div
                    animate={{ y: -displayIdx * 50 }}
                    transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
                    className="flex w-full flex-col"
                  >
                    {BPMN_STEPS.map((step, idx) => (
                      <div
                        key={step.label}
                        className="flex h-[50px] flex-col justify-center pr-2"
                      >
                        <span className="text-accent/80 mb-0.5 text-xs font-bold tracking-wider uppercase">
                          Phase {idx + 1} of 7
                        </span>
                        <span className="text-text-primary block text-xs leading-snug font-semibold text-pretty">
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
      ) : null}
    </div>
  );
}
