import { useEffect, useEffectEvent, useRef, useState } from "react";
import { TULIP_CONFIG, TULIP_B64, TULIP_CB64 } from "./tulipData";
import { useResizeObserver } from "../hooks/useResizeObserver";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery";
import { cn } from "../utils/cn";

interface TulipAsciiPlayerProps {
  className?: string;
}

function decodeTint(rgb: Uint8Array, imageData: ImageData): void {
  const d = imageData.data;
  const n = rgb.length / 3;
  for (let i = 0; i < n; i++) {
    d[i * 4] = rgb[i * 3];
    d[i * 4 + 1] = rgb[i * 3 + 1];
    d[i * 4 + 2] = rgb[i * 3 + 2];
    d[i * 4 + 3] = 255;
  }
}

async function inflate(b64: string): Promise<Uint8Array> {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  if (!("DecompressionStream" in window)) {
    return bytes;
  }
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function measureCharRatio(fontFamily: string): number {
  if (typeof document === "undefined") return 0.6;
  const probe = document.createElement("span");
  probe.textContent = "M";
  probe.style.cssText = `position:absolute;visibility:hidden;font:100px/1 ${fontFamily}`;
  document.body.appendChild(probe);
  const ratio = probe.getBoundingClientRect().width / 100;
  probe.remove();
  return ratio > 0 ? ratio : 0.6;
}

async function fetchAndDecodeTulips(canvas: HTMLCanvasElement | null) {
  const [asciiBytes, tintBytes] = await Promise.all([
    inflate(TULIP_B64),
    inflate(TULIP_CB64),
  ]);

  const text = new TextDecoder().decode(asciiBytes);
  const frames = text.split(String.fromCharCode(30));

  const flen = TULIP_CONFIG.cw * TULIP_CONFIG.ch * 3;
  const frameCount = Math.floor(tintBytes.length / flen);

  let ctx: CanvasRenderingContext2D | null = null;
  const imgs: ImageData[] = [];

  if (canvas) {
    ctx = canvas.getContext("2d");
    if (ctx) {
      for (let f = 0; f < frameCount; f++) {
        const img = ctx.createImageData(TULIP_CONFIG.cw, TULIP_CONFIG.ch);
        decodeTint(tintBytes.subarray(f * flen, (f + 1) * flen), img);
        imgs.push(img);
      }
    }
  }

  return { frames, imgs, ctx };
}

export default function TulipAsciiPlayer({
  className = "",
}: Readonly<TulipAsciiPlayerProps>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const framesRef = useRef<string[]>([]);
  const imgsRef = useRef<ImageData[]>([]);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const shownFrameRef = useRef(-1);
  const startTimeRef = useRef(0);

  function fit() {
    const pre = preRef.current;
    const container = containerRef.current;
    if (!pre || !container) return;

    const boxW = container.clientWidth || window.innerWidth;
    const boxH = container.clientHeight || window.innerHeight;
    const style = getComputedStyle(pre);
    const charRatio = measureCharRatio(style.fontFamily);

    // Fit within both width and height so flowers are never clipped
    const sizeByWidth = boxW / (TULIP_CONFIG.cols * charRatio);
    const sizeByHeight = boxH / TULIP_CONFIG.rows;
    const targetFontSize = Math.max(1, Math.min(sizeByHeight, sizeByWidth));

    pre.style.fontSize = `${targetFontSize}px`;
  }

  const onFit = useEffectEvent(fit);

  useResizeObserver(containerRef, fit);

  useEffect(() => {
    let isCancelled = false;

    fetchAndDecodeTulips(canvasRef.current)
      .then((data) => {
        if (!isCancelled) {
          framesRef.current = data.frames;
          imgsRef.current = data.imgs;
          ctxRef.current = data.ctx;
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Continuous animation loop (or static final frame for reduced motion)
  useEffect(() => {
    if (isLoading || hasError) return;

    onFit();

    const frames = framesRef.current;
    const imgs = imgsRef.current;
    const ctx = ctxRef.current;
    const pre = preRef.current;

    if (!frames.length || !pre) {
      return;
    }

    if (prefersReducedMotion) {
      const staticIdx = frames.length - 1;
      pre.textContent = frames[staticIdx];
      if (ctx && imgs[staticIdx]) {
        ctx.putImageData(imgs[staticIdx], 0, 0);
      }
      shownFrameRef.current = staticIdx;
      return;
    }

    startTimeRef.current = performance.now();
    shownFrameRef.current = -1;

    function renderLoop(now: number) {
      if (frames.length > 0 && pre) {
        const frameIdx =
          Math.floor(((now - startTimeRef.current) / 1000) * TULIP_CONFIG.fps) %
          frames.length;

        if (frameIdx !== shownFrameRef.current) {
          pre.textContent = frames[frameIdx];
          if (ctx && imgs[frameIdx]) {
            ctx.putImageData(imgs[frameIdx], 0, 0);
          }
          shownFrameRef.current = frameIdx;
        }
      }
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    }

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isLoading, hasError, prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex size-full items-end justify-center overflow-hidden select-none",
        className,
      )}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-text-primary">
          <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent" />
          <span className="font-sans text-sm font-medium tracking-wide text-muted">
            Pripravujem kytičku...
          </span>
        </div>
      ) : null}

      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <span className="font-sans text-sm text-muted">
            Nepodarilo sa načítať animáciu.
          </span>
        </div>
      ) : null}

      <div
        className={cn(
          "relative isolate flex items-end justify-center bg-black transition-opacity duration-300",
          isLoading || hasError ? "opacity-0" : "opacity-100",
        )}
      >
        <pre
          ref={preRef}
          aria-hidden="true"
          translate="no"
          className="notranslate m-0 block font-mono leading-none tracking-normal text-white select-none"
          style={{ width: "max-content" }}
        />
        <canvas
          ref={canvasRef}
          width={TULIP_CONFIG.cw}
          height={TULIP_CONFIG.ch}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full mix-blend-multiply"
        />
      </div>
    </div>
  );
}
