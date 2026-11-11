import { clamp } from "motion/react";
import {
  REF_VELOCITY,
  type TabGeometry,
  type TabValue,
} from "./liquidGlassStore";

export const BASE_PILL_WIDTH = 100;
export const BASE_PILL_HEIGHT = 42;
export const DRAG_THRESHOLD_PX = 10;
export const APPLE_DECELERATION_RATE = 0.998;
const VELOCITY_BUFFER_SIZE = 12;
const VELOCITY_WINDOW_MS = 100;
const VELOCITY_PAUSE_TIMEOUT_MS = 80;
const MAX_RELEASE_VELOCITY = 4000;

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

/** Tightly bounds pill center within the track with a <= 1.8px inner cushion */
export function clampPillCenterForEdgePull(
  rawCenterX: number,
  tabs: readonly TabGeometry[],
): number {
  if (tabs.length === 0 || !Number.isFinite(rawCenterX)) return 0;
  const first = tabs[0];
  const last = tabs[tabs.length - 1];

  if (rawCenterX < first.centerX) {
    const overshoot = rawCenterX - first.centerX;
    return first.centerX + applyRubberBand(overshoot, 3, 0.4) * 0.6;
  }
  if (rawCenterX > last.centerX) {
    const overshoot = rawCenterX - last.centerX;
    return last.centerX + applyRubberBand(overshoot, 3, 0.4) * 0.6;
  }
  return rawCenterX;
}

/** Translates past-edge drag overshoot into a subtle whole-capsule horizontal rubber-band nudge (<= 4px) */
export function computeCapsuleEdgeOffsetX(
  rawCenterX: number,
  tabs: readonly TabGeometry[],
): number {
  if (tabs.length === 0 || !Number.isFinite(rawCenterX)) return 0;
  const first = tabs[0];
  const last = tabs[tabs.length - 1];

  if (rawCenterX < first.centerX) {
    return applyRubberBand(rawCenterX - first.centerX, 16, 0.45) * 0.25;
  }
  if (rawCenterX > last.centerX) {
    return applyRubberBand(rawCenterX - last.centerX, 16, 0.45) * 0.25;
  }
  return 0;
}

/** Clamps horizontal pill scale so velocity/flight stretch never escapes the outer end-caps */
export function clampPillScaleXForTrack(
  pillCenterX: number,
  baseWidth: number,
  candidateScaleX: number,
  tabs: readonly TabGeometry[],
  maxEdgeOverhangPx = 4.5,
): number {
  if (
    tabs.length === 0 ||
    !Number.isFinite(pillCenterX) ||
    !Number.isFinite(baseWidth) ||
    !Number.isFinite(candidateScaleX) ||
    baseWidth <= 0
  ) {
    return candidateScaleX;
  }

  const first = tabs[0];
  const last = tabs[tabs.length - 1];
  const minLeft = first.left - maxEdgeOverhangPx;
  const maxRight = last.left + last.width + maxEdgeOverhangPx;

  const maxHalfLeft = Math.max(0, pillCenterX - minLeft);
  const maxHalfRight = Math.max(0, maxRight - pillCenterX);
  const allowedHalfWidth = Math.min(maxHalfLeft, maxHalfRight);
  const maxScaleX = Math.max(0.01, (allowedHalfWidth * 2) / baseWidth);

  return Math.min(candidateScaleX, maxScaleX);
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
