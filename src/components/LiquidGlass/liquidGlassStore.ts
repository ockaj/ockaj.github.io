import { createStore, type StoreApi } from "zustand/vanilla";
import { clamp, type Transition } from "motion/react";
import { hoverDelta, scaleDeltas, springs } from "./config";
import type { TabOrientation } from "./types";

export type TabValue = string | number;
type TabFlightPhase = "idle" | "flight" | "landing";

export const TRAVEL_IMPULSE_MS = 140;
export const FLIGHT_SETTLE_MS = 150;
export const LANDING_PULSE_MS = 420;
export const REF_VELOCITY = 1800;

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

export function computeVelocityScales(
  velocity: number,
  orientation: TabOrientation,
  tabCount: number,
  baseScales: BaseScales = { scaleX: 1, scaleY: 1 },
  refVelocity = REF_VELOCITY,
  prefersReducedMotion = false,
): { scaleX: number; scaleY: number } {
  if (prefersReducedMotion) return baseScales;

  const speed = Math.abs(velocity);
  if (speed < 5) return baseScales;

  const isBinary = tabCount > 0 && tabCount <= 2;
  const countMult =
    tabCount > 0 ? clamp(0.4, 1.0, (tabCount - 1) / 3) : 1.0;
  const ratio = Math.min(1.0, speed / refVelocity);

  if (orientation === "vertical") {
    const maxY = isBinary ? 0.035 : 0.1;
    const maxXCompress = isBinary ? 0.0 : 0.018;
    const travelStretchY = 1 + maxY * ratio * countMult;
    const travelCompressX = 1 - maxXCompress * ratio * countMult;

    const scaleX =
      baseScales.scaleX > 1.001
        ? 1 + (baseScales.scaleX - 1) * 0.45 * travelCompressX
        : travelCompressX;
    const scaleY = baseScales.scaleY * travelStretchY;
    return { scaleX, scaleY };
  }

  const maxX = isBinary ? 0.035 : 0.12;
  const maxYCompress = isBinary ? 0.0 : 0.018;
  const travelStretchX = 1 + maxX * ratio * countMult;
  const travelCompressY = 1 - maxYCompress * ratio * countMult;

  const scaleX = baseScales.scaleX * travelStretchX;
  const scaleY =
    baseScales.scaleY > 1.001
      ? 1 + (baseScales.scaleY - 1) * 0.45 * travelCompressY
      : travelCompressY;
  return { scaleX, scaleY };
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
  hoverSlide: boolean,
  isTouchDevice: boolean,
): boolean {
  if (isTouchDevice || !hoverSlide) {
    return isActive;
  }
  return isHovered || (isActive && hoveredValue === null);
}

interface TabsControllerConfig {
  orientation?: TabOrientation;
  hoverSlide?: boolean;
  isMobileNav?: boolean;
  prefersReducedMotion?: boolean;
  isTouchDevice?: boolean;
  hasNavbarActiveClass?: boolean;
}

interface TabsControllerOptions extends TabsControllerConfig {
  initialValue: TabValue;
  flightMs?: number;
  landingMs?: number;
  impulseMs?: number;
}

interface TabRenderSnapshot {
  isActive: boolean;
  isHovered: boolean;
  isPressed: boolean;
  isTransitioning: boolean;
  isLanding: boolean;
  isHoverMoving: boolean;
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
}

export interface TabsPhysicsController {
  store: StoreApi<TabsPhysicsState>;
  subscribe: (listener: () => void) => () => void;
  registerTab: (val: TabValue) => () => void;
  configure: (config: TabsControllerConfig) => void;
  destroy: () => void;

  getActiveValue: () => TabValue;
  getActivePhase: () => TabFlightPhase;
  getActiveDistance: () => number;
  getHoveredValue: () => TabValue | null;
  getHoverDistance: () => number;
  isHoverMoving: () => boolean;
  getVelocity: () => number;
  getTabCount: () => number;
  getTabDistance: (from: TabValue | null, to: TabValue | null) => number;

  setActiveValue: (val: TabValue, explicitDistance?: number) => void;
  hoverTab: (val: TabValue | null, explicitDistance?: number) => void;
  selectTab: (val: TabValue) => void;
  pressTab: (val: TabValue, pointerType?: string) => void;
  releaseTab: (val: TabValue, pointerType?: string) => void;
  cancelTabPress: () => void;
  leaveTab: (val: TabValue) => void;
  leaveTabs: () => void;
  recordPointerMove: (clientX: number, clientY: number, nowMs: number) => void;
  notifyLayoutComplete: () => void;
  completeFlight: () => void;

  getTabStateMask: (val: TabValue) => number;
  getTabStateMaskFromState: (state: TabsPhysicsState, val: TabValue) => number;
  getServerTabStateMask: (val: TabValue) => number;
  getTabSnapshot: (
    val: TabValue,
    dimensions: { width: number; height: number },
  ) => TabRenderSnapshot;
}

