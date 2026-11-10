import {
  createContext,
  use,
  useMemo,
  useState,
  useEffect,
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
  resolveContextHighlightClass,
} from "./liquidGlassUtils";
import { cn } from "../../utils/cn";
import { DEFAULT_STYLE, type TabOrientation } from "./types";
import {
  createTabsController,
  type TabsPhysicsController,
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

interface TabsContextValue {
  controller: TabsPhysicsController;
  scaleX: MotionValue<number>;
  scaleY: MotionValue<number>;
  onChange?: (value: TabValue) => void;
  config: {
    layoutId: string;
    variant: TabVariant;
    ripple: boolean;
    roundedClass: string;
    highlightClassName?: string;
    highlightStyle?: CSSProperties;
    highlightTransition?: Transition;
    role?: string | null;
    prefersReducedMotion: boolean | null;
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
  const isMobile = useIsMobile();
  const isTouchDevice = useIsTouchDevice();
  const prefersReducedMotion = useReducedMotion();

  const isMobileNav = Boolean(layoutId?.includes("mobile") || isMobile);
  const hasNavbarActiveClass = Boolean(
    highlightClassName?.includes("navbar-highlight-active"),
  );

  const [controller] = useState(() =>
    createTabsController({
      initialValue: value,
      orientation,
      hoverSlide,
      isMobileNav,
      prefersReducedMotion: Boolean(prefersReducedMotion),
      isTouchDevice,
      hasNavbarActiveClass,
    }),
  );

  controller.configure({
    orientation,
    hoverSlide,
    isMobileNav,
    prefersReducedMotion: Boolean(prefersReducedMotion),
    isTouchDevice,
    hasNavbarActiveClass,
  });

  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);

  useLayoutEffect(() => {
    controller.setActiveValue(value);
  }, [controller, value]);

  useEffect(() => {
    return () => {
      controller.destroy();
      scaleX.stop();
      scaleY.stop();
    };
  }, [controller, scaleX, scaleY]);

  const effectiveRoundedClass = roundedClass ?? getDefaultTabRadius(variant);

  const contextValue = useMemo<TabsContextValue>(
    () => ({
      controller,
      scaleX,
      scaleY,
      onChange: onChange as ((val: TabValue) => void) | undefined,
      config: {
        layoutId,
        variant,
        ripple,
        roundedClass: effectiveRoundedClass,
        highlightClassName,
        highlightStyle,
        highlightTransition,
        role,
        prefersReducedMotion,
      },
    }),
    [
      controller,
      scaleX,
      scaleY,
      onChange,
      layoutId,
      variant,
      ripple,
      effectiveRoundedClass,
      highlightClassName,
      highlightStyle,
      highlightTransition,
      role,
      prefersReducedMotion,
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
          onMouseMove={(e) => {
            controller.recordPointerMove(
              e.clientX,
              e.clientY,
              performance.now(),
            );
            rest.onMouseMove?.(e);
          }}
          onMouseLeave={(e) => {
            controller.leaveTabs();
            rest.onMouseLeave?.(e);
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
    const animX = animate(scaleX, targetScaleX, scaleSpring);
    const animY = animate(scaleY, targetScaleY, scaleSpring);
    return () => {
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
const CAPSULE_HIGHLIGHT_RADIUS =
  "calc((var(--base-radius) * var(--scale-y)) / var(--scale-x)) / var(--base-radius)";

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
  const { controller, scaleX, scaleY, onChange, config } = useTabsContext();
  const {
    layoutId,
    variant,
    ripple,
    roundedClass: contextRoundedClass,
    highlightClassName: contextHighlightClass,
    highlightStyle: contextHighlightStyle,
    highlightTransition: contextHighlightTransition,
    role: parentRole,
    prefersReducedMotion,
  } = config;

  useEffect(() => {
    return controller.registerTab(value);
  }, [controller, value]);

  useStore(
    controller.store,
    useCallback(
      (state) => controller.getTabStateMaskFromState(state, value),
      [controller, value],
    ),
  );

  const effectiveRoundedClass = tabRoundedClass ?? contextRoundedClass;

  const { rippleX, rippleY, rippleScale, rippleOpacity, onPointerDown } =
    useRipple(ripple && !prefersReducedMotion);

  const layoutTransition = useTabLayoutTransition(
    prefersReducedMotion,
    highlightTransition,
    contextHighlightTransition,
  );

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dimensions = useTabDimensions(buttonRef);

  const {
    isActive,
    showHighlight,
    isNavbarActive,
    willChange,
    targetScaleX,
    targetScaleY,
    scaleSpring,
  } = controller.getTabSnapshot(value, dimensions);

  useTabScaleAnimation(
    showHighlight,
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
      onPointerDown(e);
      controller.pressTab(value, e.pointerType);
    },
    [controller, disabled, onPointerDown, value],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      controller.releaseTab(value, e.pointerType);
    },
    [controller, value],
  );

  const handleMouseLeave = useCallback(() => {
    controller.leaveTab(value);
  }, [controller, value]);

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    controller.hoverTab(value);
  }, [controller, disabled, value]);

  const selectOption = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      controller.selectTab(value);
      onChange?.(value);
      onClick?.(e);
    },
    [controller, disabled, onChange, onClick, value],
  );

  const tabRole = resolveTabRole(rest.role, parentRole);
  const isTabRole = tabRole === "tab";

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
      onPointerCancel={controller.cancelTabPress}
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
          onLayoutAnimationComplete={controller.notifyLayoutComplete}
        />
      ) : null}
      {children}
    </motion.button>
  );
}

const Tab = memo(TabComponent);
Tab.displayName = "Tab";

export { Tabs, Tab };
