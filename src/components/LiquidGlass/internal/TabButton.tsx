import {
  memo,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { mergeProps } from "@base-ui/react/merge-props";
import {
  animate,
  motion,
  type MotionValue,
  type Transition,
} from "motion/react";
import { useResizeObserver } from "../../../hooks/useResizeObserver";
import { cn } from "../../../utils/cn";
import { SPRING } from "../../../utils/springConfig";
import { useRipple } from "./useRipple";
import {
  computeOuterHighlightStyle,
  getEntryDimensions,
  resolveContextHighlightClass,
} from "./liquidGlassUtils";
import {
  computeTabSnapshotFromSlice,
  selectTabSnapshotSlice,
  type TabValue,
} from "./liquidGlassStore";
import { TabHighlight } from "./TabHighlight";
import { useTabsContext } from "./useTabsShell";

export interface DraggableTabBridge {
  registerTabElement: (val: TabValue, el: HTMLButtonElement | null) => void;
  measureTabs: () => void;
  handleTabPointerDown: (
    val: TabValue,
    e: PointerEvent<HTMLButtonElement>,
  ) => boolean;
  consumeDragClickSuppression: () => boolean;
  isGrabActive: () => boolean;
}

export interface TabButtonBaseProps extends Omit<
  ComponentPropsWithoutRef<typeof motion.button>,
  "value" | "children"
> {
  value: TabValue;
  children?: ReactNode;
  activeClassName?: string;
  roundedClass?: string;
  highlightClassName?: string;
}

interface TabButtonProps extends TabButtonBaseProps {
  isDraggable?: boolean;
  dragBridge?: DraggableTabBridge;
}

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

export const TabButton = memo(function TabButton({
  value,
  children,
  className = "",
  activeClassName = "",
  roundedClass: tabRoundedClass,
  highlightClassName = "",
  onClick,
  disabled = false,
  isDraggable = false,
  dragBridge,
  ...rest
}: Readonly<TabButtonProps>) {
  const { state, actions, meta } = useTabsContext();
  const {
    variant,
    orientation,
    isMobileNav,
    isTouchDevice,
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
  } = actions;
  const { store, layoutId, scaleX, scaleY } = meta;

  useLayoutEffect(() => {
    return registerTab(value);
  }, [registerTab, value]);

  const snapshotSlice = useStore(
    store,
    useShallow((s) => selectTabSnapshotSlice(s, value, isTouchDevice)),
  );

  const effectiveRoundedClass = tabRoundedClass ?? contextRoundedClass;
  const rendersRipple = !prefersReducedMotion;

  const { rippleX, rippleY, rippleScale, rippleOpacity, onPointerDown } =
    useRipple(rendersRipple && !isDraggable);

  const layoutTransition = prefersReducedMotion
    ? REDUCED_LAYOUT_TRANSITION
    : HIGHLIGHT_TRANSITION;

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dimensions = useTabDimensions(buttonRef, dragBridge?.measureTabs);

  useLayoutEffect(() => {
    if (!isDraggable || !dragBridge) return;
    dragBridge.registerTabElement(value, buttonRef.current);
    dragBridge.measureTabs();
    return () => {
      dragBridge.registerTabElement(value, null);
    };
  }, [dragBridge, isDraggable, value]);

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
  } = computeTabSnapshotFromSlice(snapshotSlice, dimensions, {
    orientation,
    isMobileNav,
    prefersReducedMotion: Boolean(prefersReducedMotion),
  });

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
      if (isDraggable && dragBridge) {
        dragBridge.handleTabPointerDown(value, e);
        return;
      }
      onPointerDown(e);
      pressTab(value, e.pointerType);
    },
    [disabled, dragBridge, isDraggable, onPointerDown, pressTab, value],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      if (isDraggable && dragBridge?.isGrabActive()) return;
      releaseTab(value, e.pointerType);
    },
    [dragBridge, isDraggable, releaseTab, value],
  );

  const handleMouseLeave = useCallback(() => {
    if (isDraggable && dragBridge?.isGrabActive()) return;
    leaveTab(value);
  }, [dragBridge, isDraggable, leaveTab, value]);

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    hoverTab(value);
  }, [disabled, hoverTab, value]);

  const selectOption = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (isDraggable && dragBridge?.consumeDragClickSuppression()) {
        e.preventDefault();
        return;
      }
      selectTab(value);
      onChange?.(value);
      onClick?.(e);
    },
    [disabled, dragBridge, isDraggable, onChange, onClick, selectTab, value],
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
          innerHighlightStyle={contextHighlightStyle}
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
});
TabButton.displayName = "TabButton";
