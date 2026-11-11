import { createStore, type StoreApi } from "zustand/vanilla";
import { clamp, type Transition } from "motion/react";
import { SPRING } from "../../../utils/springConfig";
import { hoverDelta, scaleDeltas } from "./config";
import type { TabOrientation } from "./types";

export type TabValue = string | number;
type TabFlightPhase = "idle" | "flight" | "landing";

export const TRAVEL_IMPULSE_MS = 140;
export const FLIGHT_SETTLE_MS = 150;
export const LANDING_PULSE_MS = 300;
export const REF_VELOCITY = 1800;

export interface TabGeometry {
  value: TabValue;
  left: number;
  top: number;
  width: number;
  height: number;
  centerX: number;
}

/** Critically damped spring for gentle, non-bouncy settle to idle (zero undershoot) */
export const SETTLE_SPRING = {
  type: "spring" as const,
  stiffness: 160,
  damping: 26,
  mass: 0.8,
} as const;

interface BaseScales {
  scaleX: number;
  scaleY: number;
}

export function computeDragVelocityScaleX(
  velocity: number,
  tabCount: number,
  baseScaleX: number,
  prefersReducedMotion = false,
  refVelocity = REF_VELOCITY,
): number {
  if (prefersReducedMotion || Math.abs(velocity) < 5) return baseScaleX;
  const isBinary = tabCount > 0 && tabCount <= 2;
  const countMult = tabCount > 0 ? clamp(0.4, 1.0, (tabCount - 1) / 3) : 1.0;
  const ratio = Math.min(1.0, Math.abs(velocity) / refVelocity);
  const maxX = isBinary ? 0.035 : 0.12;
  return baseScaleX * (1 + maxX * ratio * countMult);
}

function computeHorizontalVelocityScaleY(
  velocity: number,
  tabCount: number,
  baseScaleY: number,
  prefersReducedMotion = false,
  refVelocity = REF_VELOCITY,
): number {
  if (prefersReducedMotion || Math.abs(velocity) < 5) return baseScaleY;
  const isBinary = tabCount > 0 && tabCount <= 2;
  const countMult = tabCount > 0 ? clamp(0.4, 1.0, (tabCount - 1) / 3) : 1.0;
  const ratio = Math.min(1.0, Math.abs(velocity) / refVelocity);
  const maxYCompress = isBinary ? 0.0 : 0.018;
  const travelCompressY = 1 - maxYCompress * ratio * countMult;
  return baseScaleY > 1.001
    ? 1 + (baseScaleY - 1) * 0.45 * travelCompressY
    : travelCompressY;
}

function computeVerticalVelocityScales(
  velocity: number,
  tabCount: number,
  baseScales: BaseScales,
  refVelocity: number,
): BaseScales {
  const isBinary = tabCount > 0 && tabCount <= 2;
  const countMult = tabCount > 0 ? clamp(0.4, 1.0, (tabCount - 1) / 3) : 1.0;
  const ratio = Math.min(1.0, Math.abs(velocity) / refVelocity);
  const maxY = isBinary ? 0.035 : 0.1;
  const maxXCompress = isBinary ? 0.0 : 0.018;
  const travelStretchY = 1 + maxY * ratio * countMult;
  const travelCompressX = 1 - maxXCompress * ratio * countMult;

  const scaleX =
    baseScales.scaleX > 1.001
      ? 1 + (baseScales.scaleX - 1) * 0.45 * travelCompressX
      : travelCompressX;
  return { scaleX, scaleY: baseScales.scaleY * travelStretchY };
}

