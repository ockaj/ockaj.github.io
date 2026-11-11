import {
  createContext,
  memo,
  use,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import type { MotionValue } from "motion/react";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import { useRipple } from "./internal/useRipple";
import DraggableTabHighlight from "./internal/DraggableTabHighlight";
import { useDraggableTabs } from "./internal/useDraggableTabs";
import type {
  TabsPhysicsController,
  TabValue,
} from "./internal/liquidGlassStore";
import { TabsProvider, type TabsShellProps } from "./internal/TabsShell";
import { useTabsShellController } from "./internal/useTabsShell";
import { getDefaultTabRadius } from "./internal/liquidGlassUtils";
import {
  TabButton,
  type DraggableTabBridge,
  type TabButtonBaseProps,
} from "./internal/TabButton";
import { DEFAULT_STYLE, type TabOrientation } from "./internal/types";

type DraggableTabsProps<T extends string | number = string | number> =
  TabsShellProps<T> & {
    capsuleOffsetX?: MotionValue<number>;
  };

type DraggableTabProps = TabButtonBaseProps;

interface DraggableTabsContextValue {
  isDraggable: boolean;
  bridge: DraggableTabBridge;
}

const NOOP_BRIDGE: DraggableTabBridge = {
  registerTabElement: () => {},
  measureTabs: () => {},
  handleTabPointerDown: () => false,
  consumeDragClickSuppression: () => false,
  isGrabActive: () => false,
};

const DraggableTabsContext = createContext<DraggableTabsContextValue | null>(
  null,
);

interface DraggableTabsControllerProps {
  controller: TabsPhysicsController;
  containerRef: RefObject<HTMLDivElement | null>;
  capsuleOffsetX?: MotionValue<number>;
  registerBridge: (bridge: DraggableTabBridge | null) => void;
  scaleX: MotionValue<number>;
  scaleY: MotionValue<number>;
  orientation: TabOrientation;
  isMobileNav: boolean;
  isTouchDevice: boolean;
  prefersReducedMotion: boolean | null;
  onChange?: (value: TabValue) => void;
  effectiveRoundedClass: string;
  highlightClassName: string;
  highlightStyle: CSSProperties;
}

function DraggableTabsController({
  controller,
  containerRef,
  capsuleOffsetX,
  registerBridge,
  scaleX,
  scaleY,
  orientation,
  isMobileNav,
  isTouchDevice,
  prefersReducedMotion,
  onChange,
  effectiveRoundedClass,
  highlightClassName,
  highlightStyle,
}: Readonly<DraggableTabsControllerProps>) {
  const draggableRipple = useRipple(!prefersReducedMotion);

  const draggable = useDraggableTabs({
    enabled: true,
    controller,
    containerRef,
    capsuleOffsetX,
    isTouchDevice,
    prefersReducedMotion,
    onChange,
    triggerRippleAt: draggableRipple.triggerAt,
  });

  useResizeObserver(containerRef, draggable.measureTabs);

  useLayoutEffect(() => {
    registerBridge({
      registerTabElement: draggable.registerTabElement,
      measureTabs: draggable.measureTabs,
      handleTabPointerDown: draggable.handleTabPointerDown,
      consumeDragClickSuppression: draggable.consumeDragClickSuppression,
      isGrabActive: draggable.isGrabActive,
    });
    return () => {
      registerBridge(null);
    };
  }, [
    registerBridge,
    draggable.registerTabElement,
    draggable.measureTabs,
    draggable.handleTabPointerDown,
    draggable.consumeDragClickSuppression,
    draggable.isGrabActive,
  ]);

  return (
    <DraggableTabHighlight
      store={controller.store}
      getTabGeometries={controller.getTabGeometries}
      orientation={orientation}
      isMobileNav={isMobileNav}
      isTouchDevice={isTouchDevice}
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
  );
}

function DraggableTabsInner<T extends TabValue>({
  value,
  onChange,
  layoutId,
  orientation = "horizontal",
  children,
  variant = "capsule",
  roundedClass,
  className = "",
  highlightClassName = "navbar-highlight-flat",
  highlightStyle = DEFAULT_STYLE,
  style,
  role = "tablist",
  capsuleOffsetX,
  ...rest
}: Readonly<DraggableTabsProps<T>>) {
  const shell = useTabsShellController({
    value,
    layoutId,
    orientation,
  });

  const isDraggable = Boolean(
    orientation === "horizontal" && !shell.isMobileNav,
  );
  const bridgeRef = useRef<DraggableTabBridge | null>(null);

  const registerBridge = useCallback((bridge: DraggableTabBridge | null) => {
    bridgeRef.current = bridge;
  }, []);

  const canLeaveTabs = useCallback(
    () => !(isDraggable && bridgeRef.current?.isGrabActive()),
    [isDraggable],
  );

  const shouldSuppressClickCapture = useCallback(
    () => Boolean(isDraggable && bridgeRef.current?.consumeDragClickSuppression()),
    [isDraggable],
  );

  const draggableContextValue = useMemo<DraggableTabsContextValue>(
    () => ({
      isDraggable,
      bridge: isDraggable
        ? {
            registerTabElement: (val, el) => {
              bridgeRef.current?.registerTabElement(val, el);
            },
            measureTabs: () => {
              bridgeRef.current?.measureTabs();
            },
            handleTabPointerDown: (val, e) =>
              bridgeRef.current?.handleTabPointerDown(val, e) ?? false,
            consumeDragClickSuppression: () =>
              bridgeRef.current?.consumeDragClickSuppression() ?? false,
            isGrabActive: () => bridgeRef.current?.isGrabActive() ?? false,
          }
        : NOOP_BRIDGE,
    }),
    [isDraggable],
  );

  const effectiveRoundedClass = roundedClass ?? getDefaultTabRadius(variant);

  return (
    <DraggableTabsContext value={draggableContextValue}>
      <TabsProvider
        shell={shell}
        onChange={onChange as ((val: TabValue) => void) | undefined}
        layoutId={layoutId}
        orientation={orientation}
        variant={variant}
        roundedClass={effectiveRoundedClass}
        className={className}
        highlightClassName={highlightClassName}
        highlightStyle={highlightStyle}
        style={style}
        role={role}
        isRelative={isDraggable}
        canLeaveTabs={canLeaveTabs}
        shouldSuppressClickCapture={shouldSuppressClickCapture}
        htmlProps={rest}
      >
        {isDraggable ? (
          <DraggableTabsController
            controller={shell.controller}
            containerRef={shell.containerRef}
            capsuleOffsetX={capsuleOffsetX}
            registerBridge={registerBridge}
            scaleX={shell.scaleX}
            scaleY={shell.scaleY}
            orientation={orientation}
            isMobileNav={shell.isMobileNav}
            isTouchDevice={shell.isTouchDevice}
            prefersReducedMotion={shell.prefersReducedMotion}
            onChange={onChange as ((val: TabValue) => void) | undefined}
            effectiveRoundedClass={effectiveRoundedClass}
            highlightClassName={highlightClassName}
            highlightStyle={highlightStyle}
          />
        ) : null}
        {children}
      </TabsProvider>
    </DraggableTabsContext>
  );
}

interface DraggableTabsComponent {
  <T extends string | number>(
    props: Readonly<DraggableTabsProps<T>>,
  ): ReactNode;
  displayName?: string;
}

const DraggableTabs: DraggableTabsComponent = memo(
  DraggableTabsInner,
) as DraggableTabsComponent;
DraggableTabs.displayName = "DraggableTabs";

function DraggableTabComponent(props: Readonly<DraggableTabProps>) {
  const draggableCtx = use(DraggableTabsContext);
  if (!draggableCtx) {
    throw new Error("DraggableTab must be used within a DraggableTabs component");
  }
  return (
    <TabButton
      {...props}
      isDraggable={draggableCtx.isDraggable}
      dragBridge={draggableCtx.isDraggable ? draggableCtx.bridge : undefined}
    />
  );
}

const DraggableTab = memo(DraggableTabComponent);
DraggableTab.displayName = "DraggableTab";

export { DraggableTabs, DraggableTab };
