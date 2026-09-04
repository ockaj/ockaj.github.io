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
  isValidElement,
  type ReactElement,
  type CSSProperties,
  type ReactNode,
  type MouseEvent,
  type PointerEvent,
  type KeyboardEvent,
  type HTMLAttributes,
  type ComponentPropsWithoutRef,
} from "react";
import {
  motion,
  useReducedMotion,
  LayoutGroup,
  MotionContext,
  type Transition,
} from "motion/react";
import { SPRING } from "../../utils/springConfig";
import Ripple from "./Ripple";
import { useRipple } from "./useRipple";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import { getEntryDimensions } from "./liquidGlassUtils";
import { cn } from "../../utils/cn";
import { DEFAULT_STYLE } from "./types";
import { scaleDeltas, scaleVertical, springs, hoverDelta } from "./config";

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
  squircle?: boolean;
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
  onChange?: (value: TabValue) => void;
  layoutId: string;
  hoverStore: HoverStore;
  activeStore: ActiveStore;
  hoverSlide: boolean;
  ripple: boolean;
  roundedClass: string;
  squircle: boolean;
  highlightClassName?: string;
  highlightStyle?: CSSProperties;
  highlightTransition?: Transition;
  role?: string | null;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = use(TabsContext);
  if (!context) {
    throw new Error("Tab must be used within a Tabs component");
  }
  return context;
}

const EMPTY_MOTION_CONTEXT = {};

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

