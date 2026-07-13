import { useState, useEffect, useRef, memo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion, Variants } from "motion/react";
import { X, Plus, Minus } from "lucide-react";
import {
  TransformWrapper,
  TransformComponent,
  useControls,
  useTransformEffect,
} from "react-zoom-pan-pinch";
import { LiquidGlass, LiquidGlassButton } from "./LiquidGlass/LiquidGlass";
import { useModalHistory } from "../hooks/useModalHistory";
import { useIsMobile } from "../hooks/useMediaQuery";
import { SPRING } from "../utils/springConfig";
import FocusLock from "react-focus-lock";

interface ProcessLightboxProps {
  item: {
    id: number;
    title: string;
    description: string;
    image: string;
    type: string;
  };
  onClose: () => void;
}

// Sub-component for the image to isolate scale updates and cursor states
const ZoomableImage = memo(function ZoomableImage({
  src,
  alt,
  isZoomed,
  isPanning,
}: {
  src: string;
  alt: string;
  isZoomed: boolean;
  isPanning: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        cursor: isZoomed ? (isPanning ? "grabbing" : "grab") : "zoom-in",
      }}
      className={`max-w-full max-h-full object-contain select-none pointer-events-auto bg-white shadow-2xl border border-white/5 touch-none ${
        isZoomed
          ? "p-0 rounded-none border-none"
          : "p-2 md:p-6 rounded-lg md:rounded-xl"
      }`}
      draggable={false}
    />
  );
});

// Click area that toggles zoom between 100% and 250% on clean clicks (not drags)
const ZoomClickArea = memo(function ZoomClickArea({
  children,
  isZoomed,
  isPanning,
  wasPanningRef,
}: {
  children: React.ReactNode;
  isZoomed: boolean;
  isPanning: boolean;
  wasPanningRef: { current: boolean };
}) {
  const { resetTransform, centerView } = useControls();
  const cursorStyle = isZoomed ? (isPanning ? "grabbing" : "grab") : "zoom-in";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (wasPanningRef.current) return;
      if (isZoomed) {
        resetTransform(200);
      } else {
        centerView(2.5, 200);
      }
    }
  };

  return (
    <button
      type="button"
      aria-label="Toggle Zoom"
      style={{ cursor: cursorStyle }}
      className="w-full h-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent bg-transparent border-0 p-0 m-0"
      onClick={(e) => {
        e.stopPropagation();
        if (wasPanningRef.current) return;
        if (isZoomed) {
          resetTransform(200);
        } else {
          centerView(2.5, 200);
        }
      }}
      onKeyDown={handleKeyDown}
    >
      {children}
    </button>
  );
});

// Sub-component for controls to isolate render cycles from the rest of the lightbox
const LightboxControls = memo(function LightboxControls({
  isMobile,
  isZoomed,
  onClose,
}: {
  isMobile: boolean;
  isZoomed: boolean;
  onClose: () => void;
}) {
  const scaleTextRef = useRef<HTMLSpanElement>(null);
  const { zoomIn, zoomOut, resetTransform } = useControls();
  const isHoveredRef = useRef(false);
  const currentScaleRef = useRef(1);

  const updateText = useCallback(() => {
    if (!scaleTextRef.current) return;
    const scaleVal = currentScaleRef.current;
    const zoomed = scaleVal > 1.01;

    if (zoomed) {
      if (isMobile) {
        scaleTextRef.current.innerText = "Reset";
      } else {
        scaleTextRef.current.innerText = isHoveredRef.current
          ? "Reset"
          : `${Math.round(scaleVal * 100)}%`;
      }
    } else {
      scaleTextRef.current.innerText = `${Math.round(scaleVal * 100)}%`;
    }
  }, [isMobile]);

  useTransformEffect(({ state }) => {
    currentScaleRef.current = state.scale;
    updateText();
  });

  useEffect(() => {
    updateText();
  }, [isMobile, updateText]);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 z-[60]">
      <div className="inline-flex items-center gap-1.5 bg-surface/80 backdrop-blur-md border border-white/10 p-[6px] rounded-full shadow-2xl select-none">
        {/* Scale / Reset */}
        <span
          className="inline-flex"
          onMouseEnter={() => {
            isHoveredRef.current = true;
            updateText();
          }}
          onMouseLeave={() => {
            isHoveredRef.current = false;
            updateText();
          }}
        >
          <LiquidGlass
            as={isZoomed ? "button" : "span"}
            roundedClass="rounded-full"
            interactive={isZoomed}
            springScale={isZoomed}
            className={`h-10 w-16 flex items-center justify-center text-[10px] tracking-wider uppercase select-none font-bold text-text-primary ${
              isZoomed
                ? "pointer-events-auto cursor-pointer"
                : "pointer-events-none cursor-default"
            }`}
            onClick={isZoomed ? () => resetTransform() : undefined}
            magnetic={isZoomed}
            magneticStrength={0.04}
          >
            <span ref={scaleTextRef}>100%</span>
          </LiquidGlass>
        </span>

        {/* Zoom In */}
        <LiquidGlassButton
          onClick={() => zoomIn(0.15, 0)}
          disabled={false}
          magnetic
          magneticStrength={0.04}
          roundedClass="rounded-full"
          className="size-11 p-0 flex items-center justify-center text-text-primary"
          ariaLabel="Zoom In"
        >
          <Plus size={14} />
        </LiquidGlassButton>

        {/* Zoom Out */}
        <LiquidGlassButton
          onClick={() => zoomOut(0.15, 0)}
          disabled={!isZoomed}
          magnetic={isZoomed}
          magneticStrength={0.04}
          roundedClass="rounded-full"
          className="size-11 p-0 flex items-center justify-center text-text-primary disabled:opacity-40 disabled:pointer-events-none"
          ariaLabel="Zoom Out"
        >
          <Minus size={14} />
        </LiquidGlassButton>

        {/* Separator */}
        <div className="w-px h-4 bg-white/10 mx-0.5" />

        {/* Close */}
        <LiquidGlassButton
          onClick={onClose}
          ariaLabel="Close lightbox"
          magnetic
          magneticStrength={0.04}
          roundedClass="rounded-full"
          className="size-11 p-0 flex items-center justify-center text-text-primary"
        >
          <X size={14} />
        </LiquidGlassButton>
      </div>
    </div>
  );
});

