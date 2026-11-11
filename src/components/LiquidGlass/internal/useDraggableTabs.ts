import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { useStore } from "zustand";
import { animate, useMotionValue, useSpring } from "motion/react";
import { SPRING } from "../../../utils/springConfig";
import type {
  TabGeometry,
  TabValue,
  TabsPhysicsController,
} from "./liquidGlassStore";
import {
  APPLE_DECELERATION_RATE,
  BASE_PILL_HEIGHT,
  BASE_PILL_WIDTH,
  DRAG_THRESHOLD_PX,
  clampCenterWithRubberBand,
  createVelocitySampler,
  interpolateTabField,
  projectMomentum,
  resolveNearestTab,
} from "./tabDragPhysics";

const LIVE_PILL_HIT_SLOP = 8;
const CLICK_SUPPRESS_MS = 120;

interface DragSession {
  val: TabValue;
  pointerId: number;
  pointerType: string;
  startClientX: number;
  grabOffset: number;
  containerLeft: number;
  engaged: boolean;
}

interface UseDraggableTabsOptions {
  enabled: boolean;
  controller: TabsPhysicsController;
  containerRef: RefObject<HTMLDivElement | null>;
  isTouchDevice: boolean;
  prefersReducedMotion: boolean | null;
  onChange?: (value: TabValue) => void;
  triggerRippleAt: (
    x: number,
    y: number,
    width: number,
    height: number,
  ) => void;
}

