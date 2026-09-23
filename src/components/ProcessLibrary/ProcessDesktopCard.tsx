import { memo } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { InteractiveGlass } from "../LiquidGlass/LiquidGlass";
import ProcessCardHeader from "./ProcessCardHeader";
import ProcessVariantStage from "./ProcessVariantStage";
import { useProcessLibraryContext } from "./ProcessLibraryContext";
import { SPRING } from "../../utils/springConfig";

interface CustomAnimationProps {
  prefersReducedMotion?: boolean | null;
  direction?: number;
}

const defaultTabContentVariants: Variants = {
  hidden: (props: CustomAnimationProps = {}) => ({
    opacity: 0,
    x: 0,
    y: props.prefersReducedMotion ? 0 : 10 * (props.direction ?? 1),
    scale: props.prefersReducedMotion ? 1 : 0.99,
    transition: SPRING.exit,
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: SPRING.modal,
  },
  exit: (props: CustomAnimationProps = {}) => ({
    opacity: 0,
    x: 0,
    y: props.prefersReducedMotion ? 0 : -10 * (props.direction ?? 1),
    scale: props.prefersReducedMotion ? 1 : 0.99,
    transition: SPRING.exit,
  }),
};

interface ProcessDesktopCardProps {
  tabContentVariants?: Variants;
}

function ProcessDesktopCard({
  tabContentVariants = defaultTabContentVariants,
}: Readonly<ProcessDesktopCardProps> = {}) {
  const { state, actions } = useProcessLibraryContext();
  const {
    activeTopic,
    activeViewMode,
    prefersReducedMotion,
    direction,
  } = state;
  const { handleTopicViewModeChange, setLightboxItem } = actions;
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
          className="flex size-full flex-col"
        >
          <InteractiveGlass
            as="div"
            roundedClass="rounded-2xl"
            className="size-full touch-pan-y flex-col items-stretch justify-start p-8 text-left"
            tilt
          >
            <ProcessCardHeader
              topicId={activeTopic.id}
              title={activeTopic.asis.title}
              viewMode={activeViewMode}
              onViewModeChange={handleTopicViewModeChange}
            />

            {/* Zero-Unmount Layer Staged Content */}
            <ProcessVariantStage
              topic={activeTopic}
              activeViewMode={activeViewMode}
              setLightboxItem={setLightboxItem}
            />
          </InteractiveGlass>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default memo(ProcessDesktopCard);
