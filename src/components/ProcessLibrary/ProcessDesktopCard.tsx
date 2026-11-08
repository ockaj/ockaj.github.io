import { memo } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { InteractiveGlass } from "../LiquidGlass/LiquidGlass";
import ProcessCardHeader from "./ProcessCardHeader";
import ProcessVariantStage from "./ProcessVariantStage";
import {
  useProcessStore,
  selectActiveTopic,
  selectActiveViewMode,
} from "../../store/useProcessStore";
import { usePrefersReducedMotion } from "../../hooks/useMediaQuery";

import { SPRING } from "../../utils/springConfig";

interface CustomAnimationProps {
  prefersReducedMotion?: boolean | null;
  direction?: number;
}

const defaultTabContentVariants: Variants = {
  hidden: (props: CustomAnimationProps = {}) => ({
    opacity: 0,
    x: 0,
    y: 0,
    scale: props.prefersReducedMotion ? 1 : 0.99,
    transition: props.prefersReducedMotion ? { duration: 0.15 } : SPRING.exit,
  }),
  visible: (props: CustomAnimationProps = {}) => ({
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: props.prefersReducedMotion ? { duration: 0.15 } : SPRING.modal,
  }),
  exit: (props: CustomAnimationProps = {}) => ({
    opacity: 0,
    x: 0,
    y: 0,
    scale: props.prefersReducedMotion ? 1 : 0.99,
    transition: props.prefersReducedMotion ? { duration: 0.15 } : SPRING.exit,
  }),
};

interface LightboxTargetItem {
  id: number;
  title: string;
  description: string;
  image: string;
  type: string;
}

interface ProcessDesktopCardProps {
  tabContentVariants?: Variants;
  onOpenLightbox: (item: LightboxTargetItem) => void;
}

function ProcessDesktopCard({
  tabContentVariants = defaultTabContentVariants,
  onOpenLightbox,
}: Readonly<ProcessDesktopCardProps>) {
  const activeTopic = useProcessStore(selectActiveTopic);
  const activeViewMode = useProcessStore(selectActiveViewMode);
  const direction = useProcessStore((state) => state.direction);
  const setViewMode = useProcessStore((state) => state.setViewMode);
  const prefersReducedMotion = usePrefersReducedMotion();
  return (
    <div className="flex w-full min-w-0 flex-col justify-center lg:col-span-7">
      <AnimatePresence
        mode="wait"
        initial={false}
        custom={{ prefersReducedMotion, direction }}
      >
        <motion.div
          key={activeTopic.id}
          id={`tabpanel-${activeTopic.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTopic.id}`}
          custom={{ prefersReducedMotion, direction }}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={tabContentVariants}
          className="flex w-full flex-col"
        >
          <InteractiveGlass
            as="div"
            roundedClass="rounded-2xl"
            className="w-full touch-pan-y flex-col items-stretch justify-start p-8 text-left"
            tilt
          >
            <ProcessCardHeader
              topicId={activeTopic.id}
              title={activeTopic.source.title}
              viewMode={activeViewMode}
              onViewModeChange={setViewMode}
            />

            {/* Zero-Unmount Layer Staged Content */}
            <ProcessVariantStage
              topic={activeTopic}
              activeViewMode={activeViewMode}
              setLightboxItem={onOpenLightbox}
            />
          </InteractiveGlass>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default memo(ProcessDesktopCard);
