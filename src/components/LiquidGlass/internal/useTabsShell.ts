import {
  createContext,
  use,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { useMotionValue, type MotionValue } from "motion/react";
import {
  useIsMobile,
  useIsTouchDevice,
  usePrefersReducedMotion,
} from "../../../hooks/useMediaQuery";
import {
  createTabsController,
  type ReadonlyTabsStore,
  type TabsPhysicsController,
  type TabValue,
} from "./liquidGlassStore";
import type { TabOrientation, TabVariant } from "./types";

export interface TabsContextValue {
  state: {
    variant: TabVariant;
    orientation: TabOrientation;
    isMobileNav: boolean;
    isTouchDevice: boolean;
    roundedClass: string;
    highlightClassName: string;
    highlightStyle: CSSProperties;
    role: string | null;
    prefersReducedMotion: boolean | null;
  };
  actions: {
    registerTab: TabsPhysicsController["registerTab"];
    pressTab: TabsPhysicsController["pressTab"];
    releaseTab: TabsPhysicsController["releaseTab"];
    cancelTabPress: TabsPhysicsController["cancelTabPress"];
    leaveTab: TabsPhysicsController["leaveTab"];
    hoverTab: TabsPhysicsController["hoverTab"];
    selectTab: TabsPhysicsController["selectTab"];
    notifyLayoutComplete: TabsPhysicsController["notifyLayoutComplete"];
    onChange?: (value: TabValue) => void;
  };
  meta: {
    store: ReadonlyTabsStore;
    layoutId: string;
    scaleX: MotionValue<number>;
    scaleY: MotionValue<number>;
  };
}

export const TabsContext = createContext<TabsContextValue | null>(null);

/**
 * Reads shared state, actions, and motion metadata from the nearest TabsProvider.
 */
export function useTabsContext(): TabsContextValue {
  const context = use(TabsContext);
  if (!context) {
    throw new Error("Tab must be used within a Tabs component");
  }
  return context;
}

export interface TabsShellController {
  controller: TabsPhysicsController;
  containerRef: RefObject<HTMLDivElement | null>;
  scaleX: MotionValue<number>;
  scaleY: MotionValue<number>;
  isMobileNav: boolean;
  isTouchDevice: boolean;
  prefersReducedMotion: boolean | null;
}

interface UseTabsShellControllerOptions {
  value: TabValue;
  layoutId: string;
  orientation: TabOrientation;
}

/**
 * Creates and synchronizes the tabs physics store, motion values, and lifecycle state.
 */
export function useTabsShellController({
  value,
  layoutId,
  orientation,
}: Readonly<UseTabsShellControllerOptions>): TabsShellController {
  const isMobile = useIsMobile();
  const isTouchDevice = useIsTouchDevice();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isReducedMotion = Boolean(prefersReducedMotion);

  const isMobileNav = Boolean(layoutId?.includes("mobile") || isMobile);

  const [controller] = useState(() =>
    createTabsController({
      initialValue: value,
      orientation,
      isMobileNav,
      prefersReducedMotion: isReducedMotion,
      isTouchDevice,
    }),
  );

  useLayoutEffect(() => {
    controller.configure({
      orientation,
      isMobileNav,
      prefersReducedMotion: isReducedMotion,
      isTouchDevice,
    });
  }, [controller, orientation, isMobileNav, isReducedMotion, isTouchDevice]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);

  useLayoutEffect(() => {
    controller.activate();
    return () => {
      controller.destroy();
      scaleX.stop();
      scaleY.stop();
    };
  }, [controller, scaleX, scaleY]);

  useLayoutEffect(() => {
    controller.setActiveValue(value);
  }, [controller, value]);

  return {
    controller,
    containerRef,
    scaleX,
    scaleY,
    isMobileNav,
    isTouchDevice,
    prefersReducedMotion,
  };
}
