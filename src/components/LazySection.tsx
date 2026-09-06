import {
  memo,
  useMemo,
  useState,
  useEffect,
  useRef,
  type ReactNode,
  type CSSProperties,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import { Skeleton, BoneSuspense } from "boneyard-js/react";
import type { SnapshotConfig } from "boneyard-js";
import { cn } from "../utils/cn";
import { getSkeletonHeights } from "../utils/bonesHelper";
import { isBoneyardBuild } from "../utils/boneyard";
import { requestIdle, cancelIdle } from "../utils/idleCallback";
import { useAppStore } from "../store/useAppStore";
import {
  SECTION_ANIMATE,
  SECTION_VIEWPORT,
  SECTION_TRANSITION,
} from "../utils/motionVariants";

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

interface NetworkInfoLike {
  saveData?: boolean;
  effectiveType?: string;
}

function isConnectionConstrained(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { connection?: NetworkInfoLike };
  const conn = nav.connection;
  if (!conn) return false;
  return Boolean(
    conn.saveData ||
    conn.effectiveType === "slow-2g" ||
    conn.effectiveType === "2g",
  );
}

function getIntersectionRootMargin(): string {
  return isConnectionConstrained() ? "0px" : "1200px 0px";
}

function isInitialTarget(id: string): boolean {
  if (isBoneyardBuild()) return true;
  if (typeof window === "undefined") return false;
  if (typeof IntersectionObserver === "undefined") return true;
  try {
    if (window.location.hash === `#${id}`) return true;
    if (useAppStore.getState().activeSection === id) return true;
  } catch {
    return false;
  }
  return false;
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
  const initialStyle = { opacity: 0, y: prefersReducedMotion ? 0 : 30 };

  const [hasLoaded, setHasLoaded] = useState(() => isInitialTarget(id));
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (hasLoaded) return;

    const el = sectionRef.current;
    if (!el) return;

    let idleId: number | null = null;
    const rootMargin = getIntersectionRootMargin();

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          observer.disconnect();
          idleId = requestIdle(() => {
            idleId = null;
            setHasLoaded(true);
          });
        }
      },
      { rootMargin },
    );

    observer.observe(el);

    const unsubscribe = useAppStore.subscribe((state) => {
      if (state.activeSection === id) {
        setHasLoaded(true);
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

  const containerStyle = useMemo<CSSProperties>(() => {
    const { mob, tab, desk } = getSkeletonHeights(bonesName);
    return {
      "--skeleton-min-h-mob": mob > 0 ? `${mob}px` : undefined,
      "--skeleton-min-h-tab": tab > 0 ? `${tab}px` : undefined,
      "--skeleton-min-h-desk": desk > 0 ? `${desk}px` : undefined,
    } as CSSProperties;
  }, [bonesName]);

  return (
    <section
      id={id}
      ref={sectionRef}
      className="overflow-x-clip bg-transparent pt-16 md:pt-24"
    >
      <div className="mx-auto max-w-[1200px]">
        <motion.div
          initial={initialStyle}
          whileInView={SECTION_ANIMATE}
          viewport={SECTION_VIEWPORT}
          transition={SECTION_TRANSITION}
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
          transition={SECTION_TRANSITION}
          style={containerStyle}
          className="min-h-[var(--skeleton-min-h-mob)] md:min-h-[var(--skeleton-min-h-tab)] lg:min-h-[var(--skeleton-min-h-desk)]"
        >
          {hasLoaded ? (
            <BoneSuspense
              name={bonesName}
              select="viewport"
              snapshotConfig={snapshotConfig}
            >
              {children}
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