const backdropVariants: Variants = {
  hidden: (custom: { prefersReducedMotion: boolean; isMobile: boolean }) => ({
    opacity: 0,
    transition: custom.prefersReducedMotion
      ? { duration: 0.15 }
      : { duration: custom.isMobile ? 0.35 : 0.2, ease: "easeOut" },
  }),
  visible: (custom: { prefersReducedMotion: boolean; isMobile: boolean }) => ({
    opacity: 1,
    transition: custom.prefersReducedMotion
      ? { duration: 0.15 }
      : { duration: custom.isMobile ? 0.45 : 0.3, ease: "easeOut" },
  }),
};

const dialogVariants: Variants = {
  hidden: (custom: { prefersReducedMotion: boolean; isMobile: boolean }) => ({
    scale: custom.prefersReducedMotion ? 1 : custom.isMobile ? 0.92 : 0.96,
    opacity: 0,
    transition: custom.prefersReducedMotion
      ? { duration: 0.15 }
      : custom.isMobile
        ? SPRING.modalMobile
        : { duration: 0.18, ease: "easeOut" as const },
  }),
  visible: (custom: { prefersReducedMotion: boolean; isMobile: boolean }) => ({
    scale: 1,
    opacity: 1,
    transition: custom.prefersReducedMotion
      ? { duration: 0.15 }
      : custom.isMobile
        ? SPRING.modalMobile
        : SPRING.modal,
  }),
};

function ProcessLightbox({ item, onClose }: ProcessLightboxProps) {
  const prefersReducedMotion = useReducedMotion();

  // Close lightbox on back swipe / browser back button
  useModalHistory(true, onClose);

  const isMobile = useIsMobile();
  const [isZoomed, setIsZoomed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const wasPanningRef = useRef(false);

  if (typeof document === "undefined") return null;

  const cursorStyle = isZoomed ? (isPanning ? "grabbing" : "grab") : "zoom-in";

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-none md:backdrop-blur-sm p-0 md:p-6 touch-none"
      style={{ touchAction: "none" }}
      custom={{ prefersReducedMotion, isMobile }}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lightbox-title"
        className="relative max-w-7xl w-full h-[100dvh] md:h-auto md:aspect-[16/10] max-h-[100dvh] md:max-h-[85vh] rounded-none md:rounded-3xl overflow-hidden border-0 md:border border-white/10 flex flex-col bg-surface"
        custom={{ prefersReducedMotion, isMobile }}
        variants={dialogVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <FocusLock
          returnFocus
          className="w-full h-full flex flex-col justify-between"
        >
          {/* Full Viewport for Diagram (Responsive flex) */}
          <div
            className={`flex-1 md:h-full w-full bg-surface overflow-hidden flex items-center justify-center relative touch-none ${
              isZoomed ? "p-0" : "p-4 md:p-6"
            }`}
          >
            <TransformWrapper
              initialScale={1}
              minScale={1}
              maxScale={6}
              centerOnInit
              centerZoomedOut
              smooth
              disablePadding
              doubleClick={{ disabled: true }}
              wheel={{ step: 0.00125 }}
              zoomAnimation={{ disabled: true }}
              onTransform={(_ref, state) => {
                const zoomed = state.scale > 1.01;
                if (zoomed !== isZoomed) {
                  setIsZoomed(zoomed);
                }
              }}
              onPanningStart={() => {
                setIsPanning(true);
                wasPanningRef.current = false;
              }}
              onPanning={() => {
                wasPanningRef.current = true;
              }}
              onPanningStop={() => setIsPanning(false)}
            >
              {/* Floating Island Control Panel inside context to use useControls */}
              <LightboxControls
                isMobile={isMobile}
                isZoomed={isZoomed}
                onClose={onClose}
              />

              <TransformComponent
                wrapperStyle={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: cursorStyle,
                }}
                contentStyle={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: cursorStyle,
                }}
              >
                <ZoomClickArea
                  isZoomed={isZoomed}
                  isPanning={isPanning}
                  wasPanningRef={wasPanningRef}
                >
                  <ZoomableImage
                    src={item.image}
                    alt={item.title}
                    isZoomed={isZoomed}
                    isPanning={isPanning}
                  />
                </ZoomClickArea>
              </TransformComponent>
            </TransformWrapper>
          </div>

          {/* Bottom text info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-20 pointer-events-none">
            <p
              id="lightbox-title"
              className="text-sm font-semibold text-white mb-1 text-balance"
            >
              {item.title}
            </p>
            <p className="text-xs text-white/80 text-pretty">
              {item.description}
            </p>
          </div>
        </FocusLock>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

export default memo(ProcessLightbox);
