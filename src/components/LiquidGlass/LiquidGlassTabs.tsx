import {
  createContext,
  use,
  useMemo,
  useState,
  useLayoutEffect,
  memo,
  useRef,
  useCallback,
  type CSSProperties,
  type ReactNode,
  type MouseEvent,
  type PointerEvent,
  type KeyboardEvent,
  type HTMLAttributes,
  type ComponentPropsWithoutRef,
  type RefObject,
} from "react";
import { useStore } from "zustand";
import { mergeProps } from "@base-ui/react/merge-props";
import {
  animate,
  motion,
  useMotionValue,
  LayoutGroup,
  type Transition,
  type MotionValue,
} from "motion/react";
import { SPRING } from "../../utils/springConfig";
import Ripple from "./Ripple";
import { useRipple } from "./useRipple";
import {
  useIsMobile,
  useIsTouchDevice,
  usePrefersReducedMotion,
} from "../../hooks/useMediaQuery";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import {
  CAPSULE_HIGHLIGHT_RADIUS,
  getEntryDimensions,
  resolveContextHighlightClass,
} from "./liquidGlassUtils";
import { cn } from "../../utils/cn";
import { DEFAULT_STYLE, type TabOrientation } from "./types";
import {
  createTabsController,
  type TabsPhysicsController,
  type TabValue,
} from "./liquidGlassStore";
import DraggableTabHighlight from "./DraggableTabHighlight";
import { useDraggableTabs } from "./useDraggableTabs";

type TabVariant = "capsule" | "segmented";

interface LiquidGlassTabsProps<
  T extends string | number = string | number,
> extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "role"> {
  children: ReactNode;
  value: T;
  onChange?: (value: T) => void;
  layoutId: string;
  orientation?: TabOrientation;
  draggablePill?: boolean;
  roundedClass?: string;
  variant?: TabVariant;
  highlightClassName?: string;
  highlightStyle?: CSSProperties;
  role?: string | null;
}

interface LiquidGlassTabProps extends Omit<
  ComponentPropsWithoutRef<typeof motion.button>,
  "value" | "children"
> {
  value: string | number;
  children?: ReactNode;
  activeClassName?: string;
  roundedClass?: string;
  highlightClassName?: string;
}

interface TabsContextValue {
  state: {
    variant: TabVariant;
    isDraggable: boolean;
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
    draggable?: {
      registerTabElement: (
        val: TabValue,
        el: HTMLButtonElement | null,
      ) => void;
      measureTabs: () => void;
      handleTabPointerDown: (
        val: TabValue,
        e: PointerEvent<HTMLButtonElement>,
      ) => boolean;
      consumeDragClickSuppression: () => boolean;
      isGrabActive: () => boolean;
    };
  };
  meta: {
    store: TabsPhysicsController["store"];
    getTabStateMaskFromState: TabsPhysicsController["getTabStateMaskFromState"];
    getTabSnapshot: TabsPhysicsController["getTabSnapshot"];
    layoutId: string;
    scaleX: MotionValue<number>;
    scaleY: MotionValue<number>;
  };
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = use(TabsContext);
  if (!context) {
    throw new Error("Tab must be used within a Tabs component");
  }
  return context;
}

function getDefaultTabRadius(variant: TabVariant): string {
  return variant === "segmented" ? "rounded-lg" : "rounded-full";
}

const RADIUS_BY_CLASS = [
  ["rounded-xl", "12px"],
  ["rounded-lg", "8px"],
  ["rounded-md", "6px"],
  ["rounded-sm", "4px"],
] as const;

function resolveBaseRadius(
  variant: TabVariant,
  roundedClass: string,
  height: number,
): string {
  if (variant === "capsule" || roundedClass.includes("rounded-full")) {
    return "9999px";
  }
  if (roundedClass.includes("rounded-2xl")) {
    return `${Math.min(height / 2, 16)}px`;
  }
  if (roundedClass.includes("rounded-3xl")) {
    return `${Math.min(height / 2, 24)}px`;
  }
  for (const [cls, radius] of RADIUS_BY_CLASS) {
    if (roundedClass.includes(cls)) return radius;
  }
  return "8px";
}

function computeOuterHighlightStyle(
  variant: TabVariant,
  roundedClass: string,
  height: number,
  willChange: boolean,
  contextHighlightStyle?: CSSProperties,
): CSSProperties {
  const baseRadius = resolveBaseRadius(variant, roundedClass, height);
  return {
    "--base-radius": baseRadius,
    "--pill-h": `${height}px`,
    ...contextHighlightStyle,
    willChange: willChange ? "transform" : "auto",
  } as CSSProperties;
}

