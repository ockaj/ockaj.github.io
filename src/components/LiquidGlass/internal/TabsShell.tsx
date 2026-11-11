import {
  createContext,
  use,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { LayoutGroup, useMotionValue, type MotionValue } from "motion/react";
import {
  useIsMobile,
  useIsTouchDevice,
  usePrefersReducedMotion,
} from "../../../hooks/useMediaQuery";
import { cn } from "../../../utils/cn";
import {
  createTabsController,
  type ReadonlyTabsStore,
  type TabsPhysicsController,
  type TabValue,
} from "./liquidGlassStore";
import { getDefaultTabRadius } from "./liquidGlassUtils";
import { DEFAULT_STYLE, type TabOrientation } from "./types";

export type TabVariant = "capsule" | "segmented";

export interface TabsShellProps<
  T extends TabValue = TabValue,
> extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "role"> {
  children: ReactNode;
  value: T;
  onChange?: (value: T) => void;
  layoutId: string;
  orientation?: TabOrientation;
  roundedClass?: string;
  variant?: TabVariant;
  highlightClassName?: string;
  highlightStyle?: CSSProperties;
  role?: string | null;
}

interface TabsContextValue {
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

const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabsContext() {
  const context = use(TabsContext);
  if (!context) {
    throw new Error("Tab must be used within a Tabs component");
  }
  return context;
}

interface TabsShellController {
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

interface TabsProviderProps {
  shell: TabsShellController;
  children: ReactNode;
  onChange?: (value: TabValue) => void;
  layoutId: string;
  orientation?: TabOrientation;
  variant?: TabVariant;
  roundedClass?: string;
  className?: string;
  highlightClassName?: string;
  highlightStyle?: CSSProperties;
  style?: CSSProperties;
  role?: string | null;
  isRelative?: boolean;
  canLeaveTabs?: () => boolean;
  shouldSuppressClickCapture?: () => boolean;
  htmlProps?: Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "role">;
}

export function TabsProvider({
  shell,
  children,
  onChange,
  layoutId,
  orientation = "horizontal",
  variant = "capsule",
  roundedClass,
  className = "",
  highlightClassName = "navbar-highlight-flat",
  highlightStyle = DEFAULT_STYLE,
  style,
  role = "tablist",
  isRelative = false,
  canLeaveTabs,
  shouldSuppressClickCapture,
  htmlProps,
}: Readonly<TabsProviderProps>) {
  const {
    controller,
    containerRef,
    scaleX,
    scaleY,
    isMobileNav,
    isTouchDevice,
    prefersReducedMotion,
  } = shell;

  const effectiveRoundedClass = roundedClass ?? getDefaultTabRadius(variant);

  const contextValue = useMemo<TabsContextValue>(
    () => ({
      state: {
        variant,
        orientation,
        isMobileNav,
        isTouchDevice,
        roundedClass: effectiveRoundedClass,
        highlightClassName,
        highlightStyle,
        role,
        prefersReducedMotion,
      },
      actions: {
        registerTab: controller.registerTab,
        pressTab: controller.pressTab,
        releaseTab: controller.releaseTab,
        cancelTabPress: controller.cancelTabPress,
        leaveTab: controller.leaveTab,
        hoverTab: controller.hoverTab,
        selectTab: controller.selectTab,
        notifyLayoutComplete: controller.notifyLayoutComplete,
        onChange,
      },
      meta: {
        store: controller.store,
        layoutId,
        scaleX,
        scaleY,
      },
    }),
    [
      controller,
      scaleX,
      scaleY,
      onChange,
      orientation,
      isMobileNav,
      isTouchDevice,
      layoutId,
      variant,
      effectiveRoundedClass,
      highlightClassName,
      highlightStyle,
      role,
      prefersReducedMotion,
    ],
  );

  const handleContainerMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      controller.recordPointerMove(e.clientX, e.clientY, performance.now());
    },
    [controller],
  );

  const handleContainerMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    if (!canLeaveTabs || canLeaveTabs()) {
      controller.leaveTabs();
    }
    htmlProps?.onMouseLeave?.(e);
  };

  const handleContainerClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (shouldSuppressClickCapture?.()) {
      e.preventDefault();
      e.stopPropagation();
    }
    htmlProps?.onClickCapture?.(e);
  };

  const containerProps = mergeProps<"div">(htmlProps, {
    role: role ?? undefined,
    "aria-orientation": role === "tablist" ? orientation : undefined,
    tabIndex: role === "tablist" ? -1 : undefined,
    className: cn("flex", isRelative && "relative", className),
    style,
    onMouseMove: handleContainerMouseMove,
  });

  return (
    <TabsContext value={contextValue}>
      <LayoutGroup id={layoutId} inherit={false}>
        <div
          ref={containerRef}
          {...containerProps}
          onMouseLeave={handleContainerMouseLeave}
          onClickCapture={handleContainerClickCapture}
        >
          {children}
        </div>
      </LayoutGroup>
    </TabsContext>
  );
}
