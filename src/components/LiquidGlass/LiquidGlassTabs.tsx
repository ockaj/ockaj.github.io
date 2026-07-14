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
import { motion, useReducedMotion } from "motion/react";
import { SPRING } from "../../utils/springConfig";
import Ripple from "./Ripple";
import { useRipple } from "./useRipple";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import { DEFAULT_STYLE } from "./types";
import { scaleDeltas, scaleVertical, springs, hoverDelta } from "./config";

export interface LiquidGlassTabsProps<
  T extends string | number = string | number,
> extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
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
}

export interface LiquidGlassTabProps extends Omit<
  ComponentPropsWithoutRef<typeof motion.button>,
  "value" | "children"
> {
  value: string | number;
  children?: ReactNode;
  activeClassName?: string;
  highlightClassName?: string;
  highlightStyle?: CSSProperties;
}

export interface LiquidGlassTabPanelProps extends HTMLAttributes<HTMLDivElement> {
  value: string | number;
  children?: ReactNode;
}

interface TabsContextValue {
  value: string | number;
  onChange?: (value: string | number) => void;
  layoutId: string;
  hoverStore: {
    get: () => string | number | null;
    set: (val: string | number | null) => void;
    subscribe: (listener: () => void) => () => void;
  };
  hoverSlide: boolean;
  ripple: boolean;
  roundedClass: string;
  squircle: boolean;
  highlightClassName?: string;
  highlightStyle?: CSSProperties;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = use(TabsContext);
  if (!context) {
    throw new Error("Tab must be used within a Tabs component");
  }
  return context;
}

function TabsInner<T extends string | number>({
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
  ...rest
}: LiquidGlassTabsProps<T>) {
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
      onChange: onChange as unknown as (value: string | number) => void,
      layoutId,
      hoverStore,
      hoverSlide,
      ripple,
      roundedClass,
      squircle,
      highlightClassName,
      highlightStyle,
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
    ],
  );

  return (
    <TabsContext value={contextValue}>
      <div
        role="tablist"
        tabIndex={-1}
        className={`flex ${className}`}
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
    </TabsContext>
  );
}

interface TabsComponent {
  <T extends string | number>(props: LiquidGlassTabsProps<T>): ReactNode;
  displayName?: string;
}

const Tabs = memo(TabsInner) as unknown as TabsComponent;
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

// hoist static layout transition to prevent new object recreation on each render of Tab
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

  const tabRole = rest.role !== undefined ? rest.role : "tab";
  const isTabRole = tabRole === "tab";

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [element, setElement] = useState<HTMLButtonElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 120, height: 36 });

  // measure element layout sizes using callback ref instead of mount useEffect to prevent extra render cycles
  const setButtonRef = useCallback((node: HTMLButtonElement | null) => {
    buttonRef.current = node;
    setElement(() => node);
    if (!node) return;
    setDimensions({ width: node.offsetWidth, height: node.offsetHeight });
  }, []);

  // useResizeObserver prevents layout thrashing during interactions
  useResizeObserver(element, (entry) => {
    const el = entry.target as HTMLElement;
    setDimensions({
      width: el.offsetWidth,
      height: el.offsetHeight,
    });
  });

  const tapDeltaX = isMobileNav
    ? scaleDeltas.tap.mobile
    : scaleDeltas.tap.desktop;

  const delta = isMobileNav ? hoverDelta.mobile : hoverDelta.desktop;

  const pillWidth = dimensions.width;
  const pillHeight = dimensions.height;

  const HOVER_SCALE_X = 1 + (2 * delta) / pillWidth;
  const HOVER_SCALE_Y = 1 + (2 * delta) / pillHeight;

  const TAP_SCALE_X = 1 + tapDeltaX / dimensions.width;
  const TAP_SCALE_Y = isMobileNav
    ? scaleVertical.tap.mobile
    : scaleVertical.tap.desktop;

  const [isPressed, setIsPressed] = useState(false);

  const isNavbarActive = contextHighlightClass?.includes(
    "navbar-highlight-active",
  );

  const targetScaleX = isPressed
    ? TAP_SCALE_X
    : isNavbarActive
      ? HOVER_SCALE_X
      : 1;

  const targetScaleY = isPressed
    ? TAP_SCALE_Y
    : isNavbarActive
      ? HOVER_SCALE_Y
      : 1;

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
      onPointerDown(e);
    },
    [disabled, onPointerDown],
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
  const baseRadius = squircle
    ? Math.min(dimensions.height / 2, 16)
    : dimensions.height / 2;

  const outerHighlightStyle = {
    ...contextHighlightStyle,
    ...highlightStyle,
    "--base-radius": `${baseRadius}px`,
    willChange: willChange ? "transform" : "auto",
  };

  const innerHighlightClass =
    `absolute inset-0 highlight-pill overflow-hidden ${roundedClass} ${contextHighlightClass} ${highlightClassName}`.trim();

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
      onPointerCancel={() => setIsPressed(false)}
      onMouseLeave={() => {
        setIsPressed(false);
      }}
      onMouseEnter={() => {
        handleMouseEnter();
      }}
      className={`relative select-none z-10 transition-colors duration-200 focus-visible:outline-none ${className} ${
        isActive ? activeClassName : ""
      }`}
      {...rest}
      role={tabRole ?? undefined}
      aria-selected={
        rest["aria-selected"] !== undefined
          ? rest["aria-selected"]
          : isTabRole
            ? isActive
              ? "true"
              : undefined
            : undefined
      }
      aria-controls={
        rest["aria-controls"] !== undefined
          ? rest["aria-controls"]
          : isTabRole
            ? `tabpanel-${value}`
            : undefined
      }
      id={`tab-${value}`}
      tabIndex={
        rest.tabIndex !== undefined
          ? rest.tabIndex
          : isTabRole
            ? isActive
              ? 0
              : -1
            : undefined
      }
      onKeyDown={isTabRole ? handleTabKeyDown : rest.onKeyDown}
    >
      {showHighlight ? (
        <motion.span
          layoutId={layoutId}
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
