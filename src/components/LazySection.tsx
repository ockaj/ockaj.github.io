import { memo, useMemo, type ReactNode, type RefObject } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BoneSuspense } from "boneyard-js/react";
import type { SnapshotConfig } from "boneyard-js";
import { SuspenseTrigger } from "../store/useAppStore";
import { cn } from "../utils/cn";

interface LazySectionProps {
  id: string;
  sectionRef: RefObject<HTMLElement | null>;
  header: ReactNode;
  headerClassName?: string;
  bonesName: string;
  isInView: boolean;
  children: ReactNode;
  snapshotConfig?: SnapshotConfig;
}

import {
  SECTION_ANIMATE,
  SECTION_VIEWPORT,
  SECTION_TRANSITION,
} from "../utils/motionVariants";

const DEFAULT_SNAPSHOT_CONFIG: SnapshotConfig = {
  excludeSelectors: ["[data-no-skeleton]"],
};

function LazySection({
  id,
  sectionRef,
  header,
  headerClassName = "relative z-30 px-6 md:px-10 lg:px-16",
  bonesName,
  isInView,
  children,
  snapshotConfig = DEFAULT_SNAPSHOT_CONFIG,
}: Readonly<LazySectionProps>) {
  const prefersReducedMotion = useReducedMotion();
  const initialStyle = useMemo(
    () => ({ opacity: 0, y: prefersReducedMotion ? 0 : 30 }),
    [prefersReducedMotion],
  );

  const content = isInView ? children : <SuspenseTrigger />;

  return (
    <section
      ref={sectionRef}
      id={id}
      className="overflow-x-clip bg-transparent pt-16 md:pt-24"
    >
      <div className="mx-auto max-w-[1200px]">
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
          <BoneSuspense name={bonesName} snapshotConfig={snapshotConfig}>
            {content}
          </BoneSuspense>
        </motion.div>
      </div>
    </section>
  );
}

export default memo(LazySection);
