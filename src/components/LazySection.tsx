import { memo, type ReactNode, type RefObject } from "react";
import { motion } from "motion/react";
import { BoneSuspense } from "boneyard-js/react";
import { SuspenseTrigger } from "../appReducer";

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

const SECTION_INITIAL = { opacity: 0, y: 30 };
const SECTION_ANIMATE = { opacity: 1, y: 0 };
const SECTION_VIEWPORT = { once: true, margin: "-100px" } as const;
const SECTION_TRANSITION = { duration: 1, ease: [0.25, 0.1, 0.25, 1] as const };

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
  return (
    <section
      ref={sectionRef}
      id={id}
      className="bg-transparent pt-16 md:pt-24 scroll-mt-20 md:scroll-mt-24"
    >
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={SECTION_INITIAL}
          whileInView={SECTION_ANIMATE}
          viewport={SECTION_VIEWPORT}
          transition={SECTION_TRANSITION}
          className={headerClassName}
        >
          {header}
        </motion.div>
        <motion.div
          initial={SECTION_INITIAL}
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
