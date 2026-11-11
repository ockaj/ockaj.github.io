import {
  useCallback,
  useMemo,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { LayoutGroup } from "motion/react";
import { cn } from "../../../utils/cn";
import type { TabValue } from "./liquidGlassStore";
import { getDefaultTabRadius } from "./liquidGlassUtils";
import { DEFAULT_STYLE, type TabOrientation, type TabVariant } from "./types";
import {
  TabsContext,
  type TabsContextValue,
  type TabsShellController,
} from "./useTabsShell";

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
