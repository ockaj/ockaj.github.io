import {
  useEffect,
  useRef,
  useState,
  useCallback,
  memo,
  type RefObject,
} from "react";
import { ErrorBoundary } from "../ErrorBoundary";
import AuroraFallback from "./AuroraFallback";
import { useIsMobile, useMediaQuery } from "../../hooks/useMediaQuery";
import { useResizeObserver } from "../../hooks/useResizeObserver";
import {
  DEFAULT_COLOR_STOPS,
  MAX_STOPS,
  MAX_LAYERS,
  INTRO_SECONDS,
  clamp,
  hexToRgb,
  toOklch,
  unwrapHues,
  areStopsEqual,
  normalizeStops,
  getInitialReveal,
  extractDimensions,
} from "./auroraUtils";

declare global {
  interface Window {
    simulateContextLoss?: () => void;
    restoreContext?: () => void;
  }
}

// ============================================================================
// AURORA TUNABLES — Edit visual, motion, and responsive settings here
// ============================================================================
const AURORA_CONFIG = {
  colorStops: DEFAULT_COLOR_STOPS,
  speed: 3.2,
  blend: 0.65,
  glow: 0.5,
  brightness: 1.0,
  opacity: 1.0,
  mouseInteraction: true,
  intro: true,
  introSeconds: INTRO_SECONDS, // 2.4s

  desktop: {
    height: 0.52,
    scale: 1.0,
    amplitude: 1.5,
    layers: 2,
    maxDpr: 1.5,
    targetFps: 0,
  },

  mobile: {
    height: 0.62,
    scale: 1.35,
    amplitude: 1.35,
    layers: 1,
    maxDpr: 1.0,
    targetFps: 30,
  },
} as const;

const NO_VIEW_TRANSITION_STYLE = { viewTransitionName: "none" } as const;
const FALLBACK_ELEMENT = <AuroraFallback />;

const VERTEX_SHADER = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;

