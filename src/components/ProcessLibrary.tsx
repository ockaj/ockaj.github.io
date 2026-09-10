import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { PROCESS_TOPICS, PROCESS_ITEMS } from "../data/processItems";
import { useAppStore } from "../store/useAppStore";
import ProcessLightbox from "./ProcessLightbox/ProcessLightbox";
import useEmblaCarousel from "embla-carousel-react";
import { prefetchAsset } from "../utils/quicklink";
import { requestIdle, cancelIdle } from "../utils/idleCallback";
import { isConnectionConstrained } from "../utils/connection";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { isBoneyardBuild } from "../utils/boneyard";
import {
  containerStaggerVariants,
  cardStaggerVariants,
  SECTION_VIEWPORT,
} from "../utils/motionVariants";
import ProcessDesktopCard from "./ProcessLibrary/ProcessDesktopCard";
import ProcessMobileCarousel from "./ProcessLibrary/ProcessMobileCarousel";
import ProcessTopicMenu from "./ProcessLibrary/ProcessTopicMenu";
import ProcessMobileControls from "./ProcessLibrary/ProcessMobileControls";

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

  const lightboxItem = useMemo(() => {
    if (!activeLightboxId) return null;
    const id = Number(activeLightboxId);
    if (Number.isNaN(id)) return null;
    return PROCESS_ITEMS.find((item) => item.id === id) ?? null;
  }, [activeLightboxId]);

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

  const isMobile = !useMediaQuery("(min-width: 1024px)");

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "center",
    containScroll: false,
  });

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

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      const selectedIdx = emblaApi.selectedScrollSnap();
      const targetTopic = PROCESS_TOPICS[selectedIdx];
      if (targetTopic) {
        setActiveTopicId((prevId) =>
          prevId === targetTopic.id ? prevId : targetTopic.id,
        );
      }
    };

    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const handleTopicChange = useCallback(
    (id: number) => {
      const newIdx = PROCESS_TOPIC_INDEX_MAP.get(id) ?? -1;
      if (newIdx === -1) return;

      const oldIdx =
        PROCESS_TOPIC_INDEX_MAP.get(activeTopicIdRef.current) ?? -1;
      if (oldIdx !== -1 && newIdx !== oldIdx) {
        setDirection(newIdx > oldIdx ? 1 : -1);
        if (emblaApi && isMobile) {
          emblaApi.scrollTo(newIdx);
        }
      }
      activeTopicIdRef.current = id;
      setActiveTopicId((prevId) => (prevId === id ? prevId : id));
    },
    [emblaApi, isMobile],
  );

  const handlePrevTopic = useCallback(() => {
    if (isMobile && emblaApi) {
      emblaApi.scrollPrev();
      return;
    }
    setDirection(-1);
    setActiveTopicId((prevId) => {
      const currentIndex = PROCESS_TOPIC_INDEX_MAP.get(prevId) ?? -1;
      if (currentIndex > 0) {
        return PROCESS_TOPICS[currentIndex - 1].id;
      }
      return prevId;
    });
  }, [isMobile, emblaApi]);

  const handleNextTopic = useCallback(() => {
    if (isMobile && emblaApi) {
      emblaApi.scrollNext();
      return;
    }
    setDirection(1);
    setActiveTopicId((prevId) => {
      const currentIndex = PROCESS_TOPIC_INDEX_MAP.get(prevId) ?? -1;
      if (currentIndex >= 0 && currentIndex < PROCESS_TOPICS.length - 1) {
        return PROCESS_TOPICS[currentIndex + 1].id;
      }
      return prevId;
    });
  }, [isMobile, emblaApi]);

  return (
    <>
      <div className="px-6 md:px-10 lg:px-16">
        <motion.div
          custom={prefersReducedMotion}
          variants={containerVariants}
          initial={isBuildMode ? "visible" : "hidden"}
          whileInView={isBuildMode ? undefined : "visible"}
          viewport={isBuildMode ? undefined : SECTION_VIEWPORT}
          className="relative z-20 grid grid-cols-1 items-stretch gap-8 md:gap-12 lg:grid-cols-12"
        >
          {/* Left Column: Index Menu Selector */}
          <ProcessTopicMenu
            activeTopicId={activeTopicId}
            onTopicChange={handleTopicChange}
            cardVariants={cardVariants}
            prefersReducedMotion={prefersReducedMotion}
          />

          {/* Mobile Column: Embla Carousel */}
          {isMobile ? (
            <ProcessMobileCarousel
              emblaRef={emblaRef}
              viewModes={viewModes}
              handleTopicViewModeChange={handleTopicViewModeChange}
              setLightboxItem={handleOpenLightbox}
              prefersReducedMotion={prefersReducedMotion}
            />
          ) : null}

          {/* Desktop Right Column: Display Stage */}
          <ProcessDesktopCard
            activeTopic={activeTopic}
            activeViewMode={activeViewMode}
            handleTopicViewModeChange={handleTopicViewModeChange}
            setLightboxItem={handleOpenLightbox}
            prefersReducedMotion={prefersReducedMotion}
            direction={direction}
            cardVariants={cardVariants}
          />

          {/* Mobile Topic Selector Dock */}
          <ProcessMobileControls
            activeTopic={activeTopic}
            activeTopicId={activeTopicId}
            onPrevTopic={handlePrevTopic}
            onNextTopic={handleNextTopic}
          />
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
    </>
  );
}

export default memo(ProcessLibrary);
