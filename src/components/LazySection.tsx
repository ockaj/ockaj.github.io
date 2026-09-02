import { memo, useMemo, type ReactNode, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BoneSuspense } from "boneyard-js/react";
import type { SnapshotConfig } from "boneyard-js";
import { cn } from "../utils/cn";
import { getSkeletonHeights } from "../utils/bonesHelper";
import {
  SECTION_ANIMATE,
  SECTION_VIEWPORT,
  SECTION_TRANSITION,
} from "../utils/motionVariants";

interface LazySectionProps {
  id: string;
  header: ReactNode;
  headerClassName?: string;
  bonesName: string;
  children: ReactNode;
  snapshotConfig?: SnapshotConfig;
}

const DEFAULT_SNAPSHOT_CONFIG: SnapshotConfig = {
  excludeSelectors: ["[data-no-skeleton]"],
};

function LazySection({
  id,
  header,
  headerClassName = "relative z-30 px-6 md:px-10 lg:px-16",
  bonesName,
  children,
  snapshotConfig = DEFAULT_SNAPSHOT_CONFIG,
}: Readonly<LazySectionProps>) {
  const prefersReducedMotion = useReducedMotion();
  const initialStyle = { opacity: 0, y: prefersReducedMotion ? 0 : 30 };

  const containerStyle = useMemo<CSSProperties>(() => {
    const { mob, tab, desk } = getSkeletonHeights(bonesName);
    return {
      "--skeleton-min-h-mob": mob > 0 ? `${mob}px` : undefined,
      "--skeleton-min-h-tab": tab > 0 ? `${tab}px` : undefined,
      "--skeleton-min-h-desk": desk > 0 ? `${desk}px` : undefined,
    } as CSSProperties;
  }, [bonesName]);

  return (
    <section id={id} className="overflow-x-clip bg-transparent pt-16 md:pt-24">
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
          style={containerStyle}
          className="min-h-[var(--skeleton-min-h-mob)] md:min-h-[var(--skeleton-min-h-tab)] lg:min-h-[var(--skeleton-min-h-desk)]"
        >
          <BoneSuspense
            name={bonesName}
            select="viewport"
            snapshotConfig={snapshotConfig}
          >
            {children}
          </BoneSuspense>
        </motion.div>
      </div>
    </section>
  );
}

export default memo(LazySection);