function TabsInner<T extends TabValue>({
  value,
  onChange,
  layoutId,
  orientation = "horizontal",
  children,
  draggablePill = false,
  variant = "capsule",
  roundedClass,
  className = "",
  highlightClassName = "navbar-highlight-flat",
  highlightStyle = DEFAULT_STYLE,
  style,
  role = "tablist",
  ...rest
}: Readonly<LiquidGlassTabsProps<T>>) {
  const isMobile = useIsMobile();
  const isTouchDevice = useIsTouchDevice();
  const prefersReducedMotion = usePrefersReducedMotion();

  const isMobileNav = Boolean(layoutId?.includes("mobile") || isMobile);
  const isDraggable = Boolean(
    draggablePill && orientation === "horizontal" && !isMobileNav,
  );

  const [controller] = useState(() =>
    createTabsController({
      initialValue: value,
      orientation,
      isMobileNav,
      prefersReducedMotion: Boolean(prefersReducedMotion),
      isTouchDevice,
    }),
  );

  controller.configure({
    orientation,
    isMobileNav,
    prefersReducedMotion: Boolean(prefersReducedMotion),
    isTouchDevice,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);

  const draggableRipple = useRipple(!prefersReducedMotion && isDraggable);

  const draggable = useDraggableTabs({
    enabled: isDraggable,
    controller,
    containerRef,
    isTouchDevice,
    prefersReducedMotion,
    onChange: onChange as ((val: TabValue) => void) | undefined,
    triggerRippleAt: draggableRipple.triggerAt,
  });

  useResizeObserver(containerRef, draggable.measureTabs);

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

  const effectiveRoundedClass = roundedClass ?? getDefaultTabRadius(variant);

  const contextValue = useMemo<TabsContextValue>(
    () => ({
      state: {
        variant,
        isDraggable,
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
        onChange: onChange as ((val: TabValue) => void) | undefined,
        draggable: isDraggable
          ? {
              registerTabElement: draggable.registerTabElement,
              measureTabs: draggable.measureTabs,
              handleTabPointerDown: draggable.handleTabPointerDown,
              consumeDragClickSuppression:
                draggable.consumeDragClickSuppression,
              isGrabActive: draggable.isGrabActive,
            }
          : undefined,
      },
      meta: {
        store: controller.store,
        getTabStateMaskFromState: controller.getTabStateMaskFromState,
        getTabSnapshot: controller.getTabSnapshot,
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
      isDraggable,
      draggable.registerTabElement,
      draggable.measureTabs,
      draggable.handleTabPointerDown,
      draggable.consumeDragClickSuppression,
      draggable.isGrabActive,
      layoutId,
      variant,
      effectiveRoundedClass,
      highlightClassName,
      highlightStyle,
      role,
      prefersReducedMotion,
    ],
  );

  const containerProps = mergeProps<"div">(rest, {
    role: role ?? undefined,
    "aria-orientation": role === "tablist" ? orientation : undefined,
    tabIndex: role === "tablist" ? -1 : undefined,
    className: cn("flex", isDraggable && "relative", className),
    style,
    onMouseMove: (e) => {
      controller.recordPointerMove(e.clientX, e.clientY, performance.now());
    },
    onMouseLeave: () => {
      if (isDraggable && draggable.isGrabActive()) return;
      controller.leaveTabs();
    },
    onClickCapture: (e) => {
      if (isDraggable && draggable.consumeDragClickSuppression()) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
  });

  return (
    <TabsContext value={contextValue}>
      <LayoutGroup id={layoutId} inherit={false}>
        <div ref={containerRef} {...containerProps}>
          {isDraggable ? (
            <DraggableTabHighlight
              controller={controller}
              pillTargetValue={draggable.pillTargetValue}
              pillCenterX={draggable.pillCenterX}
              smoothDragVelocity={draggable.smoothDragVelocity}
              pillOpacity={draggable.pillOpacity}
              layoutVersionMv={draggable.layoutVersionMv}
              scaleX={scaleX}
              scaleY={scaleY}
              getTabDimensionsForValue={draggable.getTabDimensionsForValue}
              effectiveRoundedClass={effectiveRoundedClass}
              contextHighlightClass={highlightClassName}
              contextHighlightStyle={highlightStyle}
              prefersReducedMotion={prefersReducedMotion}
              rippleX={draggableRipple.rippleX}
              rippleY={draggableRipple.rippleY}
              rippleScale={draggableRipple.rippleScale}
              rippleOpacity={draggableRipple.rippleOpacity}
            />
          ) : null}
          {children}
        </div>
      </LayoutGroup>
    </TabsContext>
  );
}

interface TabsComponent {
  <T extends string | number>(props: LiquidGlassTabsProps<T>): ReactNode;
  displayName?: string;
}

const Tabs: TabsComponent = memo(TabsInner) as TabsComponent;
Tabs.displayName = "Tabs";

const handleTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
  const tabs = Array.from(
    e.currentTarget
      .closest('[role="tablist"]')
      ?.querySelectorAll('[role="tab"]:not(:disabled)') ?? [],
  );
  if (tabs.length === 0) return;
  const idx = tabs.indexOf(e.currentTarget);
  if (idx === -1) return;
  let nextIdx: number;

  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    nextIdx = (idx + 1) % tabs.length;
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    nextIdx = (idx - 1 + tabs.length) % tabs.length;
  } else if (e.key === "Home") {
    nextIdx = 0;
  } else if (e.key === "End") {
    nextIdx = tabs.length - 1;
  } else {
    return;
  }

  e.preventDefault();
  const nextTab = tabs[nextIdx] as HTMLButtonElement;
  nextTab.focus();
  nextTab.click();
};

function computeTabAriaProps(
  restAriaSelected: boolean | undefined,
  restTabIndex: number | undefined,
  restAriaCurrent: ComponentPropsWithoutRef<
    typeof motion.button
  >["aria-current"],
  isTabRole: boolean,
  isActive: boolean,
) {
  let computedAriaSelected = restAriaSelected;
  if (computedAriaSelected === undefined && isTabRole) {
    computedAriaSelected = isActive;
  }

  let computedTabIndex = restTabIndex;
  if (computedTabIndex === undefined && isTabRole) {
    computedTabIndex = isActive ? 0 : -1;
  }

  let computedAriaCurrent = restAriaCurrent;
  if (computedAriaCurrent === undefined && !isTabRole && isActive) {
    computedAriaCurrent = "page";
  }

  return {
    computedAriaSelected,
    computedTabIndex,
    computedAriaCurrent,
  };
}

function resolveTabRole(
  explicitRole: string | null | undefined,
  parentRole: string | null | undefined,
): string | undefined {
  if (explicitRole !== undefined) {
    return explicitRole ?? undefined;
  }
  if (parentRole === null) {
    return undefined;
  }
  return "tab";
}

const HIGHLIGHT_TRANSITION = { layout: SPRING.highlight } as const;
const REDUCED_LAYOUT_TRANSITION = { layout: { duration: 0 } } as const;

function useTabDimensions(
  buttonRef: RefObject<HTMLButtonElement | null>,
  onLayoutChange?: () => void,
) {
  const [dimensions, setDimensions] = useState({ width: 120, height: 36 });

  useResizeObserver(buttonRef, (entry) => {
    const { width, height } = getEntryDimensions(entry);
    if (width > 0 && height > 0) {
      setDimensions((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height },
      );
      onLayoutChange?.();
    }
  });

  return dimensions;
}

function useTabScaleAnimation(
  showHighlight: boolean,
  prefersReducedMotion: boolean | null,
  scaleX: MotionValue<number>,
  scaleY: MotionValue<number>,
  targetScaleX: number,
  targetScaleY: number,
  scaleSpring: Transition,
) {
  useLayoutEffect(() => {
    if (!showHighlight) return;
    if (prefersReducedMotion) {
      scaleX.jump(targetScaleX);
      scaleY.jump(targetScaleY);
      return;
    }
    animate(scaleX, targetScaleX, scaleSpring);
    animate(scaleY, targetScaleY, scaleSpring);
    return () => {
      scaleX.stop();
      scaleY.stop();
    };
  }, [
    showHighlight,
    prefersReducedMotion,
    scaleX,
    scaleY,
    targetScaleX,
    targetScaleY,
    scaleSpring,
  ]);
}

interface TabHighlightProps {
  layoutId: string;
  layoutTransition: Transition;
  outerHighlightClass: string;
  outerHighlightStyle: CSSProperties;
  scaleX: MotionValue<number>;
  scaleY: MotionValue<number>;
  innerHighlightClass: string;
  willChange: boolean;
  ripple: boolean;
  rippleX: MotionValue<number>;
  rippleY: MotionValue<number>;
  rippleScale: MotionValue<number>;
  rippleOpacity: MotionValue<number>;
  variant: TabVariant;
  onLayoutAnimationComplete?: () => void;
}

const SEGMENTED_HIGHLIGHT_RADIUS =
  "calc((var(--base-radius) + max(0px, var(--pill-h, 36px) * (var(--scale-y) - 1) / 2)) / var(--scale-x)) / calc((var(--base-radius) + max(0px, var(--pill-h, 36px) * (var(--scale-y) - 1) / 2)) / var(--scale-y))";

const TabHighlight = memo(function TabHighlight({
  layoutId,
  layoutTransition,
  outerHighlightClass,
  outerHighlightStyle,
  scaleX,
  scaleY,
  innerHighlightClass,
  willChange,
  ripple,
  rippleX,
  rippleY,
  rippleScale,
  rippleOpacity,
  variant,
  onLayoutAnimationComplete,
}: Readonly<TabHighlightProps>) {
  return (
    <motion.span
      layoutId={layoutId}
      initial={false}
      className={outerHighlightClass}
      style={outerHighlightStyle}
      transition={layoutTransition}
      onLayoutAnimationComplete={onLayoutAnimationComplete}
    >
      <motion.span
        className={innerHighlightClass}
        style={
          {
            "--scale-x": scaleX,
            "--scale-y": scaleY,
            scaleX,
            scaleY,
            borderRadius:
              variant === "segmented"
                ? SEGMENTED_HIGHLIGHT_RADIUS
                : CAPSULE_HIGHLIGHT_RADIUS,
            transformOrigin: "center center",
            willChange: willChange ? "transform" : "auto",
          } as unknown as CSSProperties
        }
      >
        {ripple ? (
          <Ripple
            rippleX={rippleX}
            rippleY={rippleY}
            rippleScale={rippleScale}
            rippleOpacity={rippleOpacity}
          />
        ) : null}
      </motion.span>
    </motion.span>
  );
});
TabHighlight.displayName = "TabHighlight";

function resolveTabLabelClass(
  hasDragPreview: boolean,
  isDragPreview: boolean,
  isActive: boolean,
  activeClassName: string,
): string {
  if (hasDragPreview) {
    return isDragPreview ? "text-text-primary" : "";
  }
  return isActive ? activeClassName : "";
}

function resolveTabTouchClass(
  isDraggable: boolean,
  showHighlight: boolean,
): string {
  if (!isDraggable) return "";
  return showHighlight ? "touch-none" : "touch-pan-y";
}

function TabComponent({
  value,
  children,
  className = "",
  activeClassName = "",
  roundedClass: tabRoundedClass,
  highlightClassName = "",
  onClick,
  disabled = false,
  ...rest
}: Readonly<LiquidGlassTabProps>) {
  const { state, actions, meta } = useTabsContext();
  const {
    variant,
    isDraggable,
    roundedClass: contextRoundedClass,
    highlightClassName: contextHighlightClass,
    highlightStyle: contextHighlightStyle,
    role: parentRole,
    prefersReducedMotion,
  } = state;
  const {
    registerTab,
    pressTab,
    releaseTab,
    cancelTabPress,
    leaveTab,
    hoverTab,
    selectTab,
    notifyLayoutComplete,
    onChange,
    draggable,
  } = actions;
  const {
    store,
    getTabStateMaskFromState,
    getTabSnapshot,
    layoutId,
    scaleX,
    scaleY,
  } = meta;

  useLayoutEffect(() => {
    return registerTab(value);
  }, [registerTab, value]);

  const tabStateMask = useStore(
    store,
    useCallback(
      (s) => getTabStateMaskFromState(s, value),
      [getTabStateMaskFromState, value],
    ),
  );

  const effectiveRoundedClass = tabRoundedClass ?? contextRoundedClass;
  const rendersRipple = !prefersReducedMotion;

  const { rippleX, rippleY, rippleScale, rippleOpacity, onPointerDown } =
    useRipple(rendersRipple && !isDraggable);

  const layoutTransition = prefersReducedMotion
    ? REDUCED_LAYOUT_TRANSITION
    : HIGHLIGHT_TRANSITION;

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dimensions = useTabDimensions(buttonRef, draggable?.measureTabs);

  useLayoutEffect(() => {
    if (!isDraggable || !draggable) return;
    draggable.registerTabElement(value, buttonRef.current);
    draggable.measureTabs();
    return () => {
      draggable.registerTabElement(value, null);
    };
  }, [draggable, isDraggable, value]);

  const {
    isActive,
    isDragPreview,
    hasDragPreview,
    showHighlight,
    isNavbarActive,
    willChange,
    targetScaleX,
    targetScaleY,
    scaleSpring,
  } = getTabSnapshot(value, dimensions, tabStateMask);

  useTabScaleAnimation(
    showHighlight && !isDraggable,
    prefersReducedMotion,
    scaleX,
    scaleY,
    targetScaleX,
    targetScaleY,
    scaleSpring,
  );

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (isDraggable && draggable) {
        draggable.handleTabPointerDown(value, e);
        return;
      }
      onPointerDown(e);
      pressTab(value, e.pointerType);
    },
    [disabled, draggable, isDraggable, onPointerDown, pressTab, value],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      if (isDraggable && draggable?.isGrabActive()) return;
      releaseTab(value, e.pointerType);
    },
    [draggable, isDraggable, releaseTab, value],
  );

  const handleMouseLeave = useCallback(() => {
    if (isDraggable && draggable?.isGrabActive()) return;
    leaveTab(value);
  }, [draggable, isDraggable, leaveTab, value]);

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    hoverTab(value);
  }, [disabled, hoverTab, value]);

  const selectOption = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (isDraggable && draggable?.consumeDragClickSuppression()) {
        e.preventDefault();
        return;
      }
      selectTab(value);
      onChange?.(value);
      onClick?.(e);
    },
    [disabled, draggable, isDraggable, onChange, onClick, selectTab, value],
  );

  const tabRole = resolveTabRole(rest.role, parentRole);
  const isTabRole = tabRole === "tab";

  const outerHighlightClass =
    `absolute inset-0 z-[-1] pointer-events-none ${effectiveRoundedClass}`.trim();

  const shouldRenderTabHighlight = showHighlight && !isDraggable;

  const outerHighlightStyle = shouldRenderTabHighlight
    ? computeOuterHighlightStyle(
        variant,
        effectiveRoundedClass,
        dimensions.height,
        willChange,
        contextHighlightStyle,
      )
    : undefined;

  const resolvedContextHighlightClass = resolveContextHighlightClass(
    contextHighlightClass,
    isNavbarActive,
  );

  const innerHighlightClass = cn(
    "absolute inset-0 highlight-pill overflow-hidden",
    effectiveRoundedClass,
    resolvedContextHighlightClass,
    highlightClassName,
  );

  const { computedAriaSelected, computedTabIndex, computedAriaCurrent } =
    computeTabAriaProps(
      rest["aria-selected"] as boolean | undefined,
      rest.tabIndex,
      rest["aria-current"],
      isTabRole,
      isActive,
    );

  const resolvedLabelClass = resolveTabLabelClass(
    hasDragPreview,
    isDragPreview,
    isActive,
    activeClassName,
  );

  const buttonProps = mergeProps<typeof motion.button>(rest, {
    type: "button",
    disabled,
    onClick: selectOption,
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: cancelTabPress,
    onMouseLeave: handleMouseLeave,
    onMouseEnter: handleMouseEnter,
    className: cn(
      "relative z-10 transition-colors duration-200 select-none focus-visible:outline-none",
      resolveTabTouchClass(isDraggable, showHighlight),
      className,
      resolvedLabelClass,
    ),
    role: tabRole,
    "aria-selected": computedAriaSelected,
    "aria-current": computedAriaCurrent,
    id: isTabRole ? (rest.id ?? `tab-${value}`) : rest.id,
    tabIndex: computedTabIndex,
    onKeyDown: isTabRole ? handleTabKeyDown : undefined,
  });

  return (
    <motion.button ref={buttonRef} {...buttonProps}>
      {outerHighlightStyle ? (
        <TabHighlight
          layoutId={layoutId}
          layoutTransition={layoutTransition}
          outerHighlightClass={outerHighlightClass}
          outerHighlightStyle={outerHighlightStyle}
          scaleX={scaleX}
          scaleY={scaleY}
          innerHighlightClass={innerHighlightClass}
          willChange={willChange}
          ripple={rendersRipple}
          rippleX={rippleX}
          rippleY={rippleY}
          rippleScale={rippleScale}
          rippleOpacity={rippleOpacity}
          variant={variant}
          onLayoutAnimationComplete={notifyLayoutComplete}
        />
      ) : null}
      {children}
    </motion.button>
  );
}

const Tab = memo(TabComponent);
Tab.displayName = "Tab";

export { Tabs, Tab };
