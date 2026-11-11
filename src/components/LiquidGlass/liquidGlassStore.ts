import { createStore, type StoreApi } from "zustand/vanilla";
import { clamp, type Transition } from "motion/react";
import { SPRING } from "../../utils/springConfig";
import { hoverDelta, scaleDeltas } from "./config";
import type { TabOrientation } from "./types";

export type TabValue = string | number;
type TabFlightPhase = "idle" | "flight" | "landing";

export const TRAVEL_IMPULSE_MS = 140;
export const FLIGHT_SETTLE_MS = 150;
export const LANDING_PULSE_MS = 300;
export const REF_VELOCITY = 1800;

export const BASE_PILL_WIDTH = 100;
export const BASE_PILL_HEIGHT = 42;
export const DRAG_THRESHOLD_PX = 10;
export const APPLE_DECELERATION_RATE = 0.998;
const VELOCITY_BUFFER_SIZE = 12;
const VELOCITY_WINDOW_MS = 100;
const VELOCITY_PAUSE_TIMEOUT_MS = 80;
const MAX_RELEASE_VELOCITY = 4000;

export interface TabGeometry {
  value: TabValue;
  left: number;
  top: number;
  width: number;
  height: number;
  centerX: number;
}

interface VelocitySampler {
  reset: (x: number, nowMs: number) => void;
  push: (x: number, nowMs: number) => void;
  sample: (nowMs: number) => number;
}

/** Apple Designing Fluid Interfaces exponential momentum projection */
export function projectMomentum(
  velocityPxPerSec: number,
  decelerationRate = APPLE_DECELERATION_RATE,
): number {
  if (
    !Number.isFinite(velocityPxPerSec) ||
    !Number.isFinite(decelerationRate) ||
    decelerationRate <= 0 ||
    decelerationRate >= 1
  ) {
    return 0;
  }
  return (
    ((velocityPxPerSec / 1000) * decelerationRate) / (1 - decelerationRate)
  );
}

/** Apple soft-boundary progressive edge resistance */
function applyRubberBand(
  overshoot: number,
  dimension: number,
  constant = 0.55,
): number {
  if (
    !Number.isFinite(overshoot) ||
    !Number.isFinite(dimension) ||
    !Number.isFinite(constant) ||
    dimension <= 0 ||
    constant <= 0
  ) {
    return 0;
  }
  return (
    (overshoot * dimension * constant) /
    (dimension + constant * Math.abs(overshoot))
  );
}

export function clampCenterWithRubberBand(
  rawCenterX: number,
  tabs: readonly TabGeometry[],
): number {
  if (tabs.length === 0 || !Number.isFinite(rawCenterX)) return 0;
  const first = tabs[0];
  const last = tabs[tabs.length - 1];

  if (rawCenterX < first.centerX) {
    const overshoot = rawCenterX - first.centerX;
    const dim = Math.min(Math.max(first.width * 0.4, 24), 40);
    return first.centerX + applyRubberBand(overshoot, dim);
  }
  if (rawCenterX > last.centerX) {
    const overshoot = rawCenterX - last.centerX;
    const dim = Math.min(Math.max(last.width * 0.4, 24), 40);
    return last.centerX + applyRubberBand(overshoot, dim);
  }
  return rawCenterX;
}

/** Zero-allocation piecewise-linear interpolation of a tab box field along centerX */
export function interpolateTabField(
  centerX: number,
  tabs: readonly TabGeometry[],
  field: "width" | "height" | "top",
  fallback: number,
): number {
  if (tabs.length === 0 || !Number.isFinite(centerX)) {
    return fallback;
  }
  const first = tabs[0];
  if (tabs.length === 1 || centerX <= first.centerX) {
    return first[field];
  }
  const last = tabs[tabs.length - 1];
  if (centerX >= last.centerX) {
    return last[field];
  }

  for (let i = 0; i < tabs.length - 1; i++) {
    const a = tabs[i];
    const b = tabs[i + 1];
    if (centerX <= b.centerX) {
      const span = b.centerX - a.centerX;
      const t = span > 0 ? clamp(0, 1, (centerX - a.centerX) / span) : 0;
      return a[field] + (b[field] - a[field]) * t;
    }
  }
  return last[field];
}

export function resolveNearestTab(
  targetCenterX: number,
  tabs: readonly TabGeometry[],
): TabValue | null {
  if (tabs.length === 0) return null;
  if (!Number.isFinite(targetCenterX)) return tabs[0].value;

  let bestTab = tabs[0].value;
  let bestDist = Math.abs(tabs[0].centerX - targetCenterX);

  for (let i = 1; i < tabs.length; i++) {
    const dist = Math.abs(tabs[i].centerX - targetCenterX);
    if (dist < bestDist) {
      bestDist = dist;
      bestTab = tabs[i].value;
    }
  }
  return bestTab;
}

