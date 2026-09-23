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
import { getEntryDimensions } from "./liquidGlassUtils";
import { cn } from "../../utils/cn";
import { DEFAULT_STYLE } from "./types";
import { scaleDeltas, scaleVertical, springs, hoverDelta } from "./config";

type TabVariant = "capsule" | "segmented";

interface LiquidGlassTabsProps<
  T extends string | number = string | number,
> extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "role"> {
  children: ReactNode;
  value: T;
  onChange?: (value: T) => void;
  layoutId: string;
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
  set: (val: TabValue) => void;
  subscribe: (listener: () => void) => () => void;
  destroy: () => void;
}

function createActiveStore(initialValue: TabValue): ActiveStore {
  let currentVal: TabValue = initialValue;
  let isTransitioningVal = false;
  let transitionTimer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();

  return {
    get: () => currentVal,
    isTransitioning: () => isTransitioningVal,
    set: (val: TabValue) => {
      if (currentVal === val) return;
      currentVal = val;
      isTransitioningVal = true;
      if (transitionTimer) clearTimeout(transitionTimer);
      transitionTimer = setTimeout(() => {
        isTransitioningVal = false;
        listeners.forEach((l) => l());
      }, 300);
      listeners.forEach((l) => l());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    destroy: () => {
      if (transitionTimer) clearTimeout(transitionTimer);
      listeners.clear();
    },
  };
}

interface HoverStore {
  get: () => TabValue | null;
  set: (val: TabValue | null) => void;
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
  };
  config: {
    layoutId: string;
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
  let currentVal: TabValue | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => currentVal,
    set: (val: TabValue | null) => {
      if (currentVal === val) return;
      currentVal = val;
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

function getDefaultTabRadius(variant: TabVariant): string {
  return variant === "segmented" ? "rounded-lg" : "rounded-full";
}

function resolveBaseRadius(
  variant: TabVariant,
  roundedClass: string,
  height: number,
): string {
  if (variant === "capsule") {
    return "9999px";
  }
  if (roundedClass.includes("rounded-2xl")) {
    return `${Math.min(height / 2, 16)}px`;
  }
  if (roundedClass.includes("rounded-3xl")) {
    return `${Math.min(height / 2, 24)}px`;
  }
  if (roundedClass.includes("rounded-xl")) {
    return "12px";
  }
  if (roundedClass.includes("rounded-md")) {
    return "6px";
  }
  if (roundedClass.includes("rounded-sm")) {
    return "4px";
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
    ...contextHighlightStyle,
    ...highlightStyle,
    willChange: willChange ? "transform" : "auto",
  } as CSSProperties;
}

function TabsInner<T extends TabValue>({
  value,
  onChange,
  layoutId,
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

  useLayoutEffect(() => {
    activeStore.set(value);
  }, [value, activeStore]);

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
      },
      config: {
        layoutId,
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
      layoutId,
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
          role={role ?? undefined}
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
      ?.querySelectorAll('[role="tab"]') ?? [],
  );
  const idx = tabs.indexOf(e.currentTarget);
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

function computeTargetScales(
  isPressed: boolean,
  isNavbarActive: boolean,
  isMobileNav: boolean,
  dimensions: { width: number; height: number },
) {
  const tapDeltaX = isMobileNav
    ? scaleDeltas.tap.mobile
    : scaleDeltas.tap.desktop;

  const delta = isMobileNav ? hoverDelta.mobile : hoverDelta.desktop;
  const pillWidth = dimensions.width;
  const pillHeight = dimensions.height;

  const hoverScaleX = 1 + (2 * delta) / pillWidth;
  const hoverScaleY = 1 + (2 * delta) / pillHeight;

  const tapScaleX = 1 + tapDeltaX / dimensions.width;
  const tapScaleY = isMobileNav
    ? scaleVertical.tap.mobile
    : scaleVertical.tap.desktop;

  if (isPressed) {
    return { targetScaleX: tapScaleX, targetScaleY: tapScaleY };
  }
  if (isNavbarActive) {
    return { targetScaleX: hoverScaleX, targetScaleY: hoverScaleY };
  }
  return { targetScaleX: 1, targetScaleY: 1 };
}

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
const NAVBAR_HIGHLIGHT_REGEX = /navbar-highlight-(?:active|flat)/;
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
  hoverStore: {
    get: () => TabValue | null;
    subscribe: (listener: () => void) => () => void;
  },
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
  return { isHovered, showHighlight };
}

function resolveContextHighlightClass(
  contextHighlightClass: string | undefined,
  isNavbarActive: boolean,
): string {
  if (!contextHighlightClass) return "";
  if (contextHighlightClass.includes("navbar-highlight-")) {
    return contextHighlightClass.replace(
      NAVBAR_HIGHLIGHT_REGEX,
      isNavbarActive ? "navbar-highlight-active" : "navbar-highlight-flat",
    );
  }
  return contextHighlightClass;
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
        hoverStore.set(value);
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
  onAnimationComplete: () => void;
  ripple: boolean;
  rippleX: MotionValue<number>;
  rippleY: MotionValue<number>;
  rippleScale: MotionValue<number>;
  rippleOpacity: MotionValue<number>;
}

const TabHighlight = memo(function TabHighlight({
  layoutId,
  layoutTransition,
  outerHighlightClass,
  outerHighlightStyle,
  scaleAnimationTarget,
  innerHighlightClass,
  willChange,
  onAnimationComplete,
  ripple,
  rippleX,
  rippleY,
  rippleScale,
  rippleOpacity,
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
        transition={springs.scale}
        onAnimationComplete={onAnimationComplete}
        className={innerHighlightClass}
        style={{
          transform: "scale(var(--scale-x), var(--scale-y))",
          borderRadius:
            "calc((var(--base-radius) * var(--scale-y)) / var(--scale-x)) / var(--base-radius)",
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
  const { onChange } = actions;
  const {
    layoutId,
    variant,
    hoverSlide,
    ripple,
    roundedClass: contextRoundedClass,
    highlightClassName: contextHighlightClass,
    highlightStyle: contextHighlightStyle,
    highlightTransition: contextHighlightTransition,
    role: parentRole,
  } = config;

  const effectiveRoundedClass = tabRoundedClass ?? contextRoundedClass;

  const prefersReducedMotion = useReducedMotion();
  const { rippleX, rippleY, rippleScale, rippleOpacity, onPointerDown } =
    useRipple(ripple && !prefersReducedMotion);

  const isMobile = useIsMobile();
  const isTouchDevice = useIsTouchDevice();
  const { isActive, isTransitioning } = useTabActive(activeStore, value);
  const { isHovered, showHighlight } = useTabHover(
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

  const isNavbarActive =
    isHovered ||
    isTransitioning ||
    !!contextHighlightClass?.includes("navbar-highlight-active");

  const { targetScaleX, targetScaleY } = computeTargetScales(
    isPressed,
    isNavbarActive,
    !!isMobileNav,
    dimensions,
  );

  const handleMouseEnter = useCallback(() => {
    if (disabled || !hoverSlide || isTouchDevice) return;
    hoverStore.set(value);
  }, [disabled, hoverSlide, isTouchDevice, value, hoverStore]);

  const selectOption = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (onChange) onChange(value);
      if (onClick) onClick(e);
    },
    [disabled, onChange, onClick, value],
  );

  const handleAnimationComplete = useCallback(() => {
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
          onAnimationComplete={handleAnimationComplete}
          ripple={ripple}
          rippleX={rippleX}
          rippleY={rippleY}
          rippleScale={rippleScale}
          rippleOpacity={rippleOpacity}
        />
      ) : null}
      {children}
    </motion.button>
  );
}

const Tab = memo(TabComponent);
Tab.displayName = "Tab";

export { Tabs, Tab };