export function computeVelocityScales(
  velocity: number,
  orientation: TabOrientation,
  tabCount: number,
  baseScales: BaseScales = { scaleX: 1, scaleY: 1 },
  refVelocity = REF_VELOCITY,
  prefersReducedMotion = false,
): BaseScales {
  if (prefersReducedMotion || Math.abs(velocity) < 5) {
    return baseScales;
  }
  if (orientation === "vertical") {
    return computeVerticalVelocityScales(
      velocity,
      tabCount,
      baseScales,
      refVelocity,
    );
  }
  return {
    scaleX: computeDragVelocityScaleX(
      velocity,
      tabCount,
      baseScales.scaleX,
      false,
      refVelocity,
    ),
    scaleY: computeHorizontalVelocityScaleY(
      velocity,
      tabCount,
      baseScales.scaleY,
      false,
      refVelocity,
    ),
  };
}

function computeTravelScales(
  tabDistance: number,
  tabCount: number,
  orientation: TabOrientation,
) {
  const isBinary = tabCount > 0 && tabCount <= 2;
  const countMultiplier =
    tabCount > 0 ? clamp(0.4, 1.0, (tabCount - 1) / 3) : 1.0;
  const delta = Math.max(1, tabDistance);

  if (orientation === "vertical") {
    const maxY = isBinary ? 0.035 : 0.1;
    const stretchY =
      1 + Math.min(maxY, (0.035 + delta * 0.02) * countMultiplier);
    const compressX = isBinary
      ? 1.0
      : 1 - Math.min(0.018, (0.006 + delta * 0.0035) * countMultiplier);
    return { targetScaleX: compressX, targetScaleY: stretchY };
  }

  const maxX = isBinary ? 0.035 : 0.12;
  const stretchX = 1 + Math.min(maxX, (0.04 + delta * 0.025) * countMultiplier);
  const compressY = isBinary
    ? 1.0
    : 1 - Math.min(0.018, (0.006 + delta * 0.0035) * countMultiplier);
  return { targetScaleX: stretchX, targetScaleY: compressY };
}

function computeHoverScales(
  isMobileNav: boolean,
  dimensions: { width: number; height: number },
) {
  const delta = isMobileNav ? hoverDelta.mobile : hoverDelta.desktop;
  return {
    targetScaleX: 1 + (2 * delta) / dimensions.width,
    targetScaleY: 1 + (2 * delta) / dimensions.height,
  };
}

function computeHoverTravelScales(
  hover: { targetScaleX: number; targetScaleY: number },
  travel: { targetScaleX: number; targetScaleY: number },
  orientation: TabOrientation,
) {
  if (orientation === "vertical") {
    return {
      targetScaleX: 1 + (hover.targetScaleX - 1) * 0.45 * travel.targetScaleX,
      targetScaleY: hover.targetScaleY * travel.targetScaleY,
    };
  }
  return {
    targetScaleX: hover.targetScaleX * travel.targetScaleX,
    targetScaleY: 1 + (hover.targetScaleY - 1) * 0.45 * travel.targetScaleY,
  };
}

function computePressScales(
  isMobileNav: boolean,
  dimensions: { width: number; height: number },
) {
  const tapDelta = isMobileNav
    ? scaleDeltas.tap.mobile
    : scaleDeltas.tap.desktop;
  return {
    targetScaleX: 1 + (2 * tapDelta) / dimensions.width,
    targetScaleY: 1 + (2 * tapDelta) / dimensions.height,
  };
}

function computeFlightScales(
  orientation: TabOrientation,
  isMobileNav: boolean,
  dimensions: { width: number; height: number },
  tabDistance: number,
  tabCount: number,
  isHoverActive: boolean,
  velocity?: number,
  prefersReducedMotion = false,
) {
  if (velocity !== undefined && Math.abs(velocity) >= 5) {
    const baseScales: BaseScales = isHoverActive
      ? (() => {
          const h = computeHoverScales(isMobileNav, dimensions);
          return { scaleX: h.targetScaleX, scaleY: h.targetScaleY };
        })()
      : { scaleX: 1, scaleY: 1 };
    const scales = computeVelocityScales(
      velocity,
      orientation,
      tabCount,
      baseScales,
      REF_VELOCITY,
      prefersReducedMotion,
    );
    return { targetScaleX: scales.scaleX, targetScaleY: scales.scaleY };
  }

  const travel = computeTravelScales(tabDistance, tabCount, orientation);
  if (isHoverActive) {
    const hover = computeHoverScales(isMobileNav, dimensions);
    return computeHoverTravelScales(hover, travel, orientation);
  }
  return travel;
}

