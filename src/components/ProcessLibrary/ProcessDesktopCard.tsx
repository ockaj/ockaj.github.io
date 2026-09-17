import { memo, type CSSProperties } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { InteractiveGlass } from "../LiquidGlass/LiquidGlass";
import { Tabs, Tab } from "../LiquidGlass/LiquidGlassTabs";
import ProcessVariantStage from "./ProcessVariantStage";
import { useProcessLibraryContext } from "./ProcessLibraryContext";
import { SPRING } from "../../utils/springConfig";

const DESKTOP_HIGHLIGHT_STYLE: CSSProperties = {
  "--base-radius": "8px",
} as CSSProperties;

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
          className="flex h-full w-full flex-col"
        >
          <InteractiveGlass
            as="div"
            roundedClass="rounded-2xl"
            className="h-full w-full touch-pan-y flex-col items-stretch justify-start p-5 text-left sm:p-7 md:p-8"
            tilt
          >
            {/* Canvas Header */}
            <div className="relative z-10 mb-5 flex w-full flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-display text-text-primary text-2xl leading-tight tracking-tight text-balance sm:text-3xl">
                {activeTopic.asis.title}
              </h3>

              {/* View Mode Segmented Control */}
              <div className="shrink-0 self-start sm:self-auto">
                <Tabs
                  value={activeViewMode}
                  onChange={(val: string | number) =>
                    handleTopicViewModeChange(
                      activeTopic.id,
                      val as "tobe" | "asis",
                    )
                  }
                  layoutId={`process-view-mode-pill-${activeTopic.id}`}
                  roundedClass="rounded-xl"
                  highlightStyle={DESKTOP_HIGHLIGHT_STYLE}
                  className="bg-surface/90 isolate inline-flex [transform:translateZ(0)] items-center rounded-xl border border-white/10 p-[4px] shadow-lg backdrop-blur-md select-none"
                  highlightClassName="bg-white/15 border border-white/20 shadow-md"
                >
                  <Tab
                    value="asis"
                    className="focus-visible:ring-accent relative flex h-8 cursor-pointer items-center justify-center rounded-lg px-3.5 text-sm font-semibold tracking-wider text-white/85 uppercase transition-colors duration-200 select-none before:absolute before:inset-x-0 before:-inset-y-1.5 hover:text-white focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-black focus-visible:outline-none sm:h-9 sm:px-4"
                    activeClassName="font-bold text-white"
                  >
                    <span>SOURCE</span>
                  </Tab>
                  <Tab
                    value="tobe"
                    className="focus-visible:ring-accent relative flex h-8 cursor-pointer items-center justify-center rounded-lg px-3.5 text-sm font-semibold tracking-wider text-white/85 uppercase transition-colors duration-200 select-none before:absolute before:inset-x-0 before:-inset-y-1.5 hover:text-white focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-black focus-visible:outline-none sm:h-9 sm:px-4"
                    activeClassName="font-bold text-white"
                  >
                    <span>OPTIMIZED</span>
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
