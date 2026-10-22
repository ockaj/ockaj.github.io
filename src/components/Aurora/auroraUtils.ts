export const DEFAULT_COLOR_STOPS = [
  "#1E1B4B",
  "#312E81",
  "#6667AB",
  "#A78BFA",
] as const;

export const MAX_STOPS = 5;
export const MAX_LAYERS = 3;
export const INTRO_SECONDS = 2.4;

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

function parseHexChannel(chars: string): number {
  const val = parseInt(chars, 16);
  return Number.isNaN(val) ? 0 : val / 255;
}

export function hexToRgb(hex: string): [number, number, number] {
  if (!hex || typeof hex !== "string") return [0, 0, 0];
  const clean = hex.startsWith("#") ? hex.slice(1) : hex;
  if (clean.length === 3 || clean.length === 4) {
    return [
      parseHexChannel(clean[0] + clean[0]),
      parseHexChannel(clean[1] + clean[1]),
      parseHexChannel(clean[2] + clean[2]),
    ];
  }
  if (clean.length >= 6) {
    return [
      parseHexChannel(clean.slice(0, 2)),
      parseHexChannel(clean.slice(2, 4)),
      parseHexChannel(clean.slice(4, 6)),
    ];
  }
  return [0, 0, 0];
}

export function toOklch(
  rgb: readonly [number, number, number],
): [number, number, number] {
  const r =
    rgb[0] <= 0.04045
      ? rgb[0] / 12.92
      : Math.pow((rgb[0] + 0.055) / 1.055, 2.4);
  const g =
    rgb[1] <= 0.04045
      ? rgb[1] / 12.92
      : Math.pow((rgb[1] + 0.055) / 1.055, 2.4);
  const b =
    rgb[2] <= 0.04045
      ? rgb[2] / 12.92
      : Math.pow((rgb[2] + 0.055) / 1.055, 2.4);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const lab0 = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const lab1 = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const lab2 = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  return [lab0, Math.hypot(lab1, lab2), Math.atan2(lab2, lab1)];
}

export function unwrapHues(
  stops: readonly (readonly [number, number, number])[],
): [number, number, number][] {
  const known = stops.findIndex((stop) => stop[1] > 0.02);
  const anchor = known === -1 ? 0 : stops[known][2];
  let previous = anchor;
  return stops.map((stop) => {
    let hue = stop[1] > 0.02 ? stop[2] : previous;
    while (hue - previous > Math.PI) hue -= Math.PI * 2;
    while (hue - previous < -Math.PI) hue += Math.PI * 2;
    previous = hue;
    return [stop[0], stop[1], hue];
  });
}

export function areStopsEqual(
  a: readonly string[] | null | undefined,
  b: readonly string[] | null | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  return a.every((val, i) => val === b[i]);
}

export function normalizeStops(
  stops?: readonly string[] | null,
): readonly string[] {
  if (stops === DEFAULT_COLOR_STOPS) return DEFAULT_COLOR_STOPS;
  if (!stops || !Array.isArray(stops)) return DEFAULT_COLOR_STOPS;
  const valid: string[] = [];
  for (let i = 0; i < stops.length && valid.length < MAX_STOPS; i++) {
    const item = stops[i];
    if (item) valid.push(String(item));
  }
  if (valid.length >= 2) return valid;
  if (valid.length === 1) return [valid[0], valid[0]];
  return DEFAULT_COLOR_STOPS;
}

export function getInitialReveal(
  intro?: boolean,
  prefersReducedMotion?: boolean,
  paused?: boolean,
): number {
  if (paused) return 0;
  if (prefersReducedMotion || intro === false) return 1;
  return 0;
}

export function extractDimensions(
  entry?: ResizeObserverEntry | null,
): [number, number] {
  if (!entry) return [0, 0];
  if (entry.borderBoxSize) {
    const borderBox = Array.isArray(entry.borderBoxSize)
      ? entry.borderBoxSize[0]
      : entry.borderBoxSize;
    if (borderBox && borderBox.inlineSize > 0 && borderBox.blockSize > 0) {
      return [borderBox.inlineSize, borderBox.blockSize];
    }
  }
  if (entry.contentRect) {
    return [entry.contentRect.width, entry.contentRect.height];
  }
  return [0, 0];
}