interface ScaleResolutionParams {
  isPressed: boolean;
  isHoverActive: boolean;
  isTraveling: boolean;
  orientation: TabOrientation;
  isMobileNav: boolean;
  dimensions: { width: number; height: number };
  tabDistance: number;
  prefersReducedMotion: boolean;
  tabCount: number;
  velocity?: number;
}

function resolveTargetScales({
  isPressed,
  isHoverActive,
  isTraveling,
  orientation,
  isMobileNav,
  dimensions,
  tabDistance,
  prefersReducedMotion,
  tabCount,
  velocity,
}: ScaleResolutionParams) {
  if (prefersReducedMotion) {
    return { targetScaleX: 1, targetScaleY: 1 };
  }

  if (isPressed) {
    return computePressScales(isMobileNav, dimensions);
  }

  const hasVelocity = velocity !== undefined && Math.abs(velocity) >= 5;
  if (isTraveling && (tabDistance > 0 || hasVelocity)) {
    return computeFlightScales(
      orientation,
      isMobileNav,
      dimensions,
      tabDistance,
      tabCount,
      isHoverActive,
      velocity,
      prefersReducedMotion,
    );
  }

  if (isHoverActive) {
    return computeHoverScales(isMobileNav, dimensions);
  }

  return { targetScaleX: 1, targetScaleY: 1 };
}

function shouldShowTabHighlight(
  isActive: boolean,
  isHovered: boolean,
  hoveredValue: TabValue | null,
  isTouchDevice: boolean,
): boolean {
  if (isTouchDevice) {
    return isActive;
  }
  return isHovered || (isActive && hoveredValue === null);
}

interface TabsControllerConfig {
  orientation?: TabOrientation;
  isMobileNav?: boolean;
  prefersReducedMotion?: boolean;
  isTouchDevice?: boolean;
}

interface TabsControllerOptions extends TabsControllerConfig {
  initialValue: TabValue;
}

export interface TabRenderSnapshot {
  isActive: boolean;
  isDragPreview: boolean;
  hasDragPreview: boolean;
  showHighlight: boolean;
  isNavbarActive: boolean;
  willChange: boolean;
  targetScaleX: number;
  targetScaleY: number;
  scaleSpring: Transition;
}

export interface TabsPhysicsState {
  activeValue: TabValue;
  activeDistance: number;
  activePhase: TabFlightPhase;
  hoveredValue: TabValue | null;
  hoverDistance: number;
  hoverMoving: boolean;
  hoverVelocity: number;
  pressedValue: TabValue | null;
  isDragging: boolean;
  dragPreviewValue: TabValue | null;
  isPillAnimating: boolean;
  tabCount: number;
}

export type ReadonlyTabsStore = Pick<
  StoreApi<TabsPhysicsState>,
  "getState" | "subscribe" | "getInitialState"
>;

export interface TabSnapshotSlice {
  mask: number;
  effectiveDistance: number;
  tabCount: number;
  hoverVelocity: number;
  isDragging: boolean;
  isPillAnimating: boolean;
}

export interface TabSnapshotConfig {
  orientation: TabOrientation;
  isMobileNav: boolean;
  prefersReducedMotion: boolean;
}

function evaluateTabFlags(
  state: TabsPhysicsState,
  val: TabValue,
  isTouchDevice: boolean,
) {
  const isActive = state.activeValue === val;
  const isTransitioning = isActive && state.activePhase === "flight";
  const isLanding = isActive && state.activePhase === "landing";
  const isHovered =
    !isTouchDevice && !state.isDragging && state.hoveredValue === val;
  const showHighlight =
    !state.isDragging &&
    shouldShowTabHighlight(
      isActive,
      isHovered,
      state.hoveredValue,
      isTouchDevice,
    );
  const isMovingHover = isHovered && state.hoverMoving;
  const isPressed =
    state.pressedValue === val ||
    (state.isDragging &&
      state.dragPreviewValue === val &&
      state.pressedValue !== null);
  const isDragPreview = state.isDragging && state.dragPreviewValue === val;
  const hasDragPreview = state.dragPreviewValue !== null;
  return {
    isActive,
    isTransitioning,
    isLanding,
    isHovered,
    showHighlight,
    isMovingHover,
    isPressed,
    isDragPreview,
    hasDragPreview,
  };
}

