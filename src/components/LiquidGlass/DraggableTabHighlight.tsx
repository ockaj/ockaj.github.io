import {
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  type CSSProperties,
} from "react";
import { useStore } from "zustand";
import {
  animate,
  motion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "../../utils/cn";
import Ripple from "./Ripple";
import { resolveContextHighlightClass } from "./liquidGlassUtils";
import {
  BASE_PILL_HEIGHT,
  BASE_PILL_WIDTH,
  REF_VELOCITY,
  computeDragVelocityScaleX,
  computeDragVelocityScaleY,
  interpolateTabField,
  type TabValue,
  type TabsPhysicsController,
} from "./liquidGlassStore";

const CAPSULE_HIGHLIGHT_RADIUS =
  "calc((var(--base-radius) * var(--scale-y)) / var(--scale-x)) / var(--base-radius)";

interface DraggableTabHighlightProps {
  controller: TabsPhysicsController;
  pillTargetValue: TabValue;
  pillCenterX: MotionValue<number>;
  smoothDragVelocity: MotionValue<number>;
  pillOpacity: MotionValue<number>;
  layoutVersionMv: MotionValue<number>;
  scaleX: MotionValue<number>;
  scaleY: MotionValue<number>;
  getTabDimensionsForValue: (val: TabValue) => {
    width: number;
    height: number;
  };
  effectiveRoundedClass: string;
  contextHighlightClass: string;
  contextHighlightStyle?: CSSProperties;
  prefersReducedMotion: boolean | null;
  ripple: boolean;
  rippleX: MotionValue<number>;
  rippleY: MotionValue<number>;
  rippleScale: MotionValue<number>;
  rippleOpacity: MotionValue<number>;
}

const DraggableTabHighlight = memo(function DraggableTabHighlight({
  controller,
  pillTargetValue,
  pillCenterX,
  smoothDragVelocity,
  pillOpacity,
  layoutVersionMv,
  scaleX,
  scaleY,
  getTabDimensionsForValue,
  effectiveRoundedClass,
  contextHighlightClass,
  contextHighlightStyle,
  prefersReducedMotion,
  ripple,
  rippleX,
  rippleY,
  rippleScale,
  rippleOpacity,
}: Readonly<DraggableTabHighlightProps>) {
  const pillStateKey = useStore(
    controller.store,
    useCallback(
      (state) =>
        `${state.activeValue}|${state.hoveredValue}|${state.pressedValue}|${state.dragPreviewValue}|${state.activePhase}|${state.hoverMoving ? 1 : 0}|${state.isDragging ? 1 : 0}|${state.isPillAnimating ? 1 : 0}`,
      [],
    ),
  );

  const isMotionReduced = Boolean(prefersReducedMotion);
  const dimensions = getTabDimensionsForValue(pillTargetValue);
  const snapshot = controller.getTabSnapshot(
    pillTargetValue,
    dimensions,
    pillStateKey,
  );

  useLayoutEffect(() => {
    if (isMotionReduced) {
      scaleX.jump(snapshot.targetScaleX);
      scaleY.jump(snapshot.targetScaleY);
      return;
    }
    const animX = animate(scaleX, snapshot.targetScaleX, snapshot.scaleSpring);
    const animY = animate(scaleY, snapshot.targetScaleY, snapshot.scaleSpring);
    return () => {
      animX.stop();
      animY.stop();
    };
  }, [
    isMotionReduced,
    scaleX,
    scaleY,
    snapshot.targetScaleX,
    snapshot.targetScaleY,
    snapshot.scaleSpring,
  ]);

  const pillX = useTransform(() => pillCenterX.get() - BASE_PILL_WIDTH / 2);
  const pillY = useTransform(() => {
    layoutVersionMv.get();
    const tabs = controller.getTabGeometries();
    const x = pillCenterX.get();
    const top = interpolateTabField(x, tabs, "top", 0);
    const height = interpolateTabField(x, tabs, "height", BASE_PILL_HEIGHT);
    return top + height / 2 - BASE_PILL_HEIGHT / 2;
  });

  const totalScaleX = useTransform(() => {
    layoutVersionMv.get();
    const tabs = controller.getTabGeometries();
    const width = interpolateTabField(pillCenterX.get(), tabs, "width", 120);
    const morphX = width / BASE_PILL_WIDTH;
    const stretchedX = computeDragVelocityScaleX(
      smoothDragVelocity.get(),
      Math.max(tabs.length, 1),
      scaleX.get(),
      isMotionReduced,
      REF_VELOCITY,
    );
    return morphX * stretchedX;
  });

  const totalScaleY = useTransform(() => {
    layoutVersionMv.get();
    const tabs = controller.getTabGeometries();
    const height = interpolateTabField(
      pillCenterX.get(),
      tabs,
      "height",
      BASE_PILL_HEIGHT,
    );
    const morphY = height / BASE_PILL_HEIGHT;
    const stretchedY = computeDragVelocityScaleY(
      smoothDragVelocity.get(),
      Math.max(tabs.length, 1),
      scaleY.get(),
      isMotionReduced,
      REF_VELOCITY,
    );
    return morphY * stretchedY;
  });

  const rippleScaleX = useTransform(
    () => rippleScale.get() / Math.max(totalScaleX.get(), 0.01),
  );
  const rippleScaleY = useTransform(
    () => rippleScale.get() / Math.max(totalScaleY.get(), 0.01),
  );

  const resolvedClass = resolveContextHighlightClass(
    contextHighlightClass,
    snapshot.isNavbarActive,
  );

  const outerStyle = useMemo(
    () =>
      ({
        width: BASE_PILL_WIDTH,
        height: BASE_PILL_HEIGHT,
        x: pillX,
        y: pillY,
        opacity: pillOpacity,
        willChange: snapshot.willChange ? "transform" : "auto",
      }) as unknown as CSSProperties,
    [pillOpacity, pillX, pillY, snapshot.willChange],
  );

  const innerStyle = useMemo(
    () =>
      ({
        "--base-radius": "9999px",
        "--pill-h": `${BASE_PILL_HEIGHT}px`,
        "--scale-x": totalScaleX,
        "--scale-y": totalScaleY,
        scaleX: totalScaleX,
        scaleY: totalScaleY,
        borderRadius: CAPSULE_HIGHLIGHT_RADIUS,
        transformOrigin: "center center",
        willChange: snapshot.willChange ? "transform" : "auto",
        ...contextHighlightStyle,
      }) as unknown as CSSProperties,
    [contextHighlightStyle, snapshot.willChange, totalScaleX, totalScaleY],
  );

  const innerClass = cn(
    "absolute inset-0 highlight-pill overflow-hidden",
    effectiveRoundedClass,
    resolvedClass,
  );

  return (
    <motion.span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-0 left-0 z-0 hidden md:block",
        effectiveRoundedClass,
      )}
      style={outerStyle}
    >
      <motion.span className={innerClass} style={innerStyle}>
        {ripple ? (
          <Ripple
            rippleX={rippleX}
            rippleY={rippleY}
            rippleScale={rippleScale}
            rippleOpacity={rippleOpacity}
            rippleScaleX={rippleScaleX}
            rippleScaleY={rippleScaleY}
          />
        ) : null}
      </motion.span>
    </motion.span>
  );
});
DraggableTabHighlight.displayName = "DraggableTabHighlight";

export default DraggableTabHighlight;
