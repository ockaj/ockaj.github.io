import { useEffect, useRef, useState, memo } from "react";
import { useReducedMotion } from "motion/react";
import { ErrorBoundary } from "./ErrorBoundary";
import AuroraFallback from "./AuroraFallback";
import {
  Renderer,
  Program,
  Mesh,
  Color,
  Triangle,
  OGLRenderingContext,
} from "ogl";

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[4];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ), 
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  
  // Loopless branchless color ramp interpolation (mathematically identical for equal stops)
  float scaledFactor = uv.x * 3.0;
  int index = clamp(int(floor(scaledFactor)), 0, 2);
  float lerpFactor = scaledFactor - float(index);
  vec3 rampColor = mix(uColorStops[index], uColorStops[index + 1], lerpFactor);
  
  // Double-octave simplex noise for a dynamic, organic shimmering wave
  float n1 = snoise(vec2(uv.x * 1.8 + uTime * 0.2, uTime * 0.3)) * 0.4;
  float n2 = snoise(vec2(uv.x * 4.0 - uTime * 0.3, uTime * 0.6)) * 0.1;
  float height = (n1 + n2) * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.65 * height;
  
  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  
  vec3 auroraColor = intensity * rampColor;
  
  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  time?: number;
  speed?: number;
}

const DEFAULT_COLOR_STOPS = ["#1E1B4B", "#312E81", "#6667AB", "#A78BFA"];