function computeTabStateMask(
  state: TabsPhysicsState,
  val: TabValue,
  isTouchDevice: boolean,
): number {
  const flags = evaluateTabFlags(state, val, isTouchDevice);
  return (
    (flags.isActive ? 1 : 0) |
    (flags.isTransitioning ? 2 : 0) |
    (flags.isLanding ? 4 : 0) |
    (flags.isHovered ? 8 : 0) |
    (flags.showHighlight ? 16 : 0) |
    (flags.isMovingHover ? 32 : 0) |
    (flags.isPressed ? 64 : 0) |
    (flags.isDragPreview ? 128 : 0) |
    (flags.hasDragPreview ? 256 : 0)
  );
}

/** Pure selector extracting the minimal per-tab snapshot slice from store state. */
export function selectTabSnapshotSlice(
  state: TabsPhysicsState,
  val: TabValue,
  isTouchDevice: boolean,
): TabSnapshotSlice {
  const mask = computeTabStateMask(state, val, isTouchDevice);
  const isTransitioning = (mask & 2) !== 0;
  const isMovingHover = (mask & 32) !== 0;

  let effectiveDistance = 0;
  if (isMovingHover) {
    effectiveDistance = state.hoverDistance;
  } else if (isTransitioning) {
    effectiveDistance = state.activeDistance;
  }

  return {
    mask,
    effectiveDistance,
    tabCount: effectiveDistance > 0 ? state.tabCount : 0,
    hoverVelocity: isMovingHover ? state.hoverVelocity : 0,
    isDragging: state.isDragging,
    isPillAnimating: state.isPillAnimating,
  };
}

/** Pure render-time tab snapshot computation with explicit reactive config inputs. */
export function computeTabSnapshotFromSlice(
  slice: TabSnapshotSlice,
  dimensions: { width: number; height: number },
  config: TabSnapshotConfig,
): TabRenderSnapshot {
  const isActive = (slice.mask & 1) !== 0;
  const isTransitioning = (slice.mask & 2) !== 0;
  const isLanding = (slice.mask & 4) !== 0;
  const isHovered = (slice.mask & 8) !== 0;
  const showHighlight = (slice.mask & 16) !== 0;
  const isMovingHover = (slice.mask & 32) !== 0;
  const isPressed = (slice.mask & 64) !== 0;
  const isDragPreview = (slice.mask & 128) !== 0;
  const hasDragPreview = (slice.mask & 256) !== 0;

  const isHoverActive =
    isHovered ||
    isTransitioning ||
    isLanding ||
    slice.isDragging ||
    slice.isPillAnimating;

  const isTraveling = slice.effectiveDistance > 0;
  const currentVelocity = isMovingHover ? slice.hoverVelocity : undefined;

  const { targetScaleX, targetScaleY } = resolveTargetScales({
    isPressed,
    isHoverActive,
    isTraveling,
    orientation: config.orientation,
    isMobileNav: config.isMobileNav,
    dimensions,
    tabDistance: slice.effectiveDistance,
    prefersReducedMotion: config.prefersReducedMotion,
    tabCount: isTraveling ? slice.tabCount : 0,
    velocity: currentVelocity,
  });

  const scaleSpring =
    isLanding || (targetScaleX === 1 && targetScaleY === 1)
      ? SETTLE_SPRING
      : SPRING.glassScale;

  return {
    isActive,
    isDragPreview,
    hasDragPreview,
    showHighlight,
    isNavbarActive: isHoverActive,
    willChange:
      isHoverActive || isPressed || slice.isDragging || slice.isPillAnimating,
    targetScaleX,
    targetScaleY,
    scaleSpring,
  };
}