export function useDraggableTabs({
  enabled,
  controller,
  containerRef,
  isTouchDevice,
  prefersReducedMotion,
  onChange,
  triggerRippleAt,
}: Readonly<UseDraggableTabsOptions>) {
  const isMotionReduced = Boolean(prefersReducedMotion);

  const pillCenterX = useMotionValue(0);
  const dragVelocityMv = useMotionValue(0);
  const smoothDragVelocity = useSpring(dragVelocityMv, SPRING.highlight);
  const pillOpacity = useMotionValue(0);
  const layoutVersionMv = useMotionValue(0);

  const [velocitySampler] = useState(() => createVelocitySampler());

  const tabElementsRef = useRef<Map<TabValue, HTMLButtonElement> | null>(null);

  const getTabElements = useCallback(() => {
    if (!tabElementsRef.current) {
      tabElementsRef.current = new Map<TabValue, HTMLButtonElement>();
    }
    return tabElementsRef.current;
  }, []);
  const pendingVelocityRef = useRef(0);
  const animControlsRef = useRef<ReturnType<typeof animate> | null>(null);
  const animGenRef = useRef(0);
  const isMeasuredRef = useRef(false);
  const hasActiveGrabRef = useRef(false);
  const suppressClickUntilRef = useRef(0);
  const suppressNextClickRef = useRef(false);
  const cleanupListenersRef = useRef<(() => void) | null>(null);

  const stopPillAnimation = useCallback(() => {
    animGenRef.current += 1;
    if (animControlsRef.current) {
      animControlsRef.current.stop();
      animControlsRef.current = null;
    }
    pillCenterX.stop();
    controller.setPillAnimating(false);
  }, [controller, pillCenterX]);

  const animatePillTo = useCallback(
    (targetX: number, velocity = 0) => {
      stopPillAnimation();
      if (isMotionReduced) {
        pillCenterX.jump(targetX);
        return;
      }
      const currentX = pillCenterX.get();
      if (Math.abs(targetX - currentX) < 0.25 && Math.abs(velocity) < 10) {
        pillCenterX.jump(targetX);
        return;
      }
      const gen = ++animGenRef.current;
      controller.setPillAnimating(true);
      const controls = animate(pillCenterX, targetX, {
        ...SPRING.highlight,
        velocity,
      });
      animControlsRef.current = controls;
      const finish = () => {
        if (animGenRef.current === gen) {
          animControlsRef.current = null;
          controller.setPillAnimating(false);
        }
      };
      controls.then(finish, finish);
    },
    [controller, isMotionReduced, pillCenterX, stopPillAnimation],
  );

  const measureTabs = useCallback(() => {
    if (!enabled) return;
    const containerEl = containerRef.current;
    if (!containerEl) return;

    const containerRect = containerEl.getBoundingClientRect();
    if (containerRect.width <= 0 || containerRect.height <= 0) return;

    const nextTabs: TabGeometry[] = [];
    for (const [val, el] of getTabElements().entries()) {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      const left = rect.left - containerRect.left;
      const top = rect.top - containerRect.top;
      nextTabs.push({
        value: val,
        left,
        top,
        width: rect.width,
        height: rect.height,
        centerX: left + rect.width / 2,
      });
    }
    nextTabs.sort((a, b) => a.centerX - b.centerX);
    controller.setTabGeometries(nextTabs);
    layoutVersionMv.set(layoutVersionMv.get() + 1);

    if (nextTabs.length === 0) return;

    const targetVal = controller.getPillTargetValue();
    const targetRect =
      nextTabs.find((t) => t.value === targetVal) ?? nextTabs[0];

    if (!isMeasuredRef.current) {
      isMeasuredRef.current = true;
      pillCenterX.jump(targetRect.centerX);
      pillOpacity.jump(1);
      return;
    }

    const storeState = controller.store.getState();
    if (!storeState.isDragging && !hasActiveGrabRef.current) {
      if (storeState.isPillAnimating) {
        animatePillTo(targetRect.centerX);
      } else {
        pillCenterX.jump(targetRect.centerX);
      }
    }
  }, [
    animatePillTo,
    containerRef,
    controller,
    enabled,
    getTabElements,
    layoutVersionMv,
    pillCenterX,
    pillOpacity,
  ]);

  const registerTabElement = useCallback(
    (val: TabValue, el: HTMLButtonElement | null) => {
      const tabElements = getTabElements();
      if (el) {
        tabElements.set(val, el);
      } else {
        tabElements.delete(val);
      }
    },
    [getTabElements],
  );

  const pillTargetValue = useStore(
    controller.store,
    useCallback(
      (state) => {
        if (state.isDragging && state.dragPreviewValue !== null) {
          return state.dragPreviewValue;
        }
        if (!isTouchDevice && state.hoveredValue !== null) {
          return state.hoveredValue;
        }
        return state.activeValue;
      },
      [isTouchDevice],
    ),
  );

  const isDragging = useStore(controller.store, (state) => state.isDragging);

  useLayoutEffect(() => {
    if (!enabled) {
      cleanupListenersRef.current?.();
      cleanupListenersRef.current = null;
      hasActiveGrabRef.current = false;
      stopPillAnimation();
      controller.cancelDrag();
      isMeasuredRef.current = false;
      pillOpacity.jump(0);
      return;
    }
    measureTabs();
  }, [enabled, controller, measureTabs, pillOpacity, stopPillAnimation]);

  useLayoutEffect(() => {
    if (
      !enabled ||
      isDragging ||
      !isMeasuredRef.current ||
      hasActiveGrabRef.current
    ) {
      return;
    }
    const tabs = controller.getTabGeometries();
    const targetRect = tabs.find((t) => t.value === pillTargetValue);
    if (!targetRect) return;
    const handoffVelocity = pendingVelocityRef.current;
    pendingVelocityRef.current = 0;
    animatePillTo(targetRect.centerX, handoffVelocity);
  }, [
    enabled,
    isDragging,
    pillTargetValue,
    isMotionReduced,
    animatePillTo,
    controller,
  ]);

  useLayoutEffect(() => {
    return () => {
      cleanupListenersRef.current?.();
      cleanupListenersRef.current = null;
      hasActiveGrabRef.current = false;
      stopPillAnimation();
      controller.cancelDrag();
      isMeasuredRef.current = false;
      pillOpacity.jump(0);
    };
  }, [controller, pillOpacity, stopPillAnimation]);

  const consumeDragClickSuppression = useCallback(() => {
    if (!suppressNextClickRef.current) return false;
    suppressNextClickRef.current = false;
    return performance.now() <= suppressClickUntilRef.current;
  }, []);

  const handleTabPointerDown = useCallback(
    (val: TabValue, e: ReactPointerEvent<HTMLButtonElement>): boolean => {
      if (!enabled) return false;
      if (e.button !== 0 || e.isPrimary === false) return false;

      const containerEl = containerRef.current;
      const tabs = controller.getTabGeometries();
      if (!containerEl || tabs.length === 0) return false;

      const containerRect = containerEl.getBoundingClientRect();
      const liveCenter = pillCenterX.get();
      const liveWidth = interpolateTabField(liveCenter, tabs, "width", 120);
      const liveHeight = interpolateTabField(
        liveCenter,
        tabs,
        "height",
        BASE_PILL_HEIGHT,
      );
      const liveTop = interpolateTabField(liveCenter, tabs, "top", 0);
      const localPointerX = e.clientX - containerRect.left;

      const storeState = controller.store.getState();
      const isPillMoving =
        storeState.isPillAnimating ||
        storeState.activePhase === "flight" ||
        storeState.isDragging;
      const isLiveHit =
        isPillMoving &&
        localPointerX >= liveCenter - liveWidth / 2 - LIVE_PILL_HIT_SLOP &&
        localPointerX <= liveCenter + liveWidth / 2 + LIVE_PILL_HIT_SLOP;

      const canGrab = controller.canGrabTab(val, isLiveHit, e.pointerType);

      suppressNextClickRef.current = false;

      if (canGrab) {
        const visualLeft = containerRect.left + liveCenter - liveWidth / 2;
        const rippleLocalX =
          ((e.clientX - visualLeft) / Math.max(liveWidth, 1)) * BASE_PILL_WIDTH;
        const rippleLocalY =
          ((e.clientY - (containerRect.top + liveTop)) /
            Math.max(liveHeight, 1)) *
          BASE_PILL_HEIGHT;
        triggerRippleAt(rippleLocalX, rippleLocalY, liveWidth, liveHeight);
      }

      controller.pressTab(val, e.pointerType);

      if (!canGrab) {
        return true;
      }

      stopPillAnimation();
      hasActiveGrabRef.current = true;
      velocitySampler.reset(e.clientX, performance.now());

      const session: DragSession = {
        val,
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        startClientX: e.clientX,
        grabOffset: localPointerX - liveCenter,
        containerLeft: containerRect.left,
        engaged: false,
      };

      const cleanupSession = () => {
        hasActiveGrabRef.current = false;
        window.removeEventListener("pointermove", onWindowPointerMove);
        window.removeEventListener("pointerup", onWindowPointerEnd);
        window.removeEventListener("pointercancel", onWindowPointerEnd);
        cleanupListenersRef.current = null;
        try {
          if (containerEl.hasPointerCapture(session.pointerId)) {
            containerEl.releasePointerCapture(session.pointerId);
          }
        } catch {
          // Ignore if browser already released implicit capture
        }
      };

      const onWindowPointerMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== session.pointerId) return;
        const currentTabs = controller.getTabGeometries();
        const dx = moveEvent.clientX - session.startClientX;

        if (!session.engaged) {
          if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
          session.engaged = true;
          try {
            containerEl.setPointerCapture(session.pointerId);
          } catch {
            // Ignore in synthetic environments without active pointerId
          }
          const initialCenter = clampCenterWithRubberBand(
            moveEvent.clientX - session.containerLeft - session.grabOffset,
            currentTabs,
          );
          const initialPreview =
            resolveNearestTab(initialCenter, currentTabs) ?? session.val;
          controller.startDrag(initialPreview);
        }

        const now = performance.now();
        velocitySampler.push(moveEvent.clientX, now);
        const rawCenter =
          moveEvent.clientX - session.containerLeft - session.grabOffset;
        const clampedCenter = clampCenterWithRubberBand(rawCenter, currentTabs);
        pillCenterX.set(clampedCenter);
        dragVelocityMv.set(isMotionReduced ? 0 : velocitySampler.sample(now));

        const nearest = resolveNearestTab(clampedCenter, currentTabs);
        if (nearest !== null) {
          controller.setDragPreview(nearest);
        }
      };

      const onWindowPointerEnd = (endEvent: PointerEvent) => {
        if (endEvent.pointerId !== session.pointerId) return;
        cleanupSession();
        const currentTabs = controller.getTabGeometries();

        if (!session.engaged) {
          controller.releaseTab(session.val, session.pointerType);
          const rect = containerEl.getBoundingClientRect();
          const outside =
            endEvent.clientX < rect.left ||
            endEvent.clientX > rect.right ||
            endEvent.clientY < rect.top ||
            endEvent.clientY > rect.bottom;
          if (outside) {
            controller.leaveTabs();
          }
          const targetRect = currentTabs.find(
            (t) => t.value === controller.getPillTargetValue(),
          );
          if (
            targetRect &&
            Math.abs(pillCenterX.get() - targetRect.centerX) >= 0.5
          ) {
            animatePillTo(targetRect.centerX, 0);
          }
          return;
        }

        dragVelocityMv.set(0);

        if (endEvent.type === "pointercancel") {
          controller.cancelDrag();
          return;
        }

        suppressNextClickRef.current = true;
        suppressClickUntilRef.current = performance.now() + CLICK_SUPPRESS_MS;

        const now = performance.now();
        const releaseVelocity = isMotionReduced
          ? 0
          : velocitySampler.sample(now);
        const liveX = pillCenterX.get();
        const projectedX = isMotionReduced
          ? liveX
          : liveX + projectMomentum(releaseVelocity, APPLE_DECELERATION_RATE);
        const targetTab =
          resolveNearestTab(projectedX, currentTabs) ??
          controller.store.getState().activeValue;
        const targetRect = currentTabs.find((t) => t.value === targetTab);
        const remainingPx = targetRect
          ? Math.abs(targetRect.centerX - liveX)
          : 0;
        const explicitDistance =
          isMotionReduced || Math.abs(releaseVelocity) >= 80 || remainingPx < 8
            ? 0
            : 1;

        pendingVelocityRef.current = releaseVelocity;
        controller.commitDrag(targetTab, explicitDistance);
        const rect = containerEl.getBoundingClientRect();
        const outside =
          endEvent.clientX < rect.left ||
          endEvent.clientX > rect.right ||
          endEvent.clientY < rect.top ||
          endEvent.clientY > rect.bottom;
        if (outside) {
          controller.leaveTabs();
        }
        onChange?.(targetTab);
      };

      cleanupListenersRef.current?.();
      cleanupListenersRef.current = cleanupSession;
      window.addEventListener("pointermove", onWindowPointerMove, {
        passive: true,
      });
      window.addEventListener("pointerup", onWindowPointerEnd);
      window.addEventListener("pointercancel", onWindowPointerEnd);
      return true;
    },
    [
      animatePillTo,
      containerRef,
      controller,
      dragVelocityMv,
      enabled,
      isMotionReduced,
      onChange,
      pillCenterX,
      stopPillAnimation,
      triggerRippleAt,
      velocitySampler,
    ],
  );

  const getTabDimensionsForValue = useCallback(
    (val: TabValue) => {
      const match = controller.getTabGeometries().find((t) => t.value === val);
      return match
        ? { width: match.width, height: match.height }
        : { width: 120, height: BASE_PILL_HEIGHT };
    },
    [controller],
  );

  const isGrabActive = useCallback(() => hasActiveGrabRef.current, []);

  return {
    pillCenterX,
    smoothDragVelocity,
    pillOpacity,
    layoutVersionMv,
    pillTargetValue,
    isGrabActive,
    measureTabs,
    registerTabElement,
    handleTabPointerDown,
    consumeDragClickSuppression,
    getTabDimensionsForValue,
  };
}