function AuroraCanvas(props: AuroraProps) {
  const prefersReducedMotion = useReducedMotion();
  const propsRef = useRef<AuroraProps>(props);
  const prefersReducedMotionRef = useRef(prefersReducedMotion);
  const triggerRef = useRef<(() => void) | null>(null);
  const [isContextLost, setIsContextLost] = useState(false);
  const isContextLostRef = useRef(false);

  useEffect(() => {
    propsRef.current = props;
    prefersReducedMotionRef.current = prefersReducedMotion;
  });

  const ctnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctn = ctnRef.current;
    if (!ctn) return;

    const {
      colorStops = DEFAULT_COLOR_STOPS,
      amplitude = 1.0,
      blend = 0.5,
    } = propsRef.current;

    const isMobile = window.innerWidth <= 767;
    const dpr = isMobile ? 1.0 : window.devicePixelRatio || 1.0;

    let renderer: Renderer;
    let gl: OGLRenderingContext;

    try {
      renderer = new Renderer({
        alpha: true,
        premultipliedAlpha: true,
        antialias: true,
        dpr: dpr,
      });
      gl = renderer.gl;
    } catch (e) {
      console.warn(
        "WebGL context initialization failed. Applying SVG fallback.",
        e,
      );
      isContextLostRef.current = true;
      queueMicrotask(() => setIsContextLost(true));
      return;
    }

    if (!gl) {
      console.warn(
        "WebGL context initialization failed. Applying SVG fallback.",
        new Error("WebGL context creation returned null"),
      );
      isContextLostRef.current = true;
      queueMicrotask(() => setIsContextLost(true));
      return;
    }

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    Object.assign(gl.canvas.style, {
      position: "absolute",
      width: "100%",
      height: "100%",
      backgroundColor: "transparent",
    });

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv;
    }

    const padColors = (stops: string[]) => {
      const arr = [...stops];
      while (arr.length < 4) {
        arr.push(arr[arr.length - 1] || "#000000");
      }
      return arr.slice(0, 4).map((hex) => {
        const c = new Color(hex);
        return [c.r, c.g, c.b];
      });
    };

    const colorStopsArray = padColors(colorStops);

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColorStops: { value: colorStopsArray },
        uResolution: { value: [renderer.width, renderer.height] },
        uBlend: { value: blend },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    ctn.appendChild(gl.canvas as HTMLCanvasElement);

    let w = 0,
      h = 0;
    function resize(entries?: ResizeObserverEntry[]) {
      if (!ctn) return;
      const entry = entries?.[0];
      const newW = entry ? entry.contentRect.width : ctn.offsetWidth;
      const newH = entry ? entry.contentRect.height : ctn.offsetHeight;
      if (newW > 0 && newH > 0 && (newW !== w || newH !== h)) {
        w = newW;
        h = newH;
        renderer.setSize(w, h);
        program.uniforms.uResolution.value = [renderer.width, renderer.height];
        // Synchronously render immediately after WebGL buffer resize to prevent 1-frame blank flicker
        if (!isContextLostRef.current && gl && !gl.isContextLost()) {
          renderer.render({ scene: mesh });
        }
      }
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(ctn);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      isContextLostRef.current = true;
      setIsContextLost(true);
      if (animateId) {
        cancelAnimationFrame(animateId);
        animateId = 0;
      }
      canvasEl.style.opacity = "0";
    };

    const handleContextRestored = () => {
      if (import.meta.env.DEV) {
        console.log("[DevTools] WebGL Context Restored event received!");
      }
      isContextLostRef.current = false;
      setIsContextLost(false);
      canvasEl.style.opacity = "1";
      try {
        const newGeometry = new Triangle(gl);
        if (newGeometry.attributes.uv) {
          delete newGeometry.attributes.uv;
        }
        const newProgram = new Program(gl, {
          vertex: VERT,
          fragment: FRAG,
          uniforms: {
            uTime: { value: 0 },
            uAmplitude: { value: amplitude },
            uColorStops: { value: colorStopsArray },
            uResolution: { value: [renderer.width, renderer.height] },
            uBlend: { value: blend },
          },
        });
        mesh.geometry = newGeometry;
        mesh.program = newProgram;
      } catch (err) {
        console.warn("WebGL resource restoration failed:", err);
      }
      if (!animateId && !prefersReducedMotionRef.current) {
        animateId = requestAnimationFrame(update);
      }
    };

    const canvasEl = gl.canvas as HTMLCanvasElement;
    canvasEl.addEventListener("webglcontextlost", handleContextLost, false);
    canvasEl.addEventListener(
      "webglcontextrestored",
      handleContextRestored,
      false,
    );

    const loseContextExt = gl.getExtension("WEBGL_lose_context");

    if (import.meta.env.DEV) {
      (
        window as unknown as { simulateContextLoss?: () => void }
      ).simulateContextLoss = () => {
        if (loseContextExt) {
          console.warn("[DevTools] Simulating WebGL context loss...");
          loseContextExt.loseContext();
        }
      };
      (window as unknown as { restoreContext?: () => void }).restoreContext =
        () => {
          if (loseContextExt) {
            console.log("[DevTools] Restoring WebGL context...");
            loseContextExt.restoreContext();
          }
        };
    }

    let prevStops: string[] | null = null;
    let animateId = 0;
    // throttle to ~30fps on mobile — halves backdrop-filter re-sampling
    const frameInterval = isMobile ? 33 : 0;
    let lastFrame = 0;

    const areStopsEqual = (a: string[] | null, b: string[] | null) => {
      if (a === b) return true;
      if (!a || !b || a.length !== b.length) return false;
      return a.every((val, i) => val === b[i]);
    };

    const update = (t: number) => {
      if (isContextLostRef.current || gl.isContextLost()) {
        animateId = 0;
        return;
      }
      if (prefersReducedMotionRef.current) {
        animateId = 0;
      } else {
        animateId = requestAnimationFrame(update);
      }
      if (frameInterval && t - lastFrame < frameInterval) return;
      lastFrame = t;
      const time = propsRef.current.time ?? t * 0.01;
      const speed = propsRef.current.speed ?? 1.0;
      mesh.program.uniforms.uTime.value = time * speed * 0.1;
      mesh.program.uniforms.uAmplitude.value =
        propsRef.current.amplitude ?? 1.0;
      mesh.program.uniforms.uBlend.value = propsRef.current.blend ?? blend;
      const stops = propsRef.current.colorStops ?? colorStops;
      if (!areStopsEqual(stops, prevStops)) {
        prevStops = stops;
        mesh.program.uniforms.uColorStops.value = padColors(stops);
      }
      renderer.render({ scene: mesh });
    };

    // Always trigger once initially
    animateId = requestAnimationFrame(update);

    triggerRef.current = () => {
      if (!animateId && !isContextLostRef.current) {
        animateId = requestAnimationFrame(update);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animateId) {
          cancelAnimationFrame(animateId);
          animateId = 0;
        }
      } else {
        if (
          !animateId &&
          !prefersReducedMotionRef.current &&
          !isContextLostRef.current
        ) {
          animateId = requestAnimationFrame(update);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    resize();

    const activeGl = gl;
    return () => {
      cancelAnimationFrame(animateId);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      canvasEl.removeEventListener("webglcontextlost", handleContextLost);
      canvasEl.removeEventListener(
        "webglcontextrestored",
        handleContextRestored,
      );
      if (ctn && canvasEl && canvasEl.parentNode === ctn) {
        ctn.removeChild(canvasEl);
      }
      activeGl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  useEffect(() => {
    if (!prefersReducedMotion && triggerRef.current) {
      triggerRef.current();
    }
  }, [prefersReducedMotion]);

  return (
    <div ref={ctnRef} className="w-full h-full relative">
      {isContextLost ? <AuroraFallback /> : null}
    </div>
  );
}

function Aurora(props: AuroraProps) {
  return (
    <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0">
      <div className="relative w-full h-full">
        <ErrorBoundary fallback={<AuroraFallback />}>
          <AuroraCanvas
            colorStops={DEFAULT_COLOR_STOPS}
            speed={1.0}
            amplitude={1.0}
            blend={0.65}
            {...props}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default memo(Aurora);