export interface TabsPhysicsController {
  store: StoreApi<TabsPhysicsState>;
  registerTab: (val: TabValue) => () => void;
  configure: (config: TabsControllerConfig) => void;
  activate: () => void;
  destroy: () => void;

  getPillTargetValue: () => TabValue;

  setActiveValue: (val: TabValue) => void;
  hoverTab: (val: TabValue | null) => void;
  selectTab: (val: TabValue) => void;
  pressTab: (val: TabValue, pointerType?: string) => void;
  releaseTab: (val: TabValue, pointerType?: string) => void;
  cancelTabPress: () => void;
  leaveTab: (val: TabValue) => void;
  leaveTabs: () => void;
  recordPointerMove: (clientX: number, clientY: number, nowMs: number) => void;
  notifyLayoutComplete: () => void;

  canGrabTab: (
    val: TabValue,
    isLiveHit: boolean,
    pointerType?: string,
  ) => boolean;
  startDrag: (initialPreview: TabValue | null) => void;
  setDragPreview: (val: TabValue | null) => void;
  commitDrag: (val: TabValue, explicitDistance?: number) => void;
  cancelDrag: () => void;
  setPillAnimating: (animating: boolean) => void;
  setTabGeometries: (tabs: TabGeometry[]) => void;
  getTabGeometries: () => readonly TabGeometry[];

  getTabStateMaskFromState: (state: TabsPhysicsState, val: TabValue) => number;
  getTabSnapshot: (
    val: TabValue,
    dimensions: { width: number; height: number },
  ) => TabRenderSnapshot;
}

