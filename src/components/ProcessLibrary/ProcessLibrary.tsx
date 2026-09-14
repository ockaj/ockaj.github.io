import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  useMemo,
  memo,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
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
  cardStaggerVariants,
  SECTION_VIEWPORT,
} from "../../utils/motionVariants";
import ProcessDesktopCard from "./ProcessDesktopCard";
import ProcessMobileCarousel from "./ProcessMobileCarousel";
import ProcessTopicMenu from "./ProcessTopicMenu";
import ProcessMobileControls from "./ProcessMobileControls";
import {
  ProcessLibraryContext,
  type ProcessLibraryContextValue,
} from "./ProcessLibraryContext";

const isBuildMode = isBoneyardBuild();
const containerVariants = containerStaggerVariants();
const cardVariants = cardStaggerVariants;

const PROCESS_TOPIC_MAP = new Map(
  PROCESS_TOPICS.map((topic) => [topic.id, topic]),
);
const PROCESS_TOPIC_INDEX_MAP = new Map(
  PROCESS_TOPICS.map((topic, index) => [topic.id, index]),
);
const INITIAL_TOPIC_IMAGES = new Set(
  PROCESS_TOPICS[0]
    ? [PROCESS_TOPICS[0].asis.image, PROCESS_TOPICS[0].tobe.image]
    : [],
);

function ProcessLibrary() {
  const prefersReducedMotion = useReducedMotion();
  const activeLightboxId = useAppStore((state) =>
    state.activeModal?.startsWith("lightbox-")
      ? state.activeModal.slice("lightbox-".length)
      : null,
  );

  const [activeTopicId, setActiveTopicId] = useState(() => {
    const modal = useAppStore.getState().activeModal;
    if (modal?.startsWith("lightbox-")) {
      const id = Number(modal.slice("lightbox-".length));
      if (!Number.isNaN(id)) {
        const topicId = Math.ceil(id / 2);
        if (PROCESS_TOPIC_MAP.has(topicId)) return topicId;
      }
    }
    return PROCESS_TOPICS[0].id;
  });
  const activeTopicIdRef = useRef(activeTopicId);
  useLayoutEffect(() => {
    activeTopicIdRef.current = activeTopicId;
  }, [activeTopicId]);

  const [viewModes, setViewModes] = useState<Record<number, "tobe" | "asis">>(
    () => {
      const modal = useAppStore.getState().activeModal;
      if (modal?.startsWith("lightbox-")) {
        const id = Number(modal.slice("lightbox-".length));
        if (!Number.isNaN(id)) {
          const topicId = Math.ceil(id / 2);
          if (PROCESS_TOPIC_MAP.has(topicId)) {
            return { [topicId]: id % 2 === 0 ? "tobe" : "asis" };
          }
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

  const [direction, setDirection] = useState(1);

  const activeTopic = PROCESS_TOPIC_MAP.get(activeTopicId) ?? PROCESS_TOPICS[0];
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

  const handleTopicChange = useCallback((id: number) => {
    const newIdx = PROCESS_TOPIC_INDEX_MAP.get(id) ?? -1;
    if (newIdx === -1) return;

    const oldIdx = PROCESS_TOPIC_INDEX_MAP.get(activeTopicIdRef.current) ?? -1;
    if (oldIdx !== -1 && newIdx !== oldIdx) {
      setDirection(newIdx > oldIdx ? 1 : -1);
    }
    activeTopicIdRef.current = id;
    setActiveTopicId((prevId) => (prevId === id ? prevId : id));
  }, []);

  const handlePrevTopic = useCallback(() => {
    setDirection(-1);
    setActiveTopicId((prevId) => {
      const currentIndex = PROCESS_TOPIC_INDEX_MAP.get(prevId) ?? -1;
      if (currentIndex > 0) {
        return PROCESS_TOPICS[currentIndex - 1].id;
      }
      return prevId;
    });
  }, []);

  const handleNextTopic = useCallback(() => {
    setDirection(1);
    setActiveTopicId((prevId) => {
      const currentIndex = PROCESS_TOPIC_INDEX_MAP.get(prevId) ?? -1;
      if (currentIndex >= 0 && currentIndex < PROCESS_TOPICS.length - 1) {
        return PROCESS_TOPICS[currentIndex + 1].id;
      }
      return prevId;
    });
  }, []);

  const prevDisabled = activeTopicId === PROCESS_TOPICS[0].id;
  const nextDisabled =
    activeTopicId === PROCESS_TOPICS[PROCESS_TOPICS.length - 1].id;

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
        cardVariants,
      },
      actions: {
        onTopicChange: handleTopicChange,
        onPrevTopic: handlePrevTopic,
        onNextTopic: handleNextTopic,
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
      handleTopicChange,
      handlePrevTopic,
      handleNextTopic,
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
          {/* Left Column: Index Menu Selector */}
          <ProcessTopicMenu />

          {/* Mobile Column: CSS Scroll Snap Carousel */}
          <ProcessMobileCarousel />

          {/* Desktop Right Column: Display Stage */}
          <ProcessDesktopCard />

          {/* Mobile Topic Selector Dock */}
          <ProcessMobileControls />
        </motion.div>
      </div>

      <AnimatePresence>
        {lightboxItem ? (
          <ProcessLightbox
            key={lightboxItem.id}
            item={lightboxItem}
            onClose={handleCloseLightbox}
          />
        ) : null}
      </AnimatePresence>
    </ProcessLibraryContext>
  );
}

export default memo(ProcessLibrary);
