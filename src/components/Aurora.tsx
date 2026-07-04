import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
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

export default function Aurora(props: AuroraProps) {
  const prefersReducedMotion = useReducedMotion();
  const propsRef = useRef<AuroraProps>(props);
  const prefersReducedMotionRef = useRef(prefersReducedMotion);
  const triggerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    prefersReducedMotionRef.current = prefersReducedMotion;
  }, [prefersReducedMotion]);

  useEffect(() => {
    propsRef.current = props;
  });

  const ctnDom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctn = ctnDom.current;
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
        "WebGL context initialization failed. Applying backdrop fallback gradient.",
        e,
      );
      if (ctn) {
        ctn.style.background =
          "radial-gradient(circle at center, #1E1B4B 0%, #0a0a0a 100%)";
      }
      return;
    }

    if (!gl) {
      console.warn(
        "WebGL context initialization failed. Applying backdrop fallback gradient.",
        new Error("WebGL context creation returned null"),
      );
      if (ctn) {
        ctn.style.background =
          "radial-gradient(circle at center, #1E1B4B 0%, #0a0a0a 100%)";
      }
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

    let w = 0,
      h = 0;
    function resize() {
      if (!ctn) return;
      const newW = ctn.offsetWidth,
        newH = ctn.offsetHeight;
      if (newW !== w || Math.abs(newH - h) > 120) {
        renderer.setSize((w = newW), (h = newH));
        program.uniforms.uResolution.value = [renderer.width, renderer.height];
      }
    }
    window.addEventListener("resize", resize, { passive: true });

    const mesh = new Mesh(gl, { geometry, program });
    ctn.appendChild(gl.canvas as HTMLCanvasElement);

    let prevStopsString = "";
    let animateId = 0;
    // throttle to ~30fps on mobile — halves backdrop-filter re-sampling
    const frameInterval = isMobile ? 33 : 0;
    let lastFrame = 0;
    const update = (t: number) => {
      if (prefersReducedMotionRef.current) {
        animateId = 0;
      } else {
        animateId = requestAnimationFrame(update);
      }
      if (frameInterval && t - lastFrame < frameInterval) return;
      lastFrame = t;
      const time = propsRef.current.time ?? t * 0.01;
      const speed = propsRef.current.speed ?? 1.0;
      program.uniforms.uTime.value = time * speed * 0.1;
      program.uniforms.uAmplitude.value = propsRef.current.amplitude ?? 1.0;
      program.uniforms.uBlend.value = propsRef.current.blend ?? blend;
      const stops = propsRef.current.colorStops ?? colorStops;
      const stopsString = stops.join(",");
      if (stopsString !== prevStopsString) {
        prevStopsString = stopsString;
        program.uniforms.uColorStops.value = padColors(stops);
      }
      renderer.render({ scene: mesh });
    };

    // Always trigger once initially
    animateId = requestAnimationFrame(update);

    triggerRef.current = () => {
      if (!animateId) {
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
        if (!animateId && !prefersReducedMotionRef.current) {
          animateId = requestAnimationFrame(update);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    resize();

    const activeGl = gl;
    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (
        ctn &&
        activeGl.canvas &&
        (activeGl.canvas as HTMLCanvasElement).parentNode === ctn
      ) {
        ctn.removeChild(activeGl.canvas as HTMLCanvasElement);
      }
      activeGl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  useEffect(() => {
    if (!prefersReducedMotion && triggerRef.current) {
      triggerRef.current();
    }
  }, [prefersReducedMotion]);

  return <div ref={ctnDom} className="w-full h-full" />;
}