export function createTabsController({
  initialValue,
  orientation: initialOrientation = "horizontal",
  isMobileNav: initialIsMobileNav = false,
  prefersReducedMotion: initialReducedMotion = false,
  isTouchDevice: initialIsTouchDevice = false,
}: TabsControllerOptions): TabsPhysicsController {
  const store = createStore<TabsPhysicsState>(() => ({
    activeValue: initialValue,
    activeDistance: 0,
    activePhase: "idle",
    hoveredValue: null,
    hoverDistance: 0,
    hoverMoving: false,
    hoverVelocity: 0,
    pressedValue: null,
    isDragging: false,
    dragPreviewValue: null,
    isPillAnimating: false,
    tabCount: 0,
  }));

  let orientation: TabOrientation = initialOrientation;
  let isMobileNav = initialIsMobileNav;
  let prefersReducedMotion = initialReducedMotion;
  let isTouchDevice = initialIsTouchDevice;

  const tabOrder: TabValue[] = [];
  let tabGeometries: TabGeometry[] = [];
  let destroyed = false;
  let suppressHoverUntilMouseMove = false;

  let mouseVelocity = 0;
  let lastMousePos: { x: number; y: number; time: number } | null = null;

  let flightTimer: ReturnType<typeof setTimeout> | null = null;
  let landingTimer: ReturnType<typeof setTimeout> | null = null;
  let hoverTimer: ReturnType<typeof setTimeout> | null = null;

  const updateState = (
    updater:
      | Partial<TabsPhysicsState>
      | ((
          state: TabsPhysicsState,
        ) => TabsPhysicsState | Partial<TabsPhysicsState>),
  ) => {
    if (destroyed) return;
    store.setState(updater);
  };

  const clearActiveTimers = () => {
    if (flightTimer) {
      clearTimeout(flightTimer);
      flightTimer = null;
    }
    if (landingTimer) {
      clearTimeout(landingTimer);
      landingTimer = null;
    }
  };

  const clearHoverTimer = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
  };

  const getTabDistance = (
    from: TabValue | null,
    to: TabValue | null,
  ): number => {
    if (from === null || to === null || from === to) return 0;
    const fromIdx = tabOrder.indexOf(from);
    const toIdx = tabOrder.indexOf(to);
    return fromIdx !== -1 && toIdx !== -1 ? Math.abs(toIdx - fromIdx) : 1;
  };

  const completeFlight = () => {
    clearActiveTimers();
    updateState((state) =>
      state.activePhase === "idle"
        ? state
        : { activePhase: "idle", activeDistance: 0, tabCount: 0 },
    );
  };

  const beginLanding = () => {
    if (flightTimer) {
      clearTimeout(flightTimer);
      flightTimer = null;
    }
    if (destroyed || store.getState().activePhase !== "flight") return;
    updateState({ activePhase: "landing", activeDistance: 0, tabCount: 0 });
    if (landingTimer) {
      clearTimeout(landingTimer);
    }
    landingTimer = setTimeout(() => {
      landingTimer = null;
      completeFlight();
    }, LANDING_PULSE_MS);
  };

  const startHoverImpulse = () => {
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      hoverTimer = null;
      updateState((state) =>
        state.hoverMoving ? { hoverMoving: false, hoverVelocity: 0 } : state,
      );
    }, TRAVEL_IMPULSE_MS);
  };

  const computeHoverPatch = (
    state: TabsPhysicsState,
    val: TabValue | null,
    distance: number,
  ): Partial<TabsPhysicsState> | null => {
    if (val === null) {
      clearHoverTimer();
      if (
        state.hoveredValue === null &&
        state.hoverDistance === 0 &&
        !state.hoverMoving &&
        state.hoverVelocity === 0
      ) {
        return null;
      }
      return {
        hoveredValue: null,
        hoverDistance: 0,
        hoverMoving: false,
        hoverVelocity: 0,
      };
    }

    if (state.hoveredValue === val) {
      if (distance === 0 && state.hoverMoving) {
        clearHoverTimer();
        return { hoverDistance: 0, hoverMoving: false, hoverVelocity: 0 };
      }
      return null;
    }

    if (distance > 0) {
      startHoverImpulse();
      return {
        hoveredValue: val,
        hoverDistance: distance,
        hoverMoving: true,
        hoverVelocity: mouseVelocity,
        tabCount: tabOrder.length,
      };
    }

    clearHoverTimer();
    return {
      hoveredValue: val,
      hoverDistance: distance,
      hoverMoving: false,
      hoverVelocity: 0,
    };
  };

  return {
    store,

    registerTab: (val) => {
      if (!tabOrder.includes(val)) {
        tabOrder.push(val);
      }
      return () => {
        const idx = tabOrder.indexOf(val);
        if (idx !== -1) {
          tabOrder.splice(idx, 1);
        }
      };
    },

    configure: (next) => {
      if (next.orientation !== undefined) orientation = next.orientation;
      if (next.isMobileNav !== undefined) isMobileNav = next.isMobileNav;
      if (next.prefersReducedMotion !== undefined) {
        prefersReducedMotion = next.prefersReducedMotion;
      }
      if (next.isTouchDevice !== undefined) isTouchDevice = next.isTouchDevice;
    },

    activate: () => {
      if (!destroyed) return;
      destroyed = false;
      clearActiveTimers();
      clearHoverTimer();
      suppressHoverUntilMouseMove = false;
      mouseVelocity = 0;
      lastMousePos = null;
      updateState((state) => {
        if (
          state.activePhase === "idle" &&
          state.activeDistance === 0 &&
          state.hoveredValue === null &&
          state.hoverDistance === 0 &&
          !state.hoverMoving &&
          state.hoverVelocity === 0 &&
          state.pressedValue === null &&
          !state.isDragging &&
          state.dragPreviewValue === null &&
          !state.isPillAnimating &&
          state.tabCount === 0
        ) {
          return state;
        }
        return {
          activePhase: "idle",
          activeDistance: 0,
          hoveredValue: null,
          hoverDistance: 0,
          hoverMoving: false,
          hoverVelocity: 0,
          pressedValue: null,
          isDragging: false,
          dragPreviewValue: null,
          isPillAnimating: false,
          tabCount: 0,
        };
      });
    },

    destroy: () => {
      destroyed = true;
      clearActiveTimers();
      clearHoverTimer();
      suppressHoverUntilMouseMove = false;
      mouseVelocity = 0;
      lastMousePos = null;
    },

    getPillTargetValue: () => {
      const state = store.getState();
      if (state.isDragging && state.dragPreviewValue !== null) {
        return state.dragPreviewValue;
      }
      if (!isTouchDevice && state.hoveredValue !== null) {
        return state.hoveredValue;
      }
      return state.activeValue;
    },

    setActiveValue: (val) => {
      if (destroyed) return;
      const state = store.getState();
      if (state.activeValue === val) return;

      clearActiveTimers();
      const hoverPatch = computeHoverPatch(state, null, 0);
      const distance = getTabDistance(state.activeValue, val);

      if (distance > 0) {
        flightTimer = setTimeout(() => {
          flightTimer = null;
          beginLanding();
        }, FLIGHT_SETTLE_MS);
      }

      updateState({
        ...hoverPatch,
        activeValue: val,
        activeDistance: distance > 0 ? distance : 0,
        activePhase: distance > 0 ? "flight" : "idle",
        tabCount: distance > 0 ? tabOrder.length : 0,
      });
    },

    hoverTab: (val) => {
      if (destroyed) return;
      if (store.getState().isDragging) return;
      if (val === null) {
        updateState((state) => computeHoverPatch(state, null, 0) ?? state);
        return;
      }
      if (suppressHoverUntilMouseMove) return;
      if (isTouchDevice) return;
      updateState((state) => {
        if (state.hoveredValue === val) return state;
        const currentAnchor = state.hoveredValue ?? state.activeValue;
        const distance = getTabDistance(currentAnchor, val);
        return computeHoverPatch(state, val, distance) ?? state;
      });
    },

    selectTab: (val) => {
      if (destroyed) return;
      updateState((state) =>
        state.hoveredValue === val
          ? (computeHoverPatch(state, val, 0) ?? state)
          : state,
      );
    },

    pressTab: (val, pointerType) => {
      if (destroyed) return;
      const isTouch = isTouchDevice || pointerType === "touch";
      updateState((state) => {
        const hoverPatch = !isTouch ? computeHoverPatch(state, val, 0) : null;
        if (state.pressedValue === val) {
          return hoverPatch ?? state;
        }
        return { ...hoverPatch, pressedValue: val };
      });
    },

    releaseTab: (val, pointerType) => {
      if (destroyed) return;
      const isTouch = isTouchDevice || pointerType === "touch";
      updateState((state) => {
        const wasPressed = state.pressedValue === val;
        const hoverPatch =
          isTouch && state.hoveredValue !== null
            ? computeHoverPatch(state, null, 0)
            : null;
        if (!wasPressed && !hoverPatch) return state;
        return {
          ...hoverPatch,
          ...(wasPressed ? { pressedValue: null } : {}),
        };
      });
    },

    cancelTabPress: () => {
      if (destroyed) return;
      updateState((state) => {
        if (state.isDragging) return state;
        const hadState =
          state.pressedValue !== null ||
          state.hoveredValue !== null ||
          state.hoverMoving;
        if (!hadState) return state;
        const hoverPatch = computeHoverPatch(state, null, 0);
        return {
          ...hoverPatch,
          pressedValue: null,
        };
      });
    },

    leaveTab: (val) => {
      if (destroyed) return;
      updateState((state) =>
        !state.isDragging && state.pressedValue === val
          ? { pressedValue: null }
          : state,
      );
    },

    leaveTabs: () => {
      if (destroyed) return;
      if (store.getState().isDragging) return;
      suppressHoverUntilMouseMove = false;
      mouseVelocity = 0;
      lastMousePos = null;
      updateState((state) =>
        state.hoveredValue !== null
          ? (computeHoverPatch(state, null, 0) ?? state)
          : state,
      );
    },

    recordPointerMove: (clientX, clientY, nowMs) => {
      if (destroyed) return;
      suppressHoverUntilMouseMove = false;
      if (lastMousePos) {
        const dt = nowMs - lastMousePos.time;
        if (dt > 8 && dt < 200) {
          const dx = clientX - lastMousePos.x;
          const dy = clientY - lastMousePos.y;
          const instantVelocity = (Math.hypot(dx, dy) / dt) * 1000;
          mouseVelocity = 0.7 * instantVelocity + 0.3 * mouseVelocity;
        }
      }
      lastMousePos = { x: clientX, y: clientY, time: nowMs };
    },

    notifyLayoutComplete: () => {
      if (destroyed) return;
      if (store.getState().activePhase === "flight") {
        beginLanding();
      }
    },

    canGrabTab: (val, isLiveHit, pointerType) => {
      if (destroyed) return false;
      if (isLiveHit) return true;
      const state = store.getState();
      const isTouch = isTouchDevice || pointerType === "touch";
      return shouldShowTabHighlight(
        state.activeValue === val,
        !isTouch && state.hoveredValue === val,
        state.hoveredValue,
        isTouch,
      );
    },

    startDrag: (initialPreview) => {
      if (destroyed) return;
      clearActiveTimers();
      clearHoverTimer();
      updateState({
        isDragging: true,
        dragPreviewValue: initialPreview,
        hoveredValue: null,
        hoverDistance: 0,
        hoverMoving: false,
        hoverVelocity: 0,
        activePhase: "idle",
        activeDistance: 0,
        tabCount: 0,
      });
    },

    setDragPreview: (val) => {
      if (destroyed) return;
      updateState((state) => {
        if (!state.isDragging || state.dragPreviewValue === val) return state;
        return { dragPreviewValue: val };
      });
    },

    commitDrag: (val, explicitDistance) => {
      if (destroyed) return;
      clearActiveTimers();
      clearHoverTimer();
      suppressHoverUntilMouseMove = true;
      const state = store.getState();
      const distance =
        explicitDistance ?? getTabDistance(state.activeValue, val);

      if (distance > 0) {
        flightTimer = setTimeout(() => {
          flightTimer = null;
          beginLanding();
        }, FLIGHT_SETTLE_MS);
      }

      updateState({
        isDragging: false,
        dragPreviewValue: null,
        pressedValue: null,
        hoveredValue: null,
        hoverDistance: 0,
        hoverMoving: false,
        hoverVelocity: 0,
        activeValue: val,
        activeDistance: distance > 0 ? distance : 0,
        activePhase: distance > 0 ? "flight" : "idle",
        tabCount: distance > 0 ? tabOrder.length : 0,
      });
    },

    cancelDrag: () => {
      if (destroyed) return;
      clearHoverTimer();
      updateState((state) => {
        if (
          !state.isDragging &&
          state.dragPreviewValue === null &&
          state.pressedValue === null
        ) {
          return state;
        }
        return {
          isDragging: false,
          dragPreviewValue: null,
          pressedValue: null,
          hoveredValue: null,
          hoverDistance: 0,
          hoverMoving: false,
          hoverVelocity: 0,
        };
      });
    },

    setPillAnimating: (animating) => {
      if (destroyed) return;
      updateState((state) =>
        state.isPillAnimating === animating
          ? state
          : { isPillAnimating: animating },
      );
    },

    setTabGeometries: (tabs) => {
      tabGeometries = tabs;
    },

    getTabGeometries: () => tabGeometries,

    getTabStateMaskFromState: (state, val) =>
      computeTabStateMask(state, val, isTouchDevice),

    getTabSnapshot: (val, dimensions) =>
      computeTabSnapshotFromSlice(
        selectTabSnapshotSlice(store.getState(), val, isTouchDevice),
        dimensions,
        { orientation, isMobileNav, prefersReducedMotion },
      ),
  };
}
