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
  animate,
  motion,
  useMotionValue,
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
import {
  createActiveTabStore,
  createHoverTabStore,
  type ActiveTabStore,
  type HoverTabStore,
  type TabValue,
} from "./liquidGlassStore";

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

type ActiveStore = ActiveTabStore;
type HoverStore = HoverTabStore;

interface TabsContextValue {
  state: {
    activeStore: ActiveStore;
    hoverStore: HoverStore;
    scaleX: MotionValue<number>;
    scaleY: MotionValue<number>;
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
  const [hoverStore] = useState(createHoverTabStore);
  const [activeStore] = useState(() => createActiveTabStore(value));
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  const tabOrderRef = useRef<TabValue[]>([]);

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
      const fromIdx = tabOrderRef.current.indexOf(from);
      const toIdx = tabOrderRef.current.indexOf(to);
      return fromIdx !== -1 && toIdx !== -1 ? Math.abs(toIdx - fromIdx) : 1;
    },
    [],
  );

  const getTabCount = useCallback(() => tabOrderRef.current.length, []);

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
      scaleX.stop();
      scaleY.stop();
    };
  }, [activeStore, hoverStore, scaleX, scaleY]);

  const effectiveRoundedClass = roundedClass ?? getDefaultTabRadius(variant);

  const contextValue = useMemo<TabsContextValue>(
    () => ({
      state: {
        activeStore,
        hoverStore,
        scaleX,
        scaleY,
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
      scaleX,
      scaleY,
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

/** Critically damped spring for gentle, non-bouncy settle to idle (zero undershoot) */
const SETTLE_SPRING = {
  type: "spring" as const,
  stiffness: 160,
  damping: 26,
  mass: 0.8,
} as const;

function useTabActive(activeStore: ActiveStore, value: TabValue) {
  const snapshot = useSyncExternalStore(
    activeStore.subscribe,
    useCallback(() => {
      if (activeStore.get() !== value) return 0;
      const phase = activeStore.getPhase();
      if (phase === "flight") return 2;
      if (phase === "landing") return 3;
      return 1;
    }, [activeStore, value]),
    useCallback(
      () => (activeStore.get() === value ? 1 : 0),
      [activeStore, value],
    ),
  );

  return {
    isActive: snapshot > 0,
    isTransitioning: snapshot === 2,
    isLanding: snapshot === 3,
  };
}

function useTabHover(
  hoverStore: HoverStore,
  value: TabValue,
  isActive: boolean,
  hoverSlide: boolean,
  isTouchDevice: boolean,
) {
  const snapshot = useSyncExternalStore(
    hoverStore.subscribe,
    useCallback(() => {
      if (isTouchDevice) {
        return isActive ? 2 : 0;
      }
      const current = hoverStore.get();
      const isHovered = current === value;
      const showHighlight = hoverSlide
        ? isHovered || (isActive && current === null)
        : isActive;
      const isHoverMoving = isHovered && hoverStore.isMoving();
      return (
        (isHovered ? 1 : 0) | (showHighlight ? 2 : 0) | (isHoverMoving ? 4 : 0)
      );
    }, [hoverStore, hoverSlide, isActive, isTouchDevice, value]),
    useCallback(() => (isActive ? 2 : 0), [isActive]),
  );

  return {
    isHovered: (snapshot & 1) !== 0,
    showHighlight: (snapshot & 2) !== 0,
    isHoverMoving: (snapshot & 4) !== 0,
  };
}

function useTabDimensions(buttonRef: RefObject<HTMLButtonElement | null>) {
  const [dimensions, setDimensions] = useState({ width: 120, height: 36 });

  useResizeObserver(buttonRef, (entry) => {
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
      setIsPressed(true);
    },
    [disabled, hoverSlide, isTouchDevice, value, hoverStore, onPointerDown],
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
  onLayoutAnimationComplete: () => void;
}

const SEGMENTED_HIGHLIGHT_RADIUS =
  "calc((var(--base-radius) + max(0px, var(--pill-h, 36px) * (var(--scale-y) - 1) / 2)) / var(--scale-x)) / calc((var(--base-radius) + max(0px, var(--pill-h, 36px) * (var(--scale-y) - 1) / 2)) / var(--scale-y))";
const CAPSULE_HIGHLIGHT_RADIUS =
  "calc((var(--base-radius) * var(--scale-y)) / var(--scale-x)) / var(--base-radius)";

function resolveEffectiveDistance(
  isHoverMoving: boolean,
  isTransitioning: boolean,
  hoverStore: HoverStore,
  activeStore: ActiveStore,
): number {
  if (isHoverMoving) return hoverStore.getDistance();
  if (isTransitioning) return activeStore.getDistance();
  return 0;
}

function useTabScaleAnimation(
  showHighlight: boolean,
  prefersReducedMotion: boolean | null,
  scaleX: MotionValue<number>,
  scaleY: MotionValue<number>,
  targetScaleX: number,
  targetScaleY: number,
  onSettle?: () => void,
) {
  useLayoutEffect(() => {
    if (!showHighlight) {
      onSettle?.();
      return;
    }
    if (prefersReducedMotion) {
      scaleX.jump(targetScaleX);
      scaleY.jump(targetScaleY);
      onSettle?.();
      return;
    }
    const scaleSpring =
      targetScaleX === 1 && targetScaleY === 1 ? SETTLE_SPRING : springs.scale;
    const animX = animate(scaleX, targetScaleX, scaleSpring);
    const animY = animate(scaleY, targetScaleY, scaleSpring);
    let cancelled = false;

    if (onSettle) {
      animY.then(() => {
        if (!cancelled) {
          onSettle();
        }
      });
    }

    return () => {
      cancelled = true;
      animX.stop();
      animY.stop();
    };
  }, [
    showHighlight,
    prefersReducedMotion,
    scaleX,
    scaleY,
    targetScaleX,
    targetScaleY,
    onSettle,
  ]);
}

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
            transform: "scale(var(--scale-x, 1), var(--scale-y, 1))",
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
  const { activeStore, hoverStore, scaleX, scaleY } = state;
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
  const { isActive, isTransitioning, isLanding } = useTabActive(
    activeStore,
    value,
  );
  const { isHovered, showHighlight, isHoverMoving } = useTabHover(
    hoverStore,
    value,
    isActive,
    hoverSlide,
    isTouchDevice,
  );

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
    isTouchDevice,
  );

  const dimensions = useTabDimensions(buttonRef);

  const isMobileNav = layoutId?.includes("mobile") || isMobile;

  const tabRole = resolveTabRole(rest.role, parentRole);
  const isTabRole = tabRole === "tab";

  const isHoverActive =
    isHovered ||
    isTransitioning ||
    isLanding ||
    !!contextHighlightClass?.includes("navbar-highlight-active");

  const effectiveDistance = resolveEffectiveDistance(
    isHoverMoving,
    isTransitioning,
    hoverStore,
    activeStore,
  );

  const isTraveling = effectiveDistance > 0;

  const { targetScaleX, targetScaleY } = computeTargetScales(
    isPressed,
    isHoverActive || (variant === "capsule" ? isActive : false),
    isTraveling,
    orientation,
    !!isMobileNav,
    dimensions,
    effectiveDistance,
    prefersReducedMotion ?? false,
    isTraveling ? getTabCount() : 0,
  );

  const handleLandingSettle = useCallback(() => {
    if (activeStore.getPhase() === "landing") {
      activeStore.completeFlight();
    }
  }, [activeStore]);

  useTabScaleAnimation(
    showHighlight,
    prefersReducedMotion,
    scaleX,
    scaleY,
    targetScaleX,
    targetScaleY,
    isLanding ? handleLandingSettle : undefined,
  );

  const handleLayoutAnimationComplete = useCallback(() => {
    if (activeStore.getPhase() === "flight") {
      activeStore.beginLanding();
    }
  }, [activeStore]);

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
      if (hoverStore.get() === value) {
        hoverStore.set(value, 0);
      }
      if (onChange) onChange(value);
      if (onClick) onClick(e);
    },
    [disabled, hoverStore, onChange, onClick, value],
  );

  const isNavbarActive = isHoverActive;
  const willChange = isNavbarActive || isPressed;

  const outerHighlightClass =
    `absolute inset-0 z-[-1] pointer-events-none ${effectiveRoundedClass}`.trim();

  const outerHighlightStyle = useMemo(
    () =>
      computeOuterHighlightStyle(
        variant,
        effectiveRoundedClass,
        dimensions.height,
        willChange,
        contextHighlightStyle,
        highlightStyle,
      ),
    [
      variant,
      effectiveRoundedClass,
      dimensions.height,
      willChange,
      contextHighlightStyle,
      highlightStyle,
    ],
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
          scaleX={scaleX}
          scaleY={scaleY}
          innerHighlightClass={innerHighlightClass}
          willChange={willChange}
          ripple={ripple}
          rippleX={rippleX}
          rippleY={rippleY}
          rippleScale={rippleScale}
          rippleOpacity={rippleOpacity}
          variant={variant}
          onLayoutAnimationComplete={handleLayoutAnimationComplete}
        />
      ) : null}
      {children}
    </motion.button>
  );
}

const Tab = memo(TabComponent);
Tab.displayName = "Tab";

export { Tabs, Tab };
