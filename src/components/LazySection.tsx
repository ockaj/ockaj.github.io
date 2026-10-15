import {
  memo,
  useState,
  useEffect,
  useLayoutEffect,
  useEffectEvent,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import { Skeleton, BoneSuspense } from "boneyard-js/react";
import type { SnapshotConfig } from "boneyard-js";
import { cn } from "../utils/cn";
import { getSkeletonStyle } from "../utils/bonesHelper";
import { isBoneyardBuild } from "../utils/boneyard";
import { requestIdle, cancelIdle } from "../utils/idleCallback";
import { useAppStore } from "../store/useAppStore";
import {
  SECTION_ANIMATE,
  SECTION_VIEWPORT,
  SECTION_TRANSITION,
} from "../utils/motionVariants";
import { getConnectionRootMargin } from "../utils/connection";
import { resolveSectionFromHash } from "../utils/sectionResolution";

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

const INITIAL_STYLE_MOTION = { opacity: 0, y: 30 };
const INITIAL_STYLE_REDUCED = { opacity: 0, y: 0 };
const REDUCED_SECTION_TRANSITION = { duration: 0.15 };

type SectionLoadPhase = "idle" | "loading" | "ready";

function isInitialTarget(id: string): boolean {
  if (isBoneyardBuild()) return true;
  if (typeof window === "undefined") return false;
  if (typeof IntersectionObserver === "undefined") return true;
  try {
    const target = resolveSectionFromHash(window.location.hash);
    return target === id;
  } catch {
    return false;
  }
}

function getInitialLoadPhase(id: string): SectionLoadPhase {
  if (isBoneyardBuild()) return "ready";
  return isInitialTarget(id) ? "loading" : "idle";
}

function SuspenseContentBoundary({
  onReady,
  children,
}: Readonly<{
  onReady: () => void;
  children: ReactNode;
}>) {
  const notifyReady = useEffectEvent(onReady);

  useLayoutEffect(() => {
    notifyReady();
  }, []);

  return children;
}

function LazySection({
  id,
  header,
  headerClassName = "relative z-30 px-6 md:px-10 lg:px-16",
  bonesName,
  children,
  snapshotConfig = DEFAULT_SNAPSHOT_CONFIG,
}: Readonly<LazySectionProps>) {
  const prefersReducedMotion = useReducedMotion();
  const initialStyle = prefersReducedMotion
    ? INITIAL_STYLE_REDUCED
    : INITIAL_STYLE_MOTION;
  const sectionTransition = prefersReducedMotion
    ? REDUCED_SECTION_TRANSITION
    : SECTION_TRANSITION;

  const [loadPhase, setLoadPhase] = useState<SectionLoadPhase>(() =>
    getInitialLoadPhase(id),
  );
  const hasLoaded = loadPhase !== "idle";
  const isContentReady = loadPhase === "ready";
  const sectionRef = useRef<HTMLElement | null>(null);

  const handleContentReady = useCallback(() => {
    setLoadPhase("ready");
  }, []);

  useEffect(() => {
    if (hasLoaded) return;

    const el = sectionRef.current;
    if (!el) return;

    let idleId: number | null = null;
    const rootMargin = getConnectionRootMargin();

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          observer.disconnect();
          idleId = requestIdle(
            () => {
              idleId = null;
              setLoadPhase((prev) => (prev === "idle" ? "loading" : prev));
            },
            { timeout: 1000 },
          );
        }
      },
      { rootMargin },
    );

    observer.observe(el);

    const unsubscribe = useAppStore.subscribe((state) => {
      if (state.activeSection === id) {
        setLoadPhase((prev) => (prev === "idle" ? "loading" : prev));
      }
    });

    return () => {
      observer.disconnect();
      unsubscribe();
      if (idleId !== null) {
        cancelIdle(idleId);
      }
    };
  }, [id, hasLoaded]);

  const containerStyle = isContentReady
    ? undefined
    : getSkeletonStyle(bonesName);

  return (
    <section
      id={id}
      ref={sectionRef}
      className="overflow-x-clip bg-transparent pt-16 md:pt-24"
    >
      <div className="mx-auto max-w-300">
        <motion.div
          initial={initialStyle}
          whileInView={SECTION_ANIMATE}
          viewport={SECTION_VIEWPORT}
          transition={sectionTransition}
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
          transition={sectionTransition}
          style={containerStyle}
          className={cn(
            !isContentReady &&
              "min-h-(--skeleton-min-h-mob) [overflow-anchor:none] md:min-h-(--skeleton-min-h-tab) lg:min-h-(--skeleton-min-h-desk) xl:min-h-(--skeleton-min-h-wide)",
          )}
        >
          {hasLoaded ? (
            <BoneSuspense
              name={bonesName}
              select="viewport"
              snapshotConfig={snapshotConfig}
            >
              <SuspenseContentBoundary onReady={handleContentReady}>
                {children}
              </SuspenseContentBoundary>
            </BoneSuspense>
          ) : (
            <Skeleton
              loading={true}
              name={bonesName}
              select="viewport"
              snapshotConfig={snapshotConfig}
            >
              {null}
            </Skeleton>
          )}
        </motion.div>
      </div>
    </section>
  );
}

export default memo(LazySection);
