import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { useStore } from "zustand";
import {
  animate,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "motion/react";
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
  clampPillCenterForEdgePull,
  computeBoundarySquish,
  createVelocitySampler,
  interpolateTabField,
  projectMomentum,
  resolveNearestTab,
  resolveReleaseRecoilVelocity,
} from "./tabDragPhysics";

const LIVE_PILL_HIT_SLOP = 8;
const CLICK_SUPPRESS_MS = 120;

function computeOverdragDistance(
  rawCenter: number,
  tabs: readonly TabGeometry[],
): number {
  if (tabs.length === 0) return 0;
  const first = tabs[0];
  const last = tabs[tabs.length - 1];
  if (rawCenter < first.centerX) {
    return rawCenter - first.centerX;
  }
  if (rawCenter > last.centerX) {
    return rawCenter - last.centerX;
  }
  return 0;
}

function isPointerOutsideElement(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): boolean {
  return (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  );
}

interface RecoilHandoff {
  velocity: number;
  spring: typeof SPRING.highlight | typeof SPRING.pillWallRecoil;
}

function resolveReleaseRecoilHandoff(
  overdragPx: number,
  releaseVelocity: number,
  isMotionReduced: boolean,
): RecoilHandoff {
  if (isMotionReduced) {
    return { velocity: 0, spring: SPRING.highlight };
  }
  if (Math.abs(overdragPx) > 0.5) {
    return {
      velocity: resolveReleaseRecoilVelocity(overdragPx, releaseVelocity),
      spring: SPRING.pillWallRecoil,
    };
  }
  return {
    velocity: releaseVelocity,
    spring: SPRING.highlight,
  };
}

function resolveWallPinSide(
  rawCenter: number,
  tabs: readonly TabGeometry[],
): number {
  const first = tabs[0];
  if (first && rawCenter < first.centerX) return -1;
  const last = tabs[tabs.length - 1];
  if (last && rawCenter > last.centerX) return 1;
  return 0;
}

function computeDragStepPillState(
  rawCenter: number,
  currentTabs: readonly TabGeometry[],
  isMotionReduced: boolean,
): {
  center: number;
  scaleX: number;
  scaleY: number;
  wallPinSide: number;
  capsuleOffset: number;
} {
  if (isMotionReduced) {
    return {
      center: clampPillCenterForEdgePull(rawCenter, currentTabs),
      scaleX: 1,
      scaleY: 1,
      wallPinSide: 0,
      capsuleOffset: 0,
    };
  }
  const squish = computeBoundarySquish(rawCenter, BASE_PILL_WIDTH, currentTabs);
  const scaleY =
    squish.squishScaleX < 1
      ? 1 + (1 - squish.squishScaleX) * 0.35
      : squish.squishScaleY;
  return {
    center: squish.centerX,
    scaleX: squish.squishScaleX,
    scaleY,
    wallPinSide: resolveWallPinSide(rawCenter, currentTabs),
    capsuleOffset: 0,
  };
}

