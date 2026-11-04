export type TabValue = string | number;
type TabFlightPhase = "idle" | "flight" | "landing";

const TRAVEL_IMPULSE_MS = 140;
const FLIGHT_SETTLE_MS = 150; // Snappy squish matching hover
const LANDING_PULSE_MS = 420; // 420ms calm dwell: lets bounce completely settle before idle transition

interface SubscribableStore<T> {
  get: () => T;
  set: (val: T) => void;
  notify: () => void;
  subscribe: (listener: () => void) => () => void;
  destroy: () => void;
}

function createSubscribableStore<T>(initialValue: T): SubscribableStore<T> {
  let currentVal = initialValue;
  const listeners = new Set<() => void>();
  return {
    get: () => currentVal,
    set: (val: T) => {
      if (currentVal === val) return;
      currentVal = val;
      listeners.forEach((l) => l());
    },
    notify: () => {
      listeners.forEach((l) => l());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    destroy: () => {
      listeners.clear();
    },
  };
}

export interface ActiveTabStore {
  get: () => TabValue;
  set: (val: TabValue, distance?: number) => void;
  getDistance: () => number;
  isMoving: () => boolean;
  getPhase: () => TabFlightPhase;
  beginLanding: () => void;
  completeFlight: () => void;
  subscribe: (listener: () => void) => () => void;
  destroy: () => void;
}

export function createActiveTabStore(
  initialValue: TabValue,
  flightMs = FLIGHT_SETTLE_MS,
  landingMs = LANDING_PULSE_MS,
): ActiveTabStore {
  const store = createSubscribableStore<TabValue>(initialValue);
  let distanceVal = 0;
  let phase: TabFlightPhase = "idle";
  let flightTimer: ReturnType<typeof setTimeout> | null = null;
  let landingTimer: ReturnType<typeof setTimeout> | null = null;

  const clearTimers = () => {
    if (flightTimer) {
      clearTimeout(flightTimer);
      flightTimer = null;
    }
    if (landingTimer) {
      clearTimeout(landingTimer);
      landingTimer = null;
    }
  };

  const completeFlight = () => {
    clearTimers();
    if (phase !== "idle") {
      phase = "idle";
      distanceVal = 0;
      store.notify();
    }
  };

  const beginLanding = () => {
    if (flightTimer) {
      clearTimeout(flightTimer);
      flightTimer = null;
    }
    if (phase === "flight") {
      phase = "landing";
      distanceVal = 0;
      store.notify();
      if (landingMs > 0) {
        if (landingTimer) {
          clearTimeout(landingTimer);
        }
        landingTimer = setTimeout(() => {
          landingTimer = null;
          completeFlight();
        }, landingMs);
      }
    }
  };

  return {
    get: store.get,
    getDistance: () => distanceVal,
    isMoving: () => phase !== "idle",
    getPhase: () => phase,
    set: (val: TabValue, distance = 0) => {
      clearTimers();
      if (store.get() === val) {
        if (distance === 0 && phase !== "idle") {
          phase = "idle";
          distanceVal = 0;
          store.notify();
        }
        return;
      }
      if (distance > 0) {
        distanceVal = distance;
        phase = "flight";
        flightTimer = setTimeout(() => {
          flightTimer = null;
          beginLanding();
        }, flightMs);
      } else {
        distanceVal = 0;
        phase = "idle";
      }
      store.set(val);
    },
    beginLanding,
    completeFlight,
    subscribe: store.subscribe,
    destroy: () => {
      clearTimers();
      phase = "idle";
      distanceVal = 0;
      store.destroy();
    },
  };
}

export interface HoverTabStore {
  get: () => TabValue | null;
  set: (val: TabValue | null, distance?: number) => void;
  getDistance: () => number;
  isMoving: () => boolean;
  completeFlight: () => void;
  subscribe: (listener: () => void) => () => void;
  destroy: () => void;
}

export function createHoverTabStore(
  impulseMs = TRAVEL_IMPULSE_MS,
): HoverTabStore {
  const store = createSubscribableStore<TabValue | null>(null);
  let distanceVal = 0;
  let isMovingVal = false;
  let moveTimer: ReturnType<typeof setTimeout> | null = null;

  const clearMovingState = () => {
    if (moveTimer) {
      clearTimeout(moveTimer);
      moveTimer = null;
    }
    isMovingVal = false;
  };

  return {
    get: store.get,
    getDistance: () => distanceVal,
    isMoving: () => isMovingVal,
    set: (val: TabValue | null, distance = 0) => {
      if (val === null) {
        clearMovingState();
        distanceVal = 0;
        store.set(val);
        return;
      }
      if (store.get() === val) {
        if (distance === 0 && isMovingVal) {
          clearMovingState();
          distanceVal = 0;
          store.notify();
        }
        return;
      }
      distanceVal = distance;
      if (distance > 0) {
        isMovingVal = true;
        if (moveTimer) clearTimeout(moveTimer);
        moveTimer = setTimeout(() => {
          moveTimer = null;
          isMovingVal = false;
          store.notify();
        }, impulseMs);
      } else {
        clearMovingState();
      }
      store.set(val);
    },
    completeFlight: () => {
      if (!isMovingVal) return;
      clearMovingState();
      distanceVal = 0;
      store.notify();
    },
    subscribe: store.subscribe,
    destroy: () => {
      clearMovingState();
      store.destroy();
    },
  };
}
