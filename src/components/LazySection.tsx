import { memo, type ReactNode, type RefObject } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BoneSuspense } from "boneyard-js/react";
import { SuspenseTrigger } from "../store/useAppStore";
import { cn } from "../utils/cn";

interface LazySectionProps {
  id: string;
  sectionRef: RefObject<HTMLElement | null>;
  header: ReactNode;
  headerClassName?: string;
  bonesName: string;
  skeletonHeight: number;
  isInView: boolean;
  children: ReactNode;
}

import {
  SECTION_ANIMATE,
  SECTION_VIEWPORT,
  SECTION_TRANSITION,
} from "../utils/motionVariants";

function LazySection({
  id,
  sectionRef,
  header,
  headerClassName = "relative z-30 px-6 md:px-10 lg:px-16",
  bonesName,
  skeletonHeight,
  isInView,
  children,
}: LazySectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const initialStyle = { opacity: 0, y: prefersReducedMotion ? 0 : 30 };

  return (
    <section
      ref={sectionRef}
      id={id}
      className="bg-transparent pt-16 md:pt-24 overflow-x-clip"
    >
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={initialStyle}
          whileInView={SECTION_ANIMATE}
          viewport={SECTION_VIEWPORT}
          transition={SECTION_TRANSITION}
          className={cn(
            "relative z-30 px-6 md:px-10 lg:px-16",
            headerClassName,
          )}
        >
          {header}
        </motion.div>
        <motion.div
          initial={initialStyle}
          whileInView={SECTION_ANIMATE}
          viewport={SECTION_VIEWPORT}
          transition={SECTION_TRANSITION}
        >
          <div style={{ minHeight: skeletonHeight }}>
            <BoneSuspense
              name={bonesName}
              className="min-h-[inherit]"
              fallback={
                <div className="px-6 md:px-10 lg:px-16">
                  <div style={{ height: skeletonHeight }} />
                </div>
              }
            >
              {isInView ? children : <SuspenseTrigger />}
            </BoneSuspense>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default memo(LazySection);