function TabsInner<T extends TabValue>({
  value,
  onChange,
  layoutId,
  children,
  hoverSlide = true,
  ripple = true,
  roundedClass = "rounded-full",
  squircle = false,
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

  const contextValue = useMemo<TabsContextValue>(
    () => ({
      onChange: onChange as (value: string | number) => void,
      layoutId,
      hoverStore,
      activeStore,
      hoverSlide,
      ripple,
      roundedClass,
      squircle,
      highlightClassName,
      highlightStyle,
      highlightTransition,
      role,
    }),
    [
      onChange,
      layoutId,
      hoverStore,
      activeStore,
      hoverSlide,
      ripple,
      roundedClass,
      squircle,
      highlightClassName,
      highlightStyle,
      highlightTransition,
      role,
    ],
  );

  return (
    <MotionContext value={EMPTY_MOTION_CONTEXT}>
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
    </MotionContext>
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

function computeOuterHighlightStyle(
  squircle: boolean,
  height: number,
  willChange: boolean,
  contextHighlightStyle?: CSSProperties,
  highlightStyle?: CSSProperties,
): CSSProperties {
  const baseRadius = squircle ? `${Math.min(height / 2, 16)}px` : "9999px";
  return {
    "--base-radius": baseRadius,
    ...contextHighlightStyle,
    ...highlightStyle,
    willChange: willChange ? "transform" : "auto",
  } as CSSProperties;
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
) {
  const isHovered = useSyncExternalStore(
    hoverStore.subscribe,
    useCallback(() => hoverStore.get() === value, [hoverStore, value]),
    GET_FALSE,
  );
  const showHighlight = useSyncExternalStore(
    hoverStore.subscribe,
    useCallback(() => {
      if (!hoverSlide) return isActive;
      const current = hoverStore.get();
      return current === value || (isActive && current === null);
    }, [hoverStore, hoverSlide, isActive, value]),
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

function areElementsEqual(prev: ReactElement, next: ReactElement): boolean {
  if (prev.type !== next.type || prev.key !== next.key) return false;
  const prevProps = (prev.props ?? {}) as { [key: string]: unknown };
  const nextProps = (next.props ?? {}) as { [key: string]: unknown };
  const prevKeys = Object.keys(prevProps);
  if (prevKeys.length !== Object.keys(nextProps).length) return false;

  return prevKeys.every((key) => {
    if (!Object.prototype.hasOwnProperty.call(nextProps, key)) return false;
    if (key === "children") {
      return areChildrenEqual(
        prevProps.children as ReactNode,
        nextProps.children as ReactNode,
      );
    }
    if (key === "style") {
      return areStylesEqual(
        prevProps.style as CSSProperties | undefined,
        nextProps.style as CSSProperties | undefined,
      );
    }
    return prevProps[key] === nextProps[key];
  });
}

function areArrayChildrenEqual(prev: ReactNode[], next: ReactNode[]): boolean {
  if (prev.length !== next.length) return false;
  return prev.every((node, i) => areChildrenEqual(node, next[i]));
}

function areChildrenEqual(prev: ReactNode, next: ReactNode): boolean {
  if (prev === next) return true;
  if (!prev || !next) return false;
  if (typeof prev === "string" || typeof prev === "number") {
    return prev === next;
  }
  if (Array.isArray(prev) && Array.isArray(next)) {
    return areArrayChildrenEqual(prev, next);
  }
  if (isValidElement(prev) && isValidElement(next)) {
    return areElementsEqual(prev, next);
  }
  return false;
}

function areDefinedStylesEqual(
  prev: CSSProperties,
  next: CSSProperties,
): boolean {
  const pKeys = Object.keys(prev) as (keyof CSSProperties)[];
  const nKeys = Object.keys(next);
  if (pKeys.length !== nKeys.length) return false;

  return pKeys.every((key) => {
    if (!Object.prototype.hasOwnProperty.call(next, key)) return false;
    return prev[key] === next[key];
  });
}

function areStylesEqual(
  prev: CSSProperties | undefined,
  next: CSSProperties | undefined,
): boolean {
  if (prev === next) return true;
  if (!prev || !next) return false;
  return areDefinedStylesEqual(prev, next);
}

function areTabPropsEqual(
  prev: Readonly<LiquidGlassTabProps>,
  next: Readonly<LiquidGlassTabProps>,
): boolean {
  const prevKeys = Object.keys(prev) as (keyof LiquidGlassTabProps)[];
  if (prevKeys.length !== Object.keys(next).length) return false;

  return prevKeys.every((key) => {
    if (!Object.prototype.hasOwnProperty.call(next, key)) return false;
    if (key === "children") {
      return areChildrenEqual(prev.children, next.children);
    }
    if (key === "highlightStyle") {
      return areStylesEqual(prev.highlightStyle, next.highlightStyle);
    }
    if (key === "style") {
      return areStylesEqual(
        prev.style as CSSProperties | undefined,
        next.style as CSSProperties | undefined,
      );
    }
    return prev[key] === next[key];
  });
}

function TabComponent({
  value,
  children,
  className = "",
  activeClassName = "",
  highlightClassName = "",
  highlightStyle = DEFAULT_STYLE,
  highlightTransition,
  onClick,
  disabled = false,
  ...rest
}: Readonly<LiquidGlassTabProps>) {
  const {
    onChange,
    layoutId,
    hoverStore,
    activeStore,
    hoverSlide,
    ripple,
    roundedClass,
    squircle,
    highlightClassName: contextHighlightClass,
    highlightStyle: contextHighlightStyle,
    highlightTransition: contextHighlightTransition,
    role: parentRole,
  } = useTabsContext();

  const prefersReducedMotion = useReducedMotion();

  const { rippleX, rippleY, rippleRadius, rippleOpacity, onPointerDown } =
    useRipple(ripple && !prefersReducedMotion);

  const isMobile = useIsMobile();
  const { isActive, isTransitioning } = useTabActive(activeStore, value);
  const { isHovered, showHighlight } = useTabHover(
    hoverStore,
    value,
    isActive,
    hoverSlide,
  );
  const [willChange, setWillChange] = useState(false);

  const isMobileNav = layoutId?.includes("mobile") || isMobile;

  const layoutTransition = useMemo(() => {
    if (prefersReducedMotion) {
      return { layout: { duration: 0 } };
    }
    return (
      highlightTransition ?? contextHighlightTransition ?? HIGHLIGHT_TRANSITION
    );
  }, [prefersReducedMotion, highlightTransition, contextHighlightTransition]);

  const tabRole = resolveTabRole(rest.role, parentRole);
  const isTabRole = tabRole === "tab";

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 120, height: 36 });
  const [isPressed, setIsPressed] = useState(false);

  useResizeObserver(showHighlight || isPressed ? buttonRef : null, (entry) => {
    const { width, height } = getEntryDimensions(entry);
    if (width > 0 && height > 0) {
      setDimensions((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height },
      );
    }
  });

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

  useEffect(() => {
    if (isActive) {
      const handle = requestAnimationFrame(() => {
        setWillChange(true);
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [isActive, setWillChange]);

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (hoverSlide) {
        hoverStore.set(value);
      }
      onPointerDown(e);
    },
    [disabled, hoverSlide, value, hoverStore, onPointerDown],
  );

  const handleMouseEnter = useCallback(() => {
    if (disabled || !hoverSlide) return;
    hoverStore.set(value);
  }, [disabled, hoverSlide, value, hoverStore]);

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
    `absolute inset-0 z-[-1] pointer-events-none ${roundedClass}`.trim();

  const outerHighlightStyle = computeOuterHighlightStyle(
    squircle,
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
    roundedClass,
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
      onPointerDown={(e) => {
        handlePointerDown(e);
        setWillChange(true);
        setIsPressed(true);
      }}
      onPointerUp={() => setIsPressed(false)}
      onPointerCancel={() => {
        setIsPressed(false);
        if (hoverSlide) {
          hoverStore.set(null);
        }
      }}
      onMouseLeave={() => {
        setIsPressed(false);
      }}
      onMouseEnter={() => {
        handleMouseEnter();
      }}
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
        <motion.span
          layoutId={layoutId}
          initial={false}
          className={outerHighlightClass}
          style={outerHighlightStyle as CSSProperties}
          transition={layoutTransition}
        >
          <motion.span
            animate={scaleAnimationTarget}
            transition={springs.scale}
            onAnimationComplete={handleAnimationComplete}
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
                rippleRadius={rippleRadius}
                rippleOpacity={rippleOpacity}
              />
            ) : null}
          </motion.span>
        </motion.span>
      ) : null}
      {children}
    </motion.button>
  );
}

const Tab = memo(TabComponent, areTabPropsEqual);
Tab.displayName = "Tab";

export { Tabs, Tab };
