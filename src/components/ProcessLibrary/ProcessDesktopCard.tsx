import { memo } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { InteractiveGlass } from "../LiquidGlass/LiquidGlass";
import { Tabs, Tab } from "../LiquidGlass/LiquidGlassTabs";
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
    cardVariants,
  } = state;
  const { handleTopicViewModeChange, setLightboxItem } = actions;
  return (
    <motion.div
      variants={cardVariants}
      custom={prefersReducedMotion}
      className="hidden w-full min-w-0 flex-col justify-center lg:col-span-7 lg:flex"
    >
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
            {/* Canvas Header */}
            <div className="relative z-10 mb-6 flex w-full flex-row items-center justify-between">
              <h3 className="font-display text-3xl leading-tight tracking-tight text-balance text-text-primary">
                {activeTopic.asis.title}
              </h3>

              {/* View Mode Segmented Control */}
              <div className="shrink-0 self-auto">
                <Tabs
                  value={activeViewMode}
                  onChange={(val: string | number) =>
                    handleTopicViewModeChange(
                      activeTopic.id,
                      val as "tobe" | "asis",
                    )
                  }
                  layoutId={`process-view-mode-pill-${activeTopic.id}`}
                  variant="segmented"
                  roundedClass="rounded-xl"
                  className="isolate inline-flex transform-gpu items-center rounded-xl border border-white/10 bg-surface/90 p-1 shadow-lg backdrop-blur-md select-none"
                  highlightClassName="bg-white/15 border border-white/20 shadow-md"
                >
                  <Tab
                    value="asis"
                    roundedClass="rounded-lg"
                    className="relative flex h-9 cursor-pointer items-center justify-center rounded-lg px-4 text-sm font-medium tracking-wide text-white/80 transition-colors duration-200 select-none before:absolute before:inset-x-0 before:-inset-y-1.5 hover:text-white focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-black focus-visible:outline-none"
                    activeClassName="font-semibold text-white"
                  >
                    <span>Source</span>
                  </Tab>
                  <Tab
                    value="tobe"
                    roundedClass="rounded-lg"
                    className="relative flex h-9 cursor-pointer items-center justify-center rounded-lg px-4 text-sm font-medium tracking-wide text-white/80 transition-colors duration-200 select-none before:absolute before:inset-x-0 before:-inset-y-1.5 hover:text-white focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-black focus-visible:outline-none"
                    activeClassName="font-semibold text-white"
                  >
                    <span>Optimized</span>
                  </Tab>
                </Tabs>
              </div>
            </div>

            {/* Zero-Unmount Layer Staged Content */}
            <ProcessVariantStage
              topic={activeTopic}
              activeViewMode={activeViewMode}
              setLightboxItem={setLightboxItem}
            />
          </InteractiveGlass>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export default memo(ProcessDesktopCard);