export function createTabsController({
  initialValue,
  orientation: initialOrientation = "horizontal",
  hoverSlide: initialHoverSlide = true,
  isMobileNav: initialIsMobileNav = false,
  prefersReducedMotion: initialReducedMotion = false,
  isTouchDevice: initialIsTouchDevice = false,
  hasNavbarActiveClass: initialNavbarActiveClass = false,
  flightMs = FLIGHT_SETTLE_MS,
  landingMs = LANDING_PULSE_MS,
  impulseMs = TRAVEL_IMPULSE_MS,
}: TabsControllerOptions): TabsPhysicsController {
  const store = createStore<TabsPhysicsState>(() => ({
    activeValue: initialValue,
    activeDistance: 0,
    activePhase: "idle",
    hoveredValue: null,
    hoverDistance: 0,
    hoverMoving: false,
    pressedValue: null,
  }));

  let orientation: TabOrientation = initialOrientation;
  let hoverSlide = initialHoverSlide;
  let isMobileNav = initialIsMobileNav;
  let prefersReducedMotion = initialReducedMotion;
  let isTouchDevice = initialIsTouchDevice;
  let hasNavbarActiveClass = initialNavbarActiveClass;

  const tabOrder: TabValue[] = [];
  let destroyed = false;

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
    if (landingMs > 0) {
      if (landingTimer) {
        clearTimeout(landingTimer);
      }
      landingTimer = setTimeout(() => {
        landingTimer = null;
        completeFlight();
      }, landingMs);
    }
  };

  const startHoverImpulse = () => {
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      hoverTimer = null;
      updateState((state) =>
        state.hoverMoving ? { hoverMoving: false } : state,
      );
    }, impulseMs);
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
    const isHovered = !isTouchDevice && state.hoveredValue === val;
    const showHighlight = shouldShowTabHighlight(
      isActive,
      isHovered,
      state.hoveredValue,
      hoverSlide,
      isTouchDevice,
    );
    const isMovingHover = isHovered && state.hoverMoving;
    const isPressed = state.pressedValue === val;
    return {
      isActive,
      isTransitioning,
      isLanding,
      isHovered,
      showHighlight,
      isMovingHover,
      isPressed,
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
      (flags.isPressed ? 64 : 0)
    );
  };

  return {
    store,
    subscribe: store.subscribe,

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
      if (next.hoverSlide !== undefined) hoverSlide = next.hoverSlide;
      if (next.isMobileNav !== undefined) isMobileNav = next.isMobileNav;
      if (next.prefersReducedMotion !== undefined) {
        prefersReducedMotion = next.prefersReducedMotion;
      }
      if (next.isTouchDevice !== undefined) isTouchDevice = next.isTouchDevice;
      if (next.hasNavbarActiveClass !== undefined) {
        hasNavbarActiveClass = next.hasNavbarActiveClass;
      }
    },

    destroy: () => {
      destroyed = true;
      clearActiveTimers();
      clearHoverTimer();
      mouseVelocity = 0;
      lastMousePos = null;
    },

    getActiveValue: () => store.getState().activeValue,
    getActivePhase: () => store.getState().activePhase,
    getActiveDistance: () => store.getState().activeDistance,
    getHoveredValue: () => store.getState().hoveredValue,
    getHoverDistance: () => store.getState().hoverDistance,
    isHoverMoving: () => store.getState().hoverMoving,
    getVelocity: () => mouseVelocity,
    getTabCount: () => tabOrder.length,
    getTabDistance,

    setActiveValue: (val, explicitDistance) => {
      if (destroyed) return;
      clearActiveTimers();
      const state = store.getState();
      if (state.activeValue === val) {
        if (explicitDistance === 0 && state.activePhase !== "idle") {
          updateState({ activePhase: "idle", activeDistance: 0 });
        }
        return;
      }

      const hoverPatch = computeHoverPatch(state, null, 0);
      const distance =
        explicitDistance ?? getTabDistance(state.activeValue, val);

      if (distance > 0) {
        flightTimer = setTimeout(() => {
          flightTimer = null;
          beginLanding();
        }, flightMs);
      }

      updateState({
        ...hoverPatch,
        activeValue: val,
        activeDistance: distance > 0 ? distance : 0,
        activePhase: distance > 0 ? "flight" : "idle",
      });
    },

    hoverTab: (val, explicitDistance) => {
      if (destroyed) return;
      if (val === null) {
        updateState((state) => computeHoverPatch(state, null, 0) ?? state);
        return;
      }
      if (!hoverSlide || isTouchDevice) return;
      updateState((state) => {
        const currentAnchor = state.hoveredValue ?? state.activeValue;
        const distance = explicitDistance ?? getTabDistance(currentAnchor, val);
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
        const hoverPatch =
          hoverSlide && !isTouch ? computeHoverPatch(state, val, 0) : null;
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
        state.pressedValue === val ? { pressedValue: null } : state,
      );
    },

    leaveTabs: () => {
      if (destroyed) return;
      mouseVelocity = 0;
      lastMousePos = null;
      updateState((state) =>
        state.hoveredValue !== null
          ? (computeHoverPatch(state, null, 0) ?? state)
          : state,
      );
    },

    recordPointerMove: (clientX, clientY, nowMs) => {
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

    completeFlight,

    getTabStateMask: (val) => getTabStateMaskFromState(store.getState(), val),

    getTabStateMaskFromState,

    getServerTabStateMask: (val) =>
      getTabStateMaskFromState(store.getInitialState(), val),

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
      } = evaluateTabFlags(state, val);

      const isHoverActive =
        isHovered || isTransitioning || isLanding || hasNavbarActiveClass;
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
          : springs.scale;

      return {
        isActive,
        isHovered,
        isPressed,
        isTransitioning,
        isLanding,
        isHoverMoving: isMovingHover,
        showHighlight,
        isNavbarActive: isHoverActive,
        willChange: isHoverActive || isPressed,
        targetScaleX,
        targetScaleY,
        scaleSpring,
      };
    },
  };
}
