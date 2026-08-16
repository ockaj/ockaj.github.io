import {
  createContext,
  use,
  useMemo,
  useState,
  useEffect,
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
} from "react";
import {
  motion,
  useReducedMotion,
  LayoutGroup,
  MotionContext,
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
}

interface LiquidGlassTabPanelProps extends HTMLAttributes<HTMLDivElement> {
  value: string | number;
  children?: ReactNode;
}

type TabValue = string | number;

interface TabsContextValue {
  value: TabValue;
  onChange?: (value: TabValue) => void;
  layoutId: string;
  hoverStore: {
    get: () => TabValue | null;
    set: (val: TabValue | null) => void;
    subscribe: (listener: () => void) => () => void;
  };
  hoverSlide: boolean;
  ripple: boolean;
  roundedClass: string;
  squircle: boolean;
  highlightClassName?: string;
  highlightStyle?: CSSProperties;
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
  style,
  role = "tablist",
  ...rest
}: Readonly<LiquidGlassTabsProps<T>>) {
  const hoverStore = useMemo(() => {
    const ref = { current: null as string | number | null };
    const listeners = new Set<() => void>();
    return {
      get: () => ref.current,
      set: (val: string | number | null) => {
        ref.current = val;
        listeners.forEach((l) => l());
      },
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
    };
  }, []);

  const contextValue = useMemo<TabsContextValue>(
    () => ({
      value,
      onChange: onChange as (value: string | number) => void,
      layoutId,
      hoverStore,
      hoverSlide,
      ripple,
      roundedClass,
      squircle,
      highlightClassName,
      highlightStyle,
      role,
    }),
    [
      value,
      onChange,
      layoutId,
      hoverStore,
      hoverSlide,
      ripple,
      roundedClass,
      squircle,
      highlightClassName,
      highlightStyle,
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

  return { computedAriaSelected, computedAriaControls, computedTabIndex };
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

const Tab = memo(function Tab({
  value,
  children,
  className = "",
  activeClassName = "",
  highlightClassName = "",
  highlightStyle = DEFAULT_STYLE,
  onClick,
  disabled = false,
  ...rest
}: LiquidGlassTabProps) {
  const {
    value: activeValue,
    onChange,
    layoutId,
    hoverStore,
    hoverSlide,
    ripple,
    roundedClass,
    squircle,
    highlightClassName: contextHighlightClass,
    highlightStyle: contextHighlightStyle,
    role: parentRole,
  } = useTabsContext();

  const prefersReducedMotion = useReducedMotion();

  const { rippleX, rippleY, rippleRadius, rippleOpacity, onPointerDown } =
    useRipple(ripple && !prefersReducedMotion);

  const isMobile = useIsMobile();
  const isActive = activeValue === value;

  const [isHovered, setIsHovered] = useState(() => hoverStore.get() === value);
  const [isAnyHovered, setIsAnyHovered] = useState(
    () => hoverStore.get() !== null,
  );
  const [willChange, setWillChange] = useState(false);

  useEffect(() => {
    return hoverStore.subscribe(() => {
      const currentHovered = hoverStore.get();
      setIsHovered(currentHovered === value);
      setIsAnyHovered(currentHovered !== null);
      setWillChange(true);
    });
  }, [hoverStore, value, setWillChange]);

  const isMobileNav = layoutId?.includes("mobile") || isMobile;

  const layoutTransition = useMemo(() => {
    if (prefersReducedMotion) {
      return { layout: { duration: 0 } };
    }
    return HIGHLIGHT_TRANSITION;
  }, [prefersReducedMotion]);

  const tabRole = resolveTabRole(rest.role, parentRole);
  const isTabRole = tabRole === "tab";

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [element, setElement] = useState<HTMLButtonElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 120, height: 36 });

  const setButtonRef = useCallback((node: HTMLButtonElement | null) => {
    buttonRef.current = node;
    setElement(() => node);
  }, []);

  useResizeObserver(element, (entry) => {
    const { width, height } = getEntryDimensions(entry);
    if (width > 0 && height > 0) {
      setDimensions((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height },
      );
    }
  });

  const [isPressed, setIsPressed] = useState(false);

  const isNavbarActive = !!contextHighlightClass?.includes(
    "navbar-highlight-active",
  );

  const { targetScaleX, targetScaleY } = computeTargetScales(
    isPressed,
    isNavbarActive,
    !!isMobileNav,
    dimensions,
  );

  const showHighlight = hoverSlide
    ? isHovered || (isActive && !isAnyHovered)
    : isActive;

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
    () =>
      ({
        "--scale-x": targetScaleX,
        "--scale-y": targetScaleY,
      }) as Record<string, number>,
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

  const innerHighlightClass =
    `absolute inset-0 highlight-pill overflow-hidden ${roundedClass} ${contextHighlightClass} ${highlightClassName}`.trim();

  const { computedAriaSelected, computedAriaControls, computedTabIndex } =
    computeTabAriaProps(
      rest["aria-selected"] as boolean | undefined,
      rest["aria-controls"],
      rest.tabIndex,
      isTabRole,
      isActive,
    );

  return (
    <motion.button
      ref={setButtonRef}
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
});

const TabPanel = memo(function TabPanel({
  value,
  children,
  ...rest
}: LiquidGlassTabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      {...rest}
    >
      {children}
    </div>
  );
});

TabPanel.displayName = "TabPanel";

export { Tabs, Tab, TabPanel };
