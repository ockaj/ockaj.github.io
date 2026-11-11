import { useEffect, memo } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  PROCESS_TOPICS,
  PROCESS_ITEMS,
  PROCESS_ITEMS_BY_ID,
} from "../../data/processItems";
import { useEntityModal } from "../../hooks/useEntityModal";
import ProcessLightbox from "../ProcessLightbox/ProcessLightbox";
import { InteractiveGlass } from "../LiquidGlass/Glass";
import { prefetchAsset } from "../../utils/quicklink";
import { requestIdle, cancelIdle } from "../../utils/idleCallback";
import { isConnectionConstrained } from "../../utils/connection";
import { isBoneyardBuild } from "../../utils/boneyard";
import {
  containerStaggerVariants,
  SECTION_VIEWPORT,
} from "../../utils/motionVariants";
import { useIsDesktop } from "../../hooks/useMediaQuery";
import ProcessDesktopCard from "./ProcessDesktopCard";
import ProcessDesktopControls from "./ProcessDesktopControls";
import ProcessMobileCarousel from "./ProcessMobileCarousel";
import ProcessMobileControls from "./ProcessMobileControls";
import {
  useProcessStore,
  selectActiveTopic,
} from "../../store/useProcessStore";

const isBuildMode = isBoneyardBuild();
const containerVariants = containerStaggerVariants();

const INITIAL_TOPIC_IMAGES = new Set(
  PROCESS_TOPICS[0]
    ? [PROCESS_TOPICS[0].source.image, PROCESS_TOPICS[0].optimized.image]
    : [],
);

function ProcessLibrary() {
  const isDesktop = useIsDesktop();
  const prefersReducedMotion = useReducedMotion();
  const {
    open: openLightbox,
    selected: selectedLightboxItem,
    displayed: displayedLightboxItem,
    drawerProps: lightboxDrawerProps,
  } = useEntityModal("lightbox", PROCESS_ITEMS_BY_ID);

  const activeTopic = useProcessStore(selectActiveTopic);

  useEffect(() => {
    if (selectedLightboxItem) {
      useProcessStore.getState().syncModal(selectedLightboxItem);
    }
  }, [selectedLightboxItem]);

  useEffect(() => {
    if (PROCESS_ITEMS.length === 0 || isConnectionConstrained()) return;

    const handle = requestIdle(
      () => {
        PROCESS_ITEMS.forEach((item) => {
          if (!INITIAL_TOPIC_IMAGES.has(item.image)) {
            prefetchAsset(item.image);
          }
        });
      },
      { timeout: 2000 },
    );

    return () => {
      cancelIdle(handle);
    };
  }, []);

  if (PROCESS_TOPICS.length === 0 || !activeTopic) {
    return (
      <div className="px-6 md:px-10 lg:px-16">
        <InteractiveGlass
          as="div"
          roundedClass="rounded-2xl"
          className="flex min-h-60 w-full flex-col items-center justify-center p-8 text-center text-muted sm:min-h-72"
          tilt
        >
          <p className="text-base font-medium">
            No process models currently available.
          </p>
        </InteractiveGlass>
      </div>
    );
  }

  return (
    <>
      <div className="px-6 md:px-10 lg:px-16">
        <motion.div
          custom={prefersReducedMotion}
          variants={containerVariants}
          initial={isBuildMode ? "visible" : "hidden"}
          whileInView={isBuildMode ? undefined : "visible"}
          viewport={isBuildMode ? undefined : SECTION_VIEWPORT}
          className="relative z-20 grid grid-cols-1 items-stretch gap-5 sm:gap-6 md:gap-8 lg:min-h-160 lg:grid-cols-12 lg:gap-12"
        >
          {isDesktop ? (
            <>
              {/* Left Column: Index Menu Selector */}
              <ProcessDesktopControls />

              {/* Right Column: Process Interactive Card */}
              <ProcessDesktopCard onOpenLightbox={openLightbox} />
            </>
          ) : (
            <>
              {/* Responsive Carousel Viewport */}
              <ProcessMobileCarousel onOpenLightbox={openLightbox} />

              {/* Mobile Topic Selector Dock */}
              <ProcessMobileControls />
            </>
          )}
        </motion.div>
      </div>

      <ProcessLightbox item={displayedLightboxItem} {...lightboxDrawerProps} />
    </>
  );
}

export default memo(ProcessLibrary);
