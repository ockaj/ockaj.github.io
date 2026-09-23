import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  PROCESS_TOPICS,
  PROCESS_ITEMS,
  PROCESS_ITEMS_BY_ID,
} from "../../data/processItems";
import { useAppStore } from "../../store/useAppStore";
import ProcessLightbox from "../ProcessLightbox/ProcessLightbox";
import { prefetchAsset } from "../../utils/quicklink";
import { requestIdle, cancelIdle } from "../../utils/idleCallback";
import { isConnectionConstrained } from "../../utils/connection";
import { isBoneyardBuild } from "../../utils/boneyard";
import {
  containerStaggerVariants,
  SECTION_VIEWPORT,
} from "../../utils/motionVariants";
import { useIsDesktop } from "../../hooks/useMediaQuery";
import ProcessDesktopControls from "./ProcessDesktopControls";
import ProcessMobileControls from "./ProcessMobileControls";
import ProcessCarouselViewport from "./ProcessCarouselViewport";
import {
  ProcessLibraryContext,
  type ProcessLibraryContextValue,
} from "./ProcessLibraryContext";
import {
  getInitialProcessTopicId,
  getLightboxTopicId,
  useProcessTopicController,
} from "./useProcessTopicController";

const isBuildMode = isBoneyardBuild();
const containerVariants = containerStaggerVariants();

const INITIAL_TOPIC_IMAGES = new Set(
  PROCESS_TOPICS[0]
    ? [PROCESS_TOPICS[0].asis.image, PROCESS_TOPICS[0].tobe.image]
    : [],
);

function ProcessLibrary() {
  const isDesktop = useIsDesktop();
  const prefersReducedMotion = useReducedMotion();
  const activeLightboxId = useAppStore((state) =>
    state.activeModal?.startsWith("lightbox-")
      ? state.activeModal.slice("lightbox-".length)
      : null,
  );

  const [initialTopicId] = useState(() =>
    getInitialProcessTopicId(useAppStore.getState().activeModal),
  );
  const topicController = useProcessTopicController(initialTopicId);
  const { activeTopicId, activeTopic, direction, prevDisabled, nextDisabled } =
    topicController;

  const [viewModes, setViewModes] = useState<Record<number, "tobe" | "asis">>(
    () => {
      const modal = useAppStore.getState().activeModal;
      if (modal?.startsWith("lightbox-")) {
        const id = Number(modal.slice("lightbox-".length));
        const topicId = getLightboxTopicId(modal);
        if (topicId !== null && !Number.isNaN(id)) {
          return { [topicId]: id % 2 === 0 ? "tobe" : "asis" };
        }
      }
      return {};
    },
  );

  const handleTopicViewModeChange = useCallback(
    (topicId: number, mode: "tobe" | "asis") => {
      setViewModes((prev) =>
        prev[topicId] === mode ? prev : { ...prev, [topicId]: mode },
      );
    },
    [],
  );

  const lightboxItem = activeLightboxId
    ? (PROCESS_ITEMS_BY_ID.get(Number(activeLightboxId)) ?? null)
    : null;

  const [prevLightboxItem, setPrevLightboxItem] = useState(lightboxItem);
  const [displayedLightboxItem, setDisplayedLightboxItem] =
    useState(lightboxItem);

  if (lightboxItem !== prevLightboxItem) {
    setPrevLightboxItem(lightboxItem);
    if (lightboxItem !== null) {
      setDisplayedLightboxItem(lightboxItem);
    }
  }

  // Dismiss non-existent process lightbox deep links (e.g. #lightbox-999)
  useEffect(() => {
    if (activeLightboxId && !lightboxItem) {
      useAppStore.getState().closeModal();
      window.history.replaceState(window.history.state, "", "#processes");
    }
  }, [activeLightboxId, lightboxItem]);

  const handleOpenLightbox = useCallback(
    (item: {
      id: number;
      title: string;
      description: string;
      image: string;
      type: string;
    }) => {
      useAppStore.getState().openModal(`lightbox-${item.id}`);
    },
    [],
  );

  const handleCloseLightbox = useCallback(() => {
    useAppStore.getState().closeModal();
  }, []);

  const handleExitComplete = useCallback(() => {
    setDisplayedLightboxItem(null);
  }, []);

  const activeViewMode = viewModes[activeTopic.id] || "asis";

  useEffect(() => {
    if (isConnectionConstrained()) return;

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

  const contextValue = useMemo<ProcessLibraryContextValue>(
    () => ({
      state: {
        activeTopicId,
        activeTopic,
        activeViewMode,
        viewModes,
        direction,
        prevDisabled,
        nextDisabled,
        prefersReducedMotion,
      },
      actions: {
        ...topicController.actions,
        handleTopicViewModeChange,
        setLightboxItem: handleOpenLightbox,
      },
    }),
    [
      activeTopicId,
      activeTopic,
      activeViewMode,
      viewModes,
      direction,
      prevDisabled,
      nextDisabled,
      prefersReducedMotion,
      topicController.actions,
      handleTopicViewModeChange,
      handleOpenLightbox,
    ],
  );

  return (
    <ProcessLibraryContext value={contextValue}>
      <div className="px-6 md:px-10 lg:px-16">
        <motion.div
          custom={prefersReducedMotion}
          variants={containerVariants}
          initial={isBuildMode ? "visible" : "hidden"}
          whileInView={isBuildMode ? undefined : "visible"}
          viewport={isBuildMode ? undefined : SECTION_VIEWPORT}
          className="relative z-20 grid grid-cols-1 items-stretch gap-5 sm:gap-6 md:gap-8 lg:grid-cols-12 lg:gap-12"
        >
          {/* Left Column: Index Menu Selector (Desktop only) */}
          {isDesktop ? <ProcessDesktopControls /> : null}

          {/* Responsive Carousel Viewport */}
          <ProcessCarouselViewport />

          {/* Mobile Topic Selector Dock (Mobile only) */}
          {isDesktop ? null : <ProcessMobileControls />}
        </motion.div>
      </div>

      <ProcessLightbox
        open={Boolean(lightboxItem)}
        item={displayedLightboxItem}
        onClose={handleCloseLightbox}
        onExitComplete={handleExitComplete}
      />
    </ProcessLibraryContext>
  );
}

export default memo(ProcessLibrary);