/** Pre-allocated circular ring buffer for zero-allocation drag velocity sampling */
export function createVelocitySampler(): VelocitySampler {
  const xs = new Float64Array(VELOCITY_BUFFER_SIZE);
  const ts = new Float64Array(VELOCITY_BUFFER_SIZE);
  let head = 0;
  let count = 0;

  return {
    reset: (x, nowMs) => {
      if (!Number.isFinite(x) || !Number.isFinite(nowMs)) {
        head = 0;
        count = 0;
        return;
      }
      xs[0] = x;
      ts[0] = nowMs;
      head = 1;
      count = 1;
    },
    push: (x, nowMs) => {
      if (!Number.isFinite(x) || !Number.isFinite(nowMs)) return;
      xs[head] = x;
      ts[head] = nowMs;
      head = (head + 1) % VELOCITY_BUFFER_SIZE;
      if (count < VELOCITY_BUFFER_SIZE) {
        count++;
      }
    },
    sample: (nowMs) => {
      if (count < 2 || !Number.isFinite(nowMs)) return 0;
      const newestIdx =
        (head - 1 + VELOCITY_BUFFER_SIZE) % VELOCITY_BUFFER_SIZE;
      const newestT = ts[newestIdx];
      const newestX = xs[newestIdx];

      if (nowMs - newestT > VELOCITY_PAUSE_TIMEOUT_MS) {
        return 0;
      }

      let oldestIdx = newestIdx;
      for (let offset = 1; offset < count; offset++) {
        const idx =
          (newestIdx - offset + VELOCITY_BUFFER_SIZE) % VELOCITY_BUFFER_SIZE;
        if (newestT - ts[idx] > VELOCITY_WINDOW_MS) {
          break;
        }
        oldestIdx = idx;
      }

      const dt = newestT - ts[oldestIdx];
      if (dt < 4) return 0;

      const velocity = ((newestX - xs[oldestIdx]) / dt) * 1000;
      return clamp(-MAX_RELEASE_VELOCITY, MAX_RELEASE_VELOCITY, velocity);
    },
  };
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

export function computeDragVelocityScaleY(
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
  return baseScaleY * (1 - maxYCompress * ratio * countMult);
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

interface TabRenderSnapshot {
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

interface TabsPhysicsState {
  activeValue: TabValue;
  activeDistance: number;
  activePhase: TabFlightPhase;
  hoveredValue: TabValue | null;
  hoverDistance: number;
  hoverMoving: boolean;
  pressedValue: TabValue | null;
  isDragging: boolean;
  dragPreviewValue: TabValue | null;
  isPillAnimating: boolean;
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
    _cacheKey?: string | number,
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
    pressedValue: null,
    isDragging: false,
    dragPreviewValue: null,
    isPillAnimating: false,
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
        : { activePhase: "idle", activeDistance: 0 },
    );
  };

  const beginLanding = () => {
    if (flightTimer) {
      clearTimeout(flightTimer);
      flightTimer = null;
    }
    if (destroyed || store.getState().activePhase !== "flight") return;
    updateState({ activePhase: "landing", activeDistance: 0 });
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
        state.hoverMoving ? { hoverMoving: false } : state,
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
        !state.hoverMoving
      ) {
        return null;
      }
      return { hoveredValue: null, hoverDistance: 0, hoverMoving: false };
    }

    if (state.hoveredValue === val) {
      if (distance === 0 && state.hoverMoving) {
        clearHoverTimer();
        return { hoverDistance: 0, hoverMoving: false };
      }
      return null;
    }

    if (distance > 0) {
      startHoverImpulse();
      return { hoveredValue: val, hoverDistance: distance, hoverMoving: true };
    }

    clearHoverTimer();
    return { hoveredValue: val, hoverDistance: distance, hoverMoving: false };
  };

  const evaluateTabFlags = (state: TabsPhysicsState, val: TabValue) => {
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
  };

  const getTabStateMaskFromState = (
    state: TabsPhysicsState,
    val: TabValue,
  ): number => {
    const flags = evaluateTabFlags(state, val);
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
          state.pressedValue === null &&
          !state.isDragging &&
          state.dragPreviewValue === null &&
          !state.isPillAnimating
        ) {
          return state;
        }
        return {
          activePhase: "idle",
          activeDistance: 0,
          hoveredValue: null,
          hoverDistance: 0,
          hoverMoving: false,
          pressedValue: null,
          isDragging: false,
          dragPreviewValue: null,
          isPillAnimating: false,
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
        activePhase: "idle",
        activeDistance: 0,
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
        activeValue: val,
        activeDistance: distance > 0 ? distance : 0,
        activePhase: distance > 0 ? "flight" : "idle",
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

    getTabStateMaskFromState,

    getTabSnapshot: (val, dimensions) => {
      const state = store.getState();
      const {
        isActive,
        isTransitioning,
        isLanding,
        isHovered,
        showHighlight,
        isMovingHover,
        isPressed,
        isDragPreview,
        hasDragPreview,
      } = evaluateTabFlags(state, val);

      const isHoverActive =
        isHovered ||
        isTransitioning ||
        isLanding ||
        state.isDragging ||
        state.isPillAnimating;
      let effectiveDistance = 0;
      if (isMovingHover) {
        effectiveDistance = state.hoverDistance;
      } else if (isTransitioning) {
        effectiveDistance = state.activeDistance;
      }

      const isTraveling = effectiveDistance > 0;
      const currentVelocity = isMovingHover ? mouseVelocity : undefined;

      const { targetScaleX, targetScaleY } = resolveTargetScales({
        isPressed,
        isHoverActive,
        isTraveling,
        orientation,
        isMobileNav,
        dimensions,
        tabDistance: effectiveDistance,
        prefersReducedMotion,
        tabCount: isTraveling ? tabOrder.length : 0,
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
          isHoverActive ||
          isPressed ||
          state.isDragging ||
          state.isPillAnimating,
        targetScaleX,
        targetScaleY,
        scaleSpring,
      };
    },
  };
}