function handleNonEngagedRelease(
  session: DragSession,
  endEvent: PointerEvent,
  containerEl: HTMLDivElement,
  controller: TabsPhysicsController,
  currentTabs: readonly TabGeometry[],
  pillCenterX: MotionValue<number>,
  animateCapsuleToZero: () => void,
  animatePillTo: (x: number, v?: number) => void,
) {
  animateCapsuleToZero();
  controller.releaseTab(session.val, session.pointerType);
  if (
    isPointerOutsideElement(
      endEvent.clientX,
      endEvent.clientY,
      containerEl.getBoundingClientRect(),
    )
  ) {
    controller.leaveTabs();
  }
  const targetRect = currentTabs.find(
    (t) => t.value === controller.getPillTargetValue(),
  );
  if (targetRect && Math.abs(pillCenterX.get() - targetRect.centerX) >= 0.5) {
    animatePillTo(targetRect.centerX, 0);
  }
}

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
  capsuleOffsetX?: MotionValue<number>;
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
  capsuleOffsetX,
  isTouchDevice,
  prefersReducedMotion,
  onChange,
  triggerRippleAt,
}: Readonly<UseDraggableTabsOptions>) {
  const isMotionReduced = Boolean(prefersReducedMotion);

  const pillCenterX = useMotionValue(0);
  const targetPillWidth = useMotionValue(BASE_PILL_WIDTH);
  const smoothPillWidth = useSpring(targetPillWidth, SPRING.dragWidth);
  const targetSquishX = useMotionValue(1);
  const targetSquishY = useMotionValue(1);
  const squishScaleX = useSpring(targetSquishX, SPRING.glassHoverX);
  const squishScaleY = useSpring(targetSquishY, SPRING.glassHoverY);
  const wallPinSide = useMotionValue(0);
  const fallbackCapsuleOffsetX = useMotionValue(0);
  const resolvedCapsuleOffsetX = capsuleOffsetX ?? fallbackCapsuleOffsetX;
  const isDraggingMv = useMotionValue(0);
  const rawPillVelocity = useVelocity(pillCenterX);
  const activeDragVelocity = useTransform(() =>
    isMotionReduced ? 0 : isDraggingMv.get() * rawPillVelocity.get(),
  );
  const smoothDragVelocity = useSpring(
    activeDragVelocity,
    SPRING.fluidDragStretch,
  );
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
  const pendingSpringRef = useRef<
    typeof SPRING.highlight | typeof SPRING.pillWallRecoil | null
  >(null);
  const animControlsRef = useRef<ReturnType<typeof animate> | null>(null);
  const animGenRef = useRef(0);
  const capsuleAnimControlsRef = useRef<ReturnType<typeof animate> | null>(
    null,
  );
  const capsuleAnimGenRef = useRef(0);
  const isMeasuredRef = useRef(false);
  const hasActiveGrabRef = useRef(false);
  const suppressClickUntilRef = useRef(0);
  const suppressNextClickRef = useRef(false);
  const cleanupListenersRef = useRef<(() => void) | null>(null);

  const resetSquishImmediate = useCallback(() => {
    targetSquishX.jump(1);
    targetSquishY.jump(1);
    squishScaleX.jump(1);
    squishScaleY.jump(1);
    wallPinSide.jump(0);
  }, [squishScaleX, squishScaleY, targetSquishX, targetSquishY, wallPinSide]);

  const animateSquishToRest = useCallback(
    (isReduced: boolean) => {
      if (isReduced) {
        resetSquishImmediate();
        return;
      }
      targetSquishX.set(1);
      targetSquishY.set(1);
    },
    [resetSquishImmediate, targetSquishX, targetSquishY],
  );

  const stopCapsuleReturn = useCallback(() => {
    capsuleAnimGenRef.current += 1;
    if (capsuleAnimControlsRef.current) {
      capsuleAnimControlsRef.current.stop();
      capsuleAnimControlsRef.current = null;
    }
    resolvedCapsuleOffsetX.stop();
  }, [resolvedCapsuleOffsetX]);

  const animateCapsuleToZero = useCallback(() => {
    stopCapsuleReturn();
    if (isMotionReduced || Math.abs(resolvedCapsuleOffsetX.get()) < 0.25) {
      resolvedCapsuleOffsetX.jump(0);
      return;
    }
    const gen = ++capsuleAnimGenRef.current;
    const controls = animate(resolvedCapsuleOffsetX, 0, SPRING.highlight);
    capsuleAnimControlsRef.current = controls;
    const finish = () => {
      if (capsuleAnimGenRef.current === gen) {
        capsuleAnimControlsRef.current = null;
      }
    };
    controls.then(finish, finish);
  }, [isMotionReduced, resolvedCapsuleOffsetX, stopCapsuleReturn]);

  const syncPillWidth = useCallback(
    (width: number, immediate: boolean) => {
      if (immediate || isMotionReduced) {
        targetPillWidth.jump(width);
        smoothPillWidth.jump(width);
      } else {
        targetPillWidth.set(width);
      }
    },
    [isMotionReduced, smoothPillWidth, targetPillWidth],
  );

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
    (
      targetX: number,
      velocity = 0,
      customSpring?: typeof SPRING.highlight | typeof SPRING.pillWallRecoil,
    ) => {
      stopPillAnimation();
      if (isMotionReduced) {
        pillCenterX.jump(targetX);
        resetSquishImmediate();
        return;
      }
      const currentX = pillCenterX.get();
      const hasSquish =
        Math.abs(squishScaleX.get() - 1) > 0.005 ||
        Math.abs(squishScaleY.get() - 1) > 0.005;
      if (
        !hasSquish &&
        Math.abs(targetX - currentX) < 0.25 &&
        Math.abs(velocity) < 10
      ) {
        pillCenterX.jump(targetX);
        resetSquishImmediate();
        return;
      }
      const gen = ++animGenRef.current;
      const targetTab = controller
        .getTabGeometries()
        .find((t) => Math.abs(t.centerX - targetX) < 1);
      const settleThresholdPx = Math.max(2, (targetTab?.width ?? 100) * 0.03);
      let settledEarly = Math.abs(targetX - currentX) <= settleThresholdPx;

      controller.setPillAnimating(!settledEarly);

      const springConfig = customSpring ?? SPRING.highlight;
      const controls = animate(pillCenterX, targetX, {
        ...springConfig,
        velocity,
        onUpdate: (latest) => {
          if (
            !settledEarly &&
            animGenRef.current === gen &&
            Math.abs(latest - targetX) <= settleThresholdPx
          ) {
            settledEarly = true;
            controller.setPillAnimating(false);
          }
        },
      });
      animControlsRef.current = controls;

      if (hasSquish) {
        animateSquishToRest(isMotionReduced);
      }

      const finish = () => {
        if (animGenRef.current === gen) {
          animControlsRef.current = null;
          controller.setPillAnimating(false);
        }
      };
      controls.then(finish, finish);
    },
    [
      animateSquishToRest,
      controller,
      isMotionReduced,
      pillCenterX,
      resetSquishImmediate,
      squishScaleX,
      squishScaleY,
      stopPillAnimation,
    ],
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
      syncPillWidth(targetRect.width, true);
      pillOpacity.jump(1);
      return;
    }

    const storeState = controller.store.getState();
    if (!storeState.isDragging && !hasActiveGrabRef.current) {
      if (storeState.isPillAnimating || animControlsRef.current !== null) {
        animatePillTo(targetRect.centerX);
        syncPillWidth(targetRect.width, false);
      } else {
        pillCenterX.jump(targetRect.centerX);
        syncPillWidth(targetRect.width, true);
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
    syncPillWidth,
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
      isDraggingMv.jump(0);
      stopPillAnimation();
      stopCapsuleReturn();
      resolvedCapsuleOffsetX.jump(0);
      resetSquishImmediate();
      controller.cancelDrag();
      isMeasuredRef.current = false;
      pillOpacity.jump(0);
      return;
    }
    measureTabs();
  }, [
    enabled,
    controller,
    isDraggingMv,
    measureTabs,
    pillOpacity,
    resetSquishImmediate,
    resolvedCapsuleOffsetX,
    stopCapsuleReturn,
    stopPillAnimation,
  ]);

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
    const handoffSpring = pendingSpringRef.current ?? SPRING.highlight;
    pendingSpringRef.current = null;
    animatePillTo(targetRect.centerX, handoffVelocity, handoffSpring);
    syncPillWidth(targetRect.width, isMotionReduced);
  }, [
    enabled,
    isDragging,
    pillTargetValue,
    isMotionReduced,
    animatePillTo,
    controller,
    syncPillWidth,
  ]);

  useLayoutEffect(() => {
    return () => {
      cleanupListenersRef.current?.();
      cleanupListenersRef.current = null;
      hasActiveGrabRef.current = false;
      isDraggingMv.jump(0);
      stopPillAnimation();
      stopCapsuleReturn();
      resolvedCapsuleOffsetX.jump(0);
      resetSquishImmediate();
      controller.cancelDrag();
      isMeasuredRef.current = false;
      pillOpacity.jump(0);
    };
  }, [
    controller,
    isDraggingMv,
    pillOpacity,
    resetSquishImmediate,
    resolvedCapsuleOffsetX,
    stopCapsuleReturn,
    stopPillAnimation,
  ]);

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
      const liveWidth =
        smoothPillWidth.get() ||
        interpolateTabField(liveCenter, tabs, "width", 120);
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

      const currentCapsuleOffset = resolvedCapsuleOffsetX.get();
      stopPillAnimation();
      stopCapsuleReturn();
      hasActiveGrabRef.current = true;
      velocitySampler.reset(e.clientX, performance.now());

      const session: DragSession = {
        val,
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        startClientX: e.clientX,
        grabOffset: localPointerX - liveCenter,
        containerLeft: containerRect.left - currentCapsuleOffset,
        engaged: false,
      };

      const cleanupSession = () => {
        hasActiveGrabRef.current = false;
        isDraggingMv.set(0);
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
          isDraggingMv.set(1);
          try {
            containerEl.setPointerCapture(session.pointerId);
          } catch {
            // Ignore in synthetic environments without active pointerId
          }
          const rawInitialCenter =
            moveEvent.clientX - session.containerLeft - session.grabOffset;
          const initialCenter = isMotionReduced
            ? clampPillCenterForEdgePull(rawInitialCenter, currentTabs)
            : computeBoundarySquish(
                rawInitialCenter,
                BASE_PILL_WIDTH,
                currentTabs,
              ).centerX;
          const initialPreview =
            resolveNearestTab(initialCenter, currentTabs) ?? session.val;
          controller.startDrag(initialPreview);
        }

        const now = performance.now();
        velocitySampler.push(moveEvent.clientX, now);
        const rawCenter =
          moveEvent.clientX - session.containerLeft - session.grabOffset;

        const step = computeDragStepPillState(
          rawCenter,
          currentTabs,
          isMotionReduced,
        );
        pillCenterX.set(step.center);
        if (isMotionReduced) {
          resetSquishImmediate();
        } else {
          wallPinSide.set(step.wallPinSide);
          targetSquishX.set(step.scaleX);
          targetSquishY.set(step.scaleY);
        }
        resolvedCapsuleOffsetX.set(step.capsuleOffset);

        const nearest = resolveNearestTab(step.center, currentTabs);
        if (nearest !== null) {
          controller.setDragPreview(nearest);
          const nearestRect = currentTabs.find((t) => t.value === nearest);
          if (nearestRect) {
            syncPillWidth(nearestRect.width, isMotionReduced);
          }
        }
      };

      const onWindowPointerEnd = (endEvent: PointerEvent) => {
        if (endEvent.pointerId !== session.pointerId) return;
        cleanupSession();
        const currentTabs = controller.getTabGeometries();

        if (!session.engaged) {
          handleNonEngagedRelease(
            session,
            endEvent,
            containerEl,
            controller,
            currentTabs,
            pillCenterX,
            animateCapsuleToZero,
            animatePillTo,
          );
          return;
        }

        isDraggingMv.set(0);
        wallPinSide.set(0);
        animateCapsuleToZero();

        if (endEvent.type === "pointercancel") {
          controller.cancelDrag();
          animateSquishToRest(isMotionReduced);
          return;
        }

        suppressNextClickRef.current = true;
        suppressClickUntilRef.current = performance.now() + CLICK_SUPPRESS_MS;

        const rawCenter =
          endEvent.clientX - session.containerLeft - session.grabOffset;
        const overdragPx = computeOverdragDistance(rawCenter, currentTabs);
        const releaseVelocity = isMotionReduced
          ? 0
          : velocitySampler.sample(performance.now());
        const handoff = resolveReleaseRecoilHandoff(
          overdragPx,
          releaseVelocity,
          isMotionReduced,
        );

        pendingVelocityRef.current = handoff.velocity;
        pendingSpringRef.current = handoff.spring;
        animateSquishToRest(isMotionReduced);

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

        controller.commitDrag(targetTab, explicitDistance);
        if (
          isPointerOutsideElement(
            endEvent.clientX,
            endEvent.clientY,
            containerEl.getBoundingClientRect(),
          )
        ) {
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
      animateCapsuleToZero,
      animatePillTo,
      animateSquishToRest,
      containerRef,
      controller,
      enabled,
      isDraggingMv,
      isMotionReduced,
      onChange,
      pillCenterX,
      resetSquishImmediate,
      resolvedCapsuleOffsetX,
      smoothPillWidth,
      stopCapsuleReturn,
      stopPillAnimation,
      syncPillWidth,
      targetSquishX,
      targetSquishY,
      triggerRippleAt,
      velocitySampler,
      wallPinSide,
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
    smoothPillWidth,
    squishScaleX,
    squishScaleY,
    wallPinSide,
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
