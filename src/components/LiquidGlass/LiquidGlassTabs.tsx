import {
  createContext,
  use,
  useMemo,
  useState,
  useEffect,
  useLayoutEffect,
  useSyncExternalStore,
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
import {
  motion,
  useReducedMotion,
  LayoutGroup,
  type Transition,
  type MotionValue,
} from "motion/react";
import { SPRING } from "../../utils/springConfig";
import Ripple from "./Ripple";
import { useRipple } from "./useRipple";
import { useIsMobile, useIsTouchDevice } from "../../hooks/useMediaQuery";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import {
  getEntryDimensions,
  computeTargetScales,
  resolveContextHighlightClass,
} from "./liquidGlassUtils";
import { cn } from "../../utils/cn";
import { DEFAULT_STYLE, type TabOrientation } from "./types";
import { springs } from "./config";

type TabVariant = "capsule" | "segmented";

interface LiquidGlassTabsProps<
  T extends string | number = string | number,
> extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "role"> {
  children: ReactNode;
  value: T;
  onChange?: (value: T) => void;
  layoutId: string;
  orientation?: TabOrientation;
  hoverSlide?: boolean;
  ripple?: boolean;
  roundedClass?: string;
  variant?: TabVariant;
  highlightClassName?: string;
  highlightStyle?: CSSProperties;
  highlightTransition?: Transition;
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
  highlightStyle?: CSSProperties;
  highlightTransition?: Transition;
}

type TabValue = string | number;

interface ActiveStore {
  get: () => TabValue;
  isTransitioning: () => boolean;
  getDistance: () => number;
  set: (val: TabValue, distance?: number) => void;
  endTransition: () => void;
  subscribe: (listener: () => void) => () => void;
  destroy: () => void;
}

function createSubscribableStore<T>(initialValue: T) {
  let currentVal = initialValue;
  const listeners = new Set<() => void>();
  return {
    get: () => currentVal,
    set: (val: T) => {
      if (currentVal === val) return;
      currentVal = val;
      listeners.forEach((l) => l());
    },
    notify: () => {
      listeners.forEach((l) => l());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    destroy: () => {
      listeners.clear();
    },
  };
}

function createActiveStore(initialValue: TabValue): ActiveStore {
  const store = createSubscribableStore(initialValue);
  let isTransitioningVal = false;
  let distanceVal = 0;
  let transitionTimer: ReturnType<typeof setTimeout> | null = null;

  return {
    get: store.get,
    isTransitioning: () => isTransitioningVal,
    getDistance: () => distanceVal,
    set: (val: TabValue, distance = 0) => {
      if (store.get() === val) return;
      distanceVal = distance;
      if (distance > 0) {
        isTransitioningVal = true;
        if (transitionTimer) clearTimeout(transitionTimer);
        transitionTimer = setTimeout(() => {
          isTransitioningVal = false;
          store.notify();
        }, 300);
      } else {
        if (transitionTimer) clearTimeout(transitionTimer);
        isTransitioningVal = false;
      }
      store.set(val);
    },
    endTransition: () => {
      if (isTransitioningVal) {
        if (transitionTimer) clearTimeout(transitionTimer);
        isTransitioningVal = false;
        store.notify();
      }
    },
    subscribe: store.subscribe,
    destroy: () => {
      if (transitionTimer) clearTimeout(transitionTimer);
      store.destroy();
    },
  };
}

interface HoverStore {
  get: () => TabValue | null;
  getDistance: () => number;
  isMoving: () => boolean;
  set: (val: TabValue | null, distance?: number) => void;
  subscribe: (listener: () => void) => () => void;
  destroy: () => void;
}

interface TabsContextValue {
  state: {
    activeStore: ActiveStore;
    hoverStore: HoverStore;
  };
  actions: {
    onChange?: (value: TabValue) => void;
    registerTab: (val: TabValue) => () => void;
    getTabDistance: (from: TabValue | null, to: TabValue | null) => number;
    getTabCount: () => number;
  };
  config: {
    layoutId: string;
    orientation: TabOrientation;
    variant: TabVariant;
    hoverSlide: boolean;
    ripple: boolean;
    roundedClass: string;
    highlightClassName?: string;
    highlightStyle?: CSSProperties;
    highlightTransition?: Transition;
    role?: string | null;
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

function createHoverStore(): HoverStore {
  const store = createSubscribableStore<TabValue | null>(null);
  let distanceVal = 0;
  let isMovingVal = false;
  let moveTimer: ReturnType<typeof setTimeout> | null = null;

  const clearMovingState = () => {
    if (moveTimer) clearTimeout(moveTimer);
    moveTimer = null;
    isMovingVal = false;
  };

  const scheduleMovingState = () => {
    isMovingVal = true;
    if (moveTimer) clearTimeout(moveTimer);
    moveTimer = setTimeout(() => {
      isMovingVal = false;
      store.notify();
    }, 240);
  };

  const handleNullValue = () => {
    clearMovingState();
    distanceVal = 0;
    store.set(null);
  };

  const handleSameValue = (distance: number) => {
    if (distance === 0 && isMovingVal) {
      clearMovingState();
      distanceVal = 0;
      store.notify();
    }
  };

  return {
    get: store.get,
    getDistance: () => distanceVal,
    isMoving: () => isMovingVal,
    set: (val: TabValue | null, distance = 0) => {
      if (val === null) {
        handleNullValue();
        return;
      }
      if (store.get() === val) {
        handleSameValue(distance);
        return;
      }
      distanceVal = distance;
      if (distance > 0) {
        scheduleMovingState();
      } else {
        clearMovingState();
      }
      store.set(val);
    },
    subscribe: store.subscribe,
    destroy: () => {
      clearMovingState();
      store.destroy();
    },
  };
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
  highlightStyle?: CSSProperties,
): CSSProperties {
  const baseRadius = resolveBaseRadius(variant, roundedClass, height);
  return {
    "--base-radius": baseRadius,
    "--pill-h": `${height}px`,
    ...contextHighlightStyle,
    ...highlightStyle,
    willChange: willChange ? "transform" : "auto",
  } as CSSProperties;
}

function TabsInner<T extends TabValue>({
  value,
  onChange,
  layoutId,
  orientation = "horizontal",
  children,
  hoverSlide = true,
  ripple = true,
  variant = "capsule",
  roundedClass,
  className = "",
  highlightClassName = "",
  highlightStyle = DEFAULT_STYLE,
  highlightTransition,
  style,
  role = "tablist",
  ...rest
}: Readonly<LiquidGlassTabsProps<T>>) {
  const [hoverStore] = useState(createHoverStore);
  const [activeStore] = useState(() => createActiveStore(value));
  const tabOrderRef = useRef<TabValue[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const registerTab = useCallback((val: TabValue) => {
    if (!tabOrderRef.current.includes(val)) {
      tabOrderRef.current.push(val);
    }
    return () => {
      const idx = tabOrderRef.current.indexOf(val);
      if (idx !== -1) {
        tabOrderRef.current.splice(idx, 1);
      }
    };
  }, []);

  const getTabDistance = useCallback(
    (from: TabValue | null, to: TabValue | null) => {
      if (from === null || to === null || from === to) return 0;
      let fromIdx = -1;
      let toIdx = -1;
      if (containerRef.current) {
        const tabNodes =
          containerRef.current.querySelectorAll<HTMLElement>(
            "[data-tab-value]",
          );
        if (tabNodes.length > 0) {
          const domValues = Array.from(tabNodes).map(
            (node) => node.dataset.tabValue,
          );
          fromIdx = domValues.indexOf(String(from));
          toIdx = domValues.indexOf(String(to));
        }
      }
      if (fromIdx === -1 || toIdx === -1) {
        fromIdx = tabOrderRef.current.indexOf(from);
        toIdx = tabOrderRef.current.indexOf(to);
      }
      return fromIdx !== -1 && toIdx !== -1 ? Math.abs(toIdx - fromIdx) : 1;
    },
    [],
  );

  const getTabCount = useCallback(() => {
    if (containerRef.current) {
      const nodes =
        containerRef.current.querySelectorAll<HTMLElement>("[data-tab-value]");
      if (nodes.length > 0) return nodes.length;
    }
    return tabOrderRef.current.length;
  }, []);

  useLayoutEffect(() => {
    const prevVal = activeStore.get();
    if (prevVal !== value) {
      const wasAlreadyHovered = hoverStore.get() === value;
      const distance = wasAlreadyHovered ? 0 : getTabDistance(prevVal, value);
      activeStore.set(value, distance);
    }
  }, [value, activeStore, hoverStore, getTabDistance]);

  useEffect(() => {
    return () => {
      activeStore.destroy();
      hoverStore.destroy();
    };
  }, [activeStore, hoverStore]);

  const effectiveRoundedClass = roundedClass ?? getDefaultTabRadius(variant);

  const contextValue = useMemo<TabsContextValue>(
    () => ({
      state: {
        activeStore,
        hoverStore,
      },
      actions: {
        onChange: onChange as ((val: TabValue) => void) | undefined,
        registerTab,
        getTabDistance,
        getTabCount,
      },
      config: {
        layoutId,
        orientation,
        variant,
        hoverSlide,
        ripple,
        roundedClass: effectiveRoundedClass,
        highlightClassName,
        highlightStyle,
        highlightTransition,
        role,
      },
    }),
    [
      activeStore,
      hoverStore,
      onChange,
      registerTab,
      getTabDistance,
      getTabCount,
      layoutId,
      orientation,
      variant,
      hoverSlide,
      ripple,
      effectiveRoundedClass,
      highlightClassName,
      highlightStyle,
      highlightTransition,
      role,
    ],
  );

  return (
    <TabsContext value={contextValue}>
      <LayoutGroup id={layoutId} inherit={false}>
        <div
          ref={containerRef}
          role={role ?? undefined}
          aria-orientation={role === "tablist" ? orientation : undefined}
          tabIndex={role === "tablist" ? -1 : undefined}
          className={cn("flex", className)}
          style={style}
          {...rest}
          onMouseLeave={(e) => {
            hoverStore.set(null);
            if (rest.onMouseLeave) {
              rest.onMouseLeave(e);
            }
          }}
        >
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
  restAriaControls: string | undefined,
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

  const computedAriaControls = restAriaControls;

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
    computedAriaControls,
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
const GET_FALSE = () => false;

function useTabActive(activeStore: ActiveStore, value: TabValue) {
  const getSnapshot = useCallback(
    () => activeStore.get() === value,
    [activeStore, value],
  );

  const isActive = useSyncExternalStore(
    activeStore.subscribe,
    getSnapshot,
    getSnapshot,
  );

  const getTransitioningSnapshot = useCallback(
    () => activeStore.get() === value && activeStore.isTransitioning(),
    [activeStore, value],
  );

  const isTransitioning = useSyncExternalStore(
    activeStore.subscribe,
    getTransitioningSnapshot,
    GET_FALSE,
  );

  return { isActive, isTransitioning };
}

function useTabHover(
  hoverStore: HoverStore,
  value: TabValue,
  isActive: boolean,
  hoverSlide: boolean,
  isTouchDevice: boolean,
) {
  const isHovered = useSyncExternalStore(
    hoverStore.subscribe,
    useCallback(
      () => !isTouchDevice && hoverStore.get() === value,
      [hoverStore, isTouchDevice, value],
    ),
    GET_FALSE,
  );
  const showHighlight = useSyncExternalStore(
    hoverStore.subscribe,
    useCallback(() => {
      if (!hoverSlide || isTouchDevice) return isActive;
      const current = hoverStore.get();
      return current === value || (isActive && current === null);
    }, [hoverStore, hoverSlide, isActive, isTouchDevice, value]),
    useCallback(() => isActive, [isActive]),
  );
  const isHoverMoving = useSyncExternalStore(
    hoverStore.subscribe,
    useCallback(
      () =>
        !isTouchDevice && hoverStore.get() === value && hoverStore.isMoving(),
      [hoverStore, isTouchDevice, value],
    ),
    GET_FALSE,
  );
  return { isHovered, showHighlight, isHoverMoving };
}

function useTabDimensions(
  buttonRef: RefObject<HTMLButtonElement | null>,
  enabled: boolean,
) {
  const [dimensions, setDimensions] = useState({ width: 120, height: 36 });

  useResizeObserver(enabled ? buttonRef : null, (entry) => {
    const { width, height } = getEntryDimensions(entry);
    if (width > 0 && height > 0) {
      setDimensions((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height },
      );
    }
  });

  return dimensions;
}

function useTabWillChange(isActive: boolean) {
  const [willChange, setWillChange] = useState(false);

  useEffect(() => {
    if (isActive) {
      const handle = requestAnimationFrame(() => {
        setWillChange(true);
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [isActive]);

  return [willChange, setWillChange] as const;
}

function useTabLayoutTransition(
  prefersReducedMotion: boolean | null,
  highlightTransition?: Transition,
  contextHighlightTransition?: Transition,
) {
  return useMemo(() => {
    if (prefersReducedMotion) {
      return { layout: { duration: 0 } };
    }
    return (
      highlightTransition ?? contextHighlightTransition ?? HIGHLIGHT_TRANSITION
    );
  }, [prefersReducedMotion, highlightTransition, contextHighlightTransition]);
}

function useTabPress(
  disabled: boolean,
  hoverSlide: boolean,
  value: TabValue,
  hoverStore: HoverStore,
  onPointerDown: (e: PointerEvent<HTMLButtonElement>) => void,
  setWillChange: (val: boolean) => void,
  isTouchDevice: boolean,
) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (hoverSlide && !isTouchDevice && e.pointerType !== "touch") {
        hoverStore.set(value, 0);
      }
      onPointerDown(e);
      setWillChange(true);
      setIsPressed(true);
    },
    [
      disabled,
      hoverSlide,
      isTouchDevice,
      value,
      hoverStore,
      onPointerDown,
      setWillChange,
    ],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      setIsPressed(false);
      if (isTouchDevice || e.pointerType === "touch") {
        hoverStore.set(null);
      }
    },
    [isTouchDevice, hoverStore],
  );

  const handlePointerCancel = useCallback(() => {
    setIsPressed(false);
    hoverStore.set(null);
  }, [hoverStore]);

  const handleMouseLeave = useCallback(() => {
    setIsPressed(false);
  }, []);

  return {
    isPressed,
    handlePointerDown,
    handlePointerUp,
    handlePointerCancel,
    handleMouseLeave,
  };
}

interface TabHighlightProps {
  layoutId: string;
  layoutTransition: Transition;
  outerHighlightClass: string;
  outerHighlightStyle: CSSProperties;
  scaleAnimationTarget: { "--scale-x": number; "--scale-y": number };
  innerHighlightClass: string;
  willChange: boolean;
  prefersReducedMotion?: boolean | null;
  onScaleAnimationComplete?: () => void;
  ripple: boolean;
  rippleX: MotionValue<number>;
  rippleY: MotionValue<number>;
  rippleScale: MotionValue<number>;
  rippleOpacity: MotionValue<number>;
  variant: TabVariant;
}

const SEGMENTED_HIGHLIGHT_RADIUS =
  "calc((var(--base-radius) + max(0px, var(--pill-h, 36px) * (var(--scale-y) - 1) / 2)) / var(--scale-x)) / calc((var(--base-radius) + max(0px, var(--pill-h, 36px) * (var(--scale-y) - 1) / 2)) / var(--scale-y))";
const CAPSULE_HIGHLIGHT_RADIUS =
  "calc((var(--base-radius) * var(--scale-y)) / var(--scale-x)) / var(--base-radius)";

const TabHighlight = memo(function TabHighlight({
  layoutId,
  layoutTransition,
  outerHighlightClass,
  outerHighlightStyle,
  scaleAnimationTarget,
  innerHighlightClass,
  willChange,
  prefersReducedMotion,
  onScaleAnimationComplete,
  ripple,
  rippleX,
  rippleY,
  rippleScale,
  rippleOpacity,
  variant,
}: Readonly<TabHighlightProps>) {
  return (
    <motion.span
      layoutId={layoutId}
      initial={false}
      className={outerHighlightClass}
      style={outerHighlightStyle}
      transition={layoutTransition}
    >
      <motion.span
        animate={scaleAnimationTarget}
        transition={prefersReducedMotion ? { duration: 0 } : springs.scale}
        onAnimationComplete={onScaleAnimationComplete}
        className={innerHighlightClass}
        style={{
          transform: "scale(var(--scale-x), var(--scale-y))",
          borderRadius:
            variant === "segmented"
              ? SEGMENTED_HIGHLIGHT_RADIUS
              : CAPSULE_HIGHLIGHT_RADIUS,
          transformOrigin: "center center",
          willChange: willChange ? "transform" : "auto",
        }}
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

function TabComponent({
  value,
  children,
  className = "",
  activeClassName = "",
  roundedClass: tabRoundedClass,
  highlightClassName = "",
  highlightStyle = DEFAULT_STYLE,
  highlightTransition,
  onClick,
  disabled = false,
  ...rest
}: Readonly<LiquidGlassTabProps>) {
  const { state, actions, config } = useTabsContext();
  const { activeStore, hoverStore } = state;
  const { onChange, registerTab, getTabDistance, getTabCount } = actions;
  const {
    layoutId,
    orientation,
    variant,
    hoverSlide,
    ripple,
    roundedClass: contextRoundedClass,
    highlightClassName: contextHighlightClass,
    highlightStyle: contextHighlightStyle,
    highlightTransition: contextHighlightTransition,
    role: parentRole,
  } = config;

  useEffect(() => {
    return registerTab(value);
  }, [registerTab, value]);

  const effectiveRoundedClass = tabRoundedClass ?? contextRoundedClass;

  const prefersReducedMotion = useReducedMotion();
  const { rippleX, rippleY, rippleScale, rippleOpacity, onPointerDown } =
    useRipple(ripple && !prefersReducedMotion);

  const isMobile = useIsMobile();
  const isTouchDevice = useIsTouchDevice();
  const { isActive, isTransitioning } = useTabActive(activeStore, value);
  const { isHovered, showHighlight, isHoverMoving } = useTabHover(
    hoverStore,
    value,
    isActive,
    hoverSlide,
    isTouchDevice,
  );

  const [willChange, setWillChange] = useTabWillChange(isActive);
  const layoutTransition = useTabLayoutTransition(
    prefersReducedMotion,
    highlightTransition,
    contextHighlightTransition,
  );

  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const {
    isPressed,
    handlePointerDown,
    handlePointerUp,
    handlePointerCancel,
    handleMouseLeave,
  } = useTabPress(
    disabled,
    hoverSlide,
    value,
    hoverStore,
    onPointerDown,
    setWillChange,
    isTouchDevice,
  );

  const dimensions = useTabDimensions(buttonRef, showHighlight || isPressed);

  const isMobileNav = layoutId?.includes("mobile") || isMobile;

  const tabRole = resolveTabRole(rest.role, parentRole);
  const isTabRole = tabRole === "tab";

  const isHoverActive =
    isHovered || !!contextHighlightClass?.includes("navbar-highlight-active");

  let effectiveDistance = 0;
  if (isHoverMoving) {
    effectiveDistance = hoverStore.getDistance();
  } else if (isTransitioning) {
    effectiveDistance = activeStore.getDistance();
  }

  const isTraveling =
    (isHoverMoving || isTransitioning) && effectiveDistance > 0;

  const { targetScaleX, targetScaleY } = computeTargetScales(
    isPressed,
    isHoverActive,
    isTraveling,
    orientation,
    !!isMobileNav,
    dimensions,
    effectiveDistance,
    prefersReducedMotion ?? false,
    getTabCount(),
  );

  const handleMouseEnter = useCallback(() => {
    if (disabled || !hoverSlide || isTouchDevice) return;
    const currentHover = hoverStore.get();
    const currentAnchor = currentHover ?? activeStore.get();
    const distance = getTabDistance(currentAnchor, value);
    hoverStore.set(value, distance);
  }, [
    disabled,
    hoverSlide,
    isTouchDevice,
    hoverStore,
    activeStore,
    getTabDistance,
    value,
  ]);

  const selectOption = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      hoverStore.set(value, 0);
      if (onChange) onChange(value);
      if (onClick) onClick(e);
    },
    [disabled, hoverStore, onChange, onClick, value],
  );

  const handleScaleAnimationComplete = useCallback(() => {
    setWillChange(false);
  }, [setWillChange]);

  const scaleAnimationTarget = useMemo(
    () => ({
      "--scale-x": targetScaleX,
      "--scale-y": targetScaleY,
    }),
    [targetScaleX, targetScaleY],
  );

  const outerHighlightClass =
    `absolute inset-0 z-[-1] pointer-events-none ${effectiveRoundedClass}`.trim();

  const outerHighlightStyle = computeOuterHighlightStyle(
    variant,
    effectiveRoundedClass,
    dimensions.height,
    willChange,
    contextHighlightStyle,
    highlightStyle,
  );

  const isNavbarActive =
    isHoverActive ||
    isTransitioning ||
    !!contextHighlightClass?.includes("navbar-highlight-active");

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

  const {
    computedAriaSelected,
    computedAriaControls,
    computedTabIndex,
    computedAriaCurrent,
  } = computeTabAriaProps(
    rest["aria-selected"] as boolean | undefined,
    rest["aria-controls"],
    rest.tabIndex,
    rest["aria-current"],
    isTabRole,
    isActive,
  );

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      data-tab-value={String(value)}
      disabled={disabled}
      onClick={selectOption}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      className={cn(
        "relative z-10 transition-colors duration-200 select-none focus-visible:outline-none",
        className,
        isActive && activeClassName,
      )}
      {...rest}
      role={tabRole}
      aria-selected={computedAriaSelected}
      aria-controls={computedAriaControls}
      aria-current={computedAriaCurrent}
      id={isTabRole ? (rest.id ?? `tab-${value}`) : rest.id}
      tabIndex={computedTabIndex}
      onKeyDown={isTabRole ? handleTabKeyDown : rest.onKeyDown}
    >
      {showHighlight ? (
        <TabHighlight
          layoutId={layoutId}
          layoutTransition={layoutTransition}
          outerHighlightClass={outerHighlightClass}
          outerHighlightStyle={outerHighlightStyle}
          scaleAnimationTarget={scaleAnimationTarget}
          innerHighlightClass={innerHighlightClass}
          willChange={willChange}
          prefersReducedMotion={prefersReducedMotion}
          onScaleAnimationComplete={handleScaleAnimationComplete}
          ripple={ripple}
          rippleX={rippleX}
          rippleY={rippleY}
          rippleScale={rippleScale}
          rippleOpacity={rippleOpacity}
          variant={variant}
        />
      ) : null}
      {children}
    </motion.button>
  );
}

const Tab = memo(TabComponent);
Tab.displayName = "Tab";

export { Tabs, Tab };