#define MAX_STOPS 5
#define MAX_LAYERS 3

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uStops[MAX_STOPS];
uniform int uStopCount;
uniform float uAmplitude;
uniform float uBlend;
uniform float uHeight;
uniform float uScale;
uniform float uGlow;
uniform float uBrightness;
uniform int uLayers;
uniform vec3 uPointer;
uniform float uReveal;
uniform float uOpacity;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187, 0.366025403784439,
    -0.577350269189626, 0.024390243902439
  );
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float smootherstep(float edge0, float edge1, float x) {
  float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

vec3 oklabToLinear(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

vec3 ramp(float t) {
  float x = clamp(t, 0.0, 1.0) * float(uStopCount - 1);
  int i = int(min(floor(x), float(uStopCount - 2)));
  float f = x - float(i);
  f = f * f * (3.0 - 2.0 * f);
  vec3 lch = mix(uStops[i], uStops[i + 1], f);
  return toSrgb(oklabToLinear(vec3(lch.x, lch.y * cos(lch.z), lch.y * sin(lch.z))));
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float y = 1.0 - frag.y / uResolution.y;
  float u = frag.x / uResolution.x;
  float X = (frag.x - uResolution.x * 0.5) / uResolution.y;
  float t = uTime;
  float delta = X - uPointer.x;
  float reach = uPointer.z * exp(-pow(delta / 0.55, 2.0));
  float lateral = delta * reach * 0.16;

  vec3 glow = vec3(0.0);
  float cover = 0.0;
  for (int k = 0; k < MAX_LAYERS; k++) {
    if (k >= uLayers) break;
    float layer = float(k);
    float seed = layer * 13.7;
    float pace = t * (1.0 - layer * 0.18);
    float warp = snoise(vec2(X * 0.45 * uScale + pace * 0.02 + seed + lateral, pace * 0.05 + seed));
    float wave = snoise(vec2(X * 0.75 * uScale + warp * 0.35 - pace * 0.03 + seed, pace * 0.07 - seed)) * 0.72
      + snoise(vec2(X * 1.6 * uScale + warp * 0.5 + pace * 0.04 - seed, pace * 0.1 + seed * 0.5)) * 0.28;
    float hem = uHeight + layer * 0.07 + wave * 0.15 * uAmplitude;
    hem = mix(-0.25, hem, uReveal);

    float soft = (0.04 + uBlend * 0.16) * (1.0 + layer * 0.9);
    float rise = hem - y;
    float low = -soft - uGlow * 0.14;
    float high = 0.26 + soft * 0.6;
    float body = pow(smootherstep(low, high, rise), 1.5 + uGlow * 0.6);
    float lobes = 0.86 + 0.14 * snoise(vec2(X * 0.9 * uScale - pace * 0.025 + seed, y * 0.3 + pace * 0.04));
    float alpha = clamp(body * lobes * (layer < 0.5 ? 1.0 : 0.32 / layer), 0.0, 1.0);

    vec3 tint = ramp(u + 0.05 * sin(pace * 0.08 + layer * 2.3) + layer * 0.1 + max(rise, 0.0) * 0.05);
    glow = 1.0 - (1.0 - glow) * (1.0 - tint * alpha);
    cover = 1.0 - (1.0 - cover) * (1.0 - alpha);
  }

  float fade = smootherstep(0.0, 0.7, uReveal) * uOpacity;
  float strength = clamp(uBrightness, 0.0, 2.0);
  glow *= fade * min(strength, 1.0);
  cover *= fade * min(strength, 1.0);
  glow = 1.0 - pow(clamp(1.0 - glow, 0.0, 1.0), vec3(max(strength, 1.0)));
  float dither = (hash(frag) - 0.5) / 255.0;

  fragColor = vec4(clamp(glow + dither, 0.0, 1.0), clamp(cover + dither, 0.0, 1.0));
}
`;

interface AuroraProps {
  colorStops?: readonly string[] | string[];
  amplitude?: number;
  blend?: number;
  speed?: number;
  time?: number;
  height?: number;
  scale?: number;
  glow?: number;
  brightness?: number;
  layers?: number;
  mouseInteraction?: boolean;
  intro?: boolean;
  opacity?: number;
  paused?: boolean;
}

interface UniformLocations {
  uResolution: WebGLUniformLocation | null;
  uTime: WebGLUniformLocation | null;
  uStops: WebGLUniformLocation | null;
  uStopCount: WebGLUniformLocation | null;
  uAmplitude: WebGLUniformLocation | null;
  uBlend: WebGLUniformLocation | null;
  uHeight: WebGLUniformLocation | null;
  uScale: WebGLUniformLocation | null;
  uGlow: WebGLUniformLocation | null;
  uBrightness: WebGLUniformLocation | null;
  uLayers: WebGLUniformLocation | null;
  uPointer: WebGLUniformLocation | null;
  uReveal: WebGLUniformLocation | null;
  uOpacity: WebGLUniformLocation | null;
}

interface AuroraProgram {
  program: WebGLProgram;
  uniforms: UniformLocations;
}

const USE_PROGRAM_PROP = "useProgram" as const;
function activateProgram(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
): void {
  gl[USE_PROGRAM_PROP](program);
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader;
  }
  if (import.meta.env.DEV) {
    console.error("Aurora shader compile error:", gl.getShaderInfoLog(shader));
  }
  gl.deleteShader(shader);
  return null;
}

function createAuroraProgram(gl: WebGL2RenderingContext): AuroraProgram | null {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, "aPosition");
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    if (import.meta.env.DEV) {
      console.error(
        "Aurora shader program link failed:",
        gl.getProgramInfoLog(program),
      );
    }
    gl.deleteProgram(program);
    return null;
  }

  const uniforms: UniformLocations = {
    uResolution: gl.getUniformLocation(program, "uResolution"),
    uTime: gl.getUniformLocation(program, "uTime"),
    uStops: gl.getUniformLocation(program, "uStops"),
    uStopCount: gl.getUniformLocation(program, "uStopCount"),
    uAmplitude: gl.getUniformLocation(program, "uAmplitude"),
    uBlend: gl.getUniformLocation(program, "uBlend"),
    uHeight: gl.getUniformLocation(program, "uHeight"),
    uScale: gl.getUniformLocation(program, "uScale"),
    uGlow: gl.getUniformLocation(program, "uGlow"),
    uBrightness: gl.getUniformLocation(program, "uBrightness"),
    uLayers: gl.getUniformLocation(program, "uLayers"),
    uPointer: gl.getUniformLocation(program, "uPointer"),
    uReveal: gl.getUniformLocation(program, "uReveal"),
    uOpacity: gl.getUniformLocation(program, "uOpacity"),
  };

  return { program, uniforms };
}

function createQuadBuffers(gl: WebGL2RenderingContext): {
  vao: WebGLVertexArrayObject | null;
  buffer: WebGLBuffer | null;
} {
  const buffer = gl.createBuffer();
  const vao = gl.createVertexArray();
  if (!buffer || !vao) {
    return { vao: null, buffer: null };
  }
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return { vao, buffer };
}

function updatePointerFollow(
  dt: number,
  pointer: { x: number; y: number; inside: boolean },
  view: { width: number; height: number },
  state: { px: number; py: number; reach: number },
  engaged: boolean,
): void {
  const follow = 1 - Math.exp(-dt / 0.6);
  if (engaged) {
    const tx = (pointer.x - view.width / 2) / Math.max(1, view.height);
    const ty = pointer.y / Math.max(1, view.height);
    state.px += (tx - state.px) * follow;
    state.py += (ty - state.py) * follow;
  }
  const reachDamping = engaged ? 0.9 : 1.4;
  state.reach +=
    ((engaged ? 1 : 0) - state.reach) * (1 - Math.exp(-dt / reachDamping));
}

function useAuroraCanvas(
  props: Readonly<AuroraProps>,
  container: RefObject<HTMLDivElement | null>,
) {
  const isMobile = useIsMobile();
  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)",
  );
  const propsRef = useRef<AuroraProps>(props);
  const prefersReducedMotionRef = useRef(prefersReducedMotion);
  const isMobileRef = useRef(isMobile);
  const triggerRef = useRef<(() => void) | null>(null);
  const pauseRef = useRef<(() => void) | null>(null);
  const markDirtyRef = useRef<(() => void) | null>(null);
  const [isContextLost, setIsContextLost] = useState(false);
  const isContextLostRef = useRef(false);
  const resizeRef = useRef<((entry: ResizeObserverEntry) => void) | null>(null);

  useEffect(() => {
    propsRef.current = props;
    prefersReducedMotionRef.current = prefersReducedMotion;
    isMobileRef.current = isMobile;
    markDirtyRef.current?.();
    if (prefersReducedMotion && !props.paused) {
      triggerRef.current?.();
    }
  });

  useEffect(() => {
    const ctn = container.current;
    if (!ctn) return;

    const contextAttributes: WebGLContextAttributes = {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      premultipliedAlpha: true,
      failIfMajorPerformanceCaveat: true,
    };

    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", contextAttributes);

    if (!gl) {
      console.warn(
        "Hardware WebGL2 acceleration unavailable. Applying SVG fallback.",
      );
      isContextLostRef.current = true;
      queueMicrotask(() => setIsContextLost(true));
      return;
    }

    const activeGl = gl;
    let programData = createAuroraProgram(activeGl);
    let quadData = createQuadBuffers(activeGl);

    if (!programData || !quadData.vao || !quadData.buffer) {
      console.warn(
        "WebGL shader or buffer creation failed. Applying SVG fallback.",
      );
      isContextLostRef.current = true;
      queueMicrotask(() => setIsContextLost(true));
      return;
    }

    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "transparent",
      viewTransitionName: "none",
    });
    ctn.appendChild(canvas);

    const initialW = ctn.clientWidth || window.innerWidth || 1;
    const initialH = ctn.clientHeight || window.innerHeight || 1;
    const initialPreset = isMobileRef.current
      ? AURORA_CONFIG.mobile
      : AURORA_CONFIG.desktop;
    const initialDpr = Math.min(
      window.devicePixelRatio || 1.0,
      initialPreset.maxDpr,
    );
    canvas.width = Math.max(1, Math.round(initialW * initialDpr));
    canvas.height = Math.max(1, Math.round(initialH * initialDpr));

    const palette = new Float32Array(MAX_STOPS * 3);
    let stopCount = 0;
    let prevStops: readonly string[] | null = null;
    let configDirty = true;
    markDirtyRef.current = () => {
      configDirty = true;
    };

    const updatePalette = (stops: readonly string[]) => {
      const normalized = normalizeStops(stops);
      const oklchStops = unwrapHues(
        normalized.map((hex) => toOklch(hexToRgb(hex))),
      );
      palette.fill(0);
      for (let i = 0; i < oklchStops.length; i++) {
        const s = oklchStops[i];
        palette[i * 3] = s[0];
        palette[i * 3 + 1] = s[1];
        palette[i * 3 + 2] = s[2];
      }
      stopCount = oklchStops.length;
    };

    const view = { width: initialW, height: initialH };
    const pointer = { x: 0, y: 0, inside: false };
    const state = {
      px: 0,
      py: 0.5,
      reach: 0,
      reveal: getInitialReveal(
        propsRef.current.intro ?? AURORA_CONFIG.intro,
        prefersReducedMotionRef.current,
        propsRef.current.paused,
      ),
    };

    let animateId = 0;
    let previousWallTime = 0;
    let virtualTime = 0;
    let frameAccumulator = 0;
    let needsReanchor = true;

    const render = () => {
      if (
        isContextLostRef.current ||
        !programData ||
        !quadData.vao ||
        activeGl.isContextLost()
      ) {
        return;
      }
      const { program, uniforms } = programData;
      activeGl.viewport(0, 0, canvas.width, canvas.height);
      activateProgram(activeGl, program);
      activeGl.bindVertexArray(quadData.vao);

      const stops = propsRef.current.colorStops ?? AURORA_CONFIG.colorStops;
      if (!areStopsEqual(stops, prevStops)) {
        prevStops = stops;
        updatePalette(stops);
        configDirty = true;
      }

      if (configDirty) {
        configDirty = false;
        const preset = isMobileRef.current
          ? AURORA_CONFIG.mobile
          : AURORA_CONFIG.desktop;
        const resolvedLayers =
          propsRef.current.layers !== undefined
            ? clamp(Math.round(propsRef.current.layers), 1, MAX_LAYERS)
            : preset.layers;
        const resolvedHeight = propsRef.current.height ?? preset.height;
        const resolvedScale = propsRef.current.scale ?? preset.scale;
        const resolvedAmplitude =
          propsRef.current.amplitude ?? preset.amplitude;

        activeGl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
        activeGl.uniform3fv(uniforms.uStops, palette);
        activeGl.uniform1i(uniforms.uStopCount, stopCount);
        activeGl.uniform1f(uniforms.uAmplitude, resolvedAmplitude);
        activeGl.uniform1f(
          uniforms.uBlend,
          propsRef.current.blend ?? AURORA_CONFIG.blend,
        );
        activeGl.uniform1f(uniforms.uHeight, resolvedHeight);
        activeGl.uniform1f(uniforms.uScale, resolvedScale);
        activeGl.uniform1f(
          uniforms.uGlow,
          propsRef.current.glow ?? AURORA_CONFIG.glow,
        );
        activeGl.uniform1f(
          uniforms.uBrightness,
          propsRef.current.brightness ?? AURORA_CONFIG.brightness,
        );
        activeGl.uniform1i(uniforms.uLayers, resolvedLayers);
        activeGl.uniform1f(
          uniforms.uOpacity,
          propsRef.current.opacity ?? AURORA_CONFIG.opacity,
        );
      }

      const speed = propsRef.current.speed ?? AURORA_CONFIG.speed;
      const timeUniform =
        propsRef.current.time !== undefined
          ? propsRef.current.time * speed * 0.1
          : virtualTime;

      activeGl.uniform1f(uniforms.uTime, timeUniform);
      activeGl.uniform3f(uniforms.uPointer, state.px, state.py, state.reach);
      const revealFactor = 1 - Math.pow(1 - state.reveal, 3);
      activeGl.uniform1f(uniforms.uReveal, revealFactor);

      activeGl.drawArrays(activeGl.TRIANGLES, 0, 3);
    };

    const update = (now: number) => {
      if (isContextLostRef.current || activeGl.isContextLost()) {
        animateId = 0;
        return;
      }
      if (prefersReducedMotionRef.current) {
        animateId = 0;
        state.reveal = 1;
        state.reach = 0;
        render();
        return;
      }
      if (propsRef.current.paused) {
        animateId = 0;
        needsReanchor = true;
        return;
      }

      animateId = requestAnimationFrame(update);

      let dt: number;
      if (needsReanchor || previousWallTime === 0) {
        previousWallTime = now;
        needsReanchor = false;
        frameAccumulator = 0;
        dt = 1 / 60;
      } else {
        const rawDeltaSeconds = (now - previousWallTime) * 0.001;
        previousWallTime = now;
        dt = Math.min(Math.max(rawDeltaSeconds, 0.0005), 0.1);
      }

      const preset = isMobileRef.current
        ? AURORA_CONFIG.mobile
        : AURORA_CONFIG.desktop;
      const targetFps = preset.targetFps;
      if (targetFps > 0) {
        const targetInterval = 1.0 / targetFps;
        frameAccumulator += dt;
        if (frameAccumulator < targetInterval) {
          return;
        }
        const steps = Math.min(
          3,
          Math.floor(frameAccumulator / targetInterval),
        );
        dt = steps * targetInterval;
        frameAccumulator -= dt;
      }

      const speed = propsRef.current.speed ?? AURORA_CONFIG.speed;
      virtualTime += dt * speed;

      const engaged =
        (propsRef.current.mouseInteraction ?? AURORA_CONFIG.mouseInteraction) &&
        pointer.inside &&
        !prefersReducedMotionRef.current;
      updatePointerFollow(dt, pointer, view, state, engaged);

      if ((propsRef.current.intro ?? AURORA_CONFIG.intro) === false) {
        state.reveal = 1;
      } else if (state.reveal < 1) {
        state.reveal = Math.min(
          1,
          state.reveal + dt / AURORA_CONFIG.introSeconds,
        );
      }

      render();
    };

    const wake = () => {
      if (
        isContextLostRef.current ||
        activeGl.isContextLost() ||
        propsRef.current.paused ||
        document.hidden
      ) {
        return;
      }
      if (prefersReducedMotionRef.current) {
        if (animateId) {
          cancelAnimationFrame(animateId);
          animateId = 0;
        }
        state.reveal = 1;
        state.reach = 0;
        render();
        return;
      }
      if (!animateId) {
        needsReanchor = true;
        animateId = requestAnimationFrame(update);
      }
    };
    triggerRef.current = wake;

    const pause = () => {
      if (animateId) {
        cancelAnimationFrame(animateId);
        animateId = 0;
      }
      needsReanchor = true;
    };
    pauseRef.current = pause;

    let w = 0;
    let h = 0;
    function resize(entry?: ResizeObserverEntry) {
      if (!ctn || !entry) return;
      const [newW, newH] = extractDimensions(entry);
      if (newW > 0 && newH > 0 && (newW !== w || newH !== h)) {
        w = newW;
        h = newH;
        view.width = w;
        view.height = h;
        const preset = isMobileRef.current
          ? AURORA_CONFIG.mobile
          : AURORA_CONFIG.desktop;
        const currentDpr = Math.min(
          window.devicePixelRatio || 1.0,
          preset.maxDpr,
        );
        const pixelW = Math.max(1, Math.round(w * currentDpr));
        const pixelH = Math.max(1, Math.round(h * currentDpr));
        if (canvas.width !== pixelW || canvas.height !== pixelH) {
          canvas.width = pixelW;
          canvas.height = pixelH;
          configDirty = true;
        }
        activeGl.viewport(0, 0, canvas.width, canvas.height);
        if (!isContextLostRef.current && !activeGl.isContextLost()) {
          render();
        }
        wake();
      }
    }
    resizeRef.current = resize;

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      const wasInside = pointer.inside;
      pointer.inside =
        event.clientX >= 0 &&
        event.clientY >= 0 &&
        event.clientX <= view.width &&
        event.clientY <= view.height;
      if (pointer.inside && !wasInside) {
        state.px = (event.clientX - view.width / 2) / Math.max(1, view.height);
        state.py = event.clientY / Math.max(1, view.height);
      }
      wake();
    };

    const onPointerLeave = () => {
      pointer.inside = false;
      wake();
    };

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      isContextLostRef.current = true;
      setIsContextLost(true);
      if (animateId) {
        cancelAnimationFrame(animateId);
        animateId = 0;
      }
      needsReanchor = true;
      canvas.style.opacity = "0";
    };

    const handleContextRestored = () => {
      if (import.meta.env.DEV) {
        console.log("[DevTools] WebGL Context Restored event received!");
      }
      try {
        const nextProgram = createAuroraProgram(activeGl);
        const nextQuad = createQuadBuffers(activeGl);
        if (!nextProgram || !nextQuad.vao || !nextQuad.buffer) {
          console.warn(
            "WebGL resource restoration failed. Maintaining SVG fallback.",
          );
          isContextLostRef.current = true;
          setIsContextLost(true);
          return;
        }
        programData = nextProgram;
        quadData = nextQuad;
        prevStops = null;
        configDirty = true;
        isContextLostRef.current = false;
        setIsContextLost(false);
        canvas.style.opacity = "1";
        needsReanchor = true;
        wake();
      } catch (err) {
        console.warn("WebGL resource restoration failed:", err);
        isContextLostRef.current = true;
        setIsContextLost(true);
      }
    };

    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    canvas.addEventListener(
      "webglcontextrestored",
      handleContextRestored,
      false,
    );

    const loseContextExt = activeGl.getExtension("WEBGL_lose_context");
    if (import.meta.env.DEV) {
      window.simulateContextLoss = () => {
        if (loseContextExt) {
          console.warn("[DevTools] Simulating WebGL context loss...");
          loseContextExt.loseContext();
        } else {
          console.warn(
            "[DevTools] WEBGL_lose_context extension not supported.",
          );
        }
      };
      window.restoreContext = () => {
        if (loseContextExt) {
          console.log("[DevTools] Restoring WebGL context...");
          loseContextExt.restoreContext();
        } else {
          console.warn(
            "[DevTools] WEBGL_lose_context extension not supported.",
          );
        }
      };
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animateId) {
          cancelAnimationFrame(animateId);
          animateId = 0;
        }
        needsReanchor = true;
      } else {
        needsReanchor = true;
        wake();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);

    if (!propsRef.current.paused) {
      wake();
    }

    const activeQuad = quadData;
    const activeProgram = programData;

    return () => {
      if (animateId) cancelAnimationFrame(animateId);
      triggerRef.current = null;
      pauseRef.current = null;
      markDirtyRef.current = null;
      resizeRef.current = null;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerMove);
      document.documentElement.removeEventListener(
        "pointerleave",
        onPointerLeave,
      );
      window.removeEventListener("blur", onPointerLeave);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      if (import.meta.env.DEV) {
        delete window.simulateContextLoss;
        delete window.restoreContext;
      }
      if (ctn && canvas.parentNode === ctn) {
        ctn.removeChild(canvas);
      }
      if (activeQuad.vao) activeGl.deleteVertexArray(activeQuad.vao);
      if (activeQuad.buffer) activeGl.deleteBuffer(activeQuad.buffer);
      if (activeProgram) activeGl.deleteProgram(activeProgram.program);
      loseContextExt?.loseContext();
    };
  }, [container]);

  const handleResize = useCallback((entry: ResizeObserverEntry) => {
    resizeRef.current?.(entry);
  }, []);

  useResizeObserver(container, handleResize);

  useEffect(() => {
    if (props.paused) {
      pauseRef.current?.();
    } else if (triggerRef.current) {
      triggerRef.current();
    }
  }, [props.paused, prefersReducedMotion]);

  return { isContextLost };
}

function AuroraCanvas(props: Readonly<AuroraProps>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { isContextLost } = useAuroraCanvas(props, containerRef);

  return (
    <div
      ref={containerRef}
      className="relative size-full"
      style={NO_VIEW_TRANSITION_STYLE}
    >
      {isContextLost ? FALLBACK_ELEMENT : null}
    </div>
  );
}

function Aurora(props: Readonly<AuroraProps>) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={NO_VIEW_TRANSITION_STYLE}
    >
      <div className="relative size-full">
        <ErrorBoundary fallback={FALLBACK_ELEMENT}>
          <AuroraCanvas {...props} />
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default memo(Aurora);
