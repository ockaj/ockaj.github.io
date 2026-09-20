import { motion } from "motion/react";
import { cn } from "../../utils/cn";
import { EASE } from "../../utils/springConfig";
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
      <span className="font-sans text-sm font-semibold text-muted/80">
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
                  "flex items-center gap-3 font-sans text-sm",
                  getStepColorClass(isActive, isCompleted),
                )}
              >
                <span className="relative size-4 shrink-0">
                  <motion.span
                    initial={false}
                    animate={{
                      scale: isCompleted ? 1 : 0,
                      opacity: isCompleted ? 1 : 0,
                    }}
                    transition={{ ease: EASE.out, duration: 0.4 }}
                    className="absolute inset-0 flex items-center justify-center text-sm font-bold text-accent"
                  >
                    ✓
                  </motion.span>
                  <motion.span
                    initial={false}
                    animate={{
                      scale: isActive ? 1 : 0,
                      opacity: isActive ? 1 : 0,
                    }}
                    transition={{ ease: EASE.out, duration: 0.4 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="relative flex size-1.5">
                      {isActive ? (
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
                      ) : null}
                      <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
                    </span>
                  </motion.span>
                  <motion.span
                    initial={false}
                    animate={{
                      scale: !isCompleted && !isActive ? 1 : 0,
                      opacity: !isCompleted && !isActive ? 0.4 : 0,
                    }}
                    transition={{ ease: EASE.out, duration: 0.4 }}
                    className="absolute inset-0 flex items-center justify-center font-mono text-sm text-muted"
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
        <div className="flex h-16 w-full flex-col justify-center gap-1 text-left select-none">
          {(() => {
            const displayIdx = getMobileDisplayIdx(
              activeStepIdx,
              completedSteps[BPMN_STEPS.length - 1],
            );

            return (
              <div className="flex h-full items-center gap-3 font-sans text-sm text-text-primary">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10">
                  <span className="size-2 animate-pulse rounded-full bg-accent shadow-glow-accent" />
                </span>
                <div className="relative h-checklist-slot min-w-0 flex-1 overflow-hidden">
                  <motion.div
                    animate={{ y: -displayIdx * 50 }}
                    transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
                    className="flex w-full flex-col"
                  >
                    {BPMN_STEPS.map((step, idx) => (
                      <div
                        key={step.label}
                        className="flex h-checklist-slot flex-col justify-center pr-2"
                      >
                        <span className="mb-0.5 text-sm font-bold tracking-wider text-accent/80 uppercase">
                          Phase {idx + 1} of 7
                        </span>
                        <span className="block text-sm leading-snug font-semibold text-pretty text-text-primary">
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
