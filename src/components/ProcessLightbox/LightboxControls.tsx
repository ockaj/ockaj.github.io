import { memo, useRef, useCallback, useSyncExternalStore } from "react";
import { Dialog } from "@base-ui/react/dialog";
import {
  useControls,
  useTransformContext,
  useTransformEffect,
} from "react-zoom-pan-pinch";
import { Plus, Minus, X } from "lucide-react";
import { LiquidGlass, LiquidGlassButton } from "../LiquidGlass/LiquidGlass";

interface LightboxControlsProps {
  isMobile: boolean;
  onClose: () => void;
}

const LightboxControls = memo(function LightboxControls({
  isMobile,
  onClose,
}: LightboxControlsProps) {
  const libraryContext = useTransformContext();
  const scaleTextRef = useRef<HTMLSpanElement>(null);
  const { zoomIn, zoomOut, resetTransform } = useControls();
  const isHoveredRef = useRef(false);
  const currentScaleRef = useRef(1);

  const canZoomIn = useSyncExternalStore(
    libraryContext.onChange,
    () => libraryContext.state.scale < 7.99,
    () => true,
  );

  const canZoomOut = useSyncExternalStore(
    libraryContext.onChange,
    () => libraryContext.state.scale > 1.01,
    () => false,
  );

  const updateText = useCallback(() => {
    const scaleVal = currentScaleRef.current;
    const isZoomed = scaleVal > 1.01;

    if (scaleTextRef.current) {
      if (isZoomed && (isMobile || isHoveredRef.current)) {
        scaleTextRef.current.innerText = "Reset";
      } else {
        scaleTextRef.current.innerText = `${Math.round(scaleVal * 100)}%`;
      }
    }
  }, [isMobile]);

  useTransformEffect(({ state }) => {
    currentScaleRef.current = state.scale;
    updateText();
  });

  return (
    <div
      className="notranslate absolute top-4 left-1/2 z-[60] -translate-x-1/2 md:right-4 md:left-auto md:translate-x-0"
      translate="no"
    >
      <div className="bg-surface/80 inline-flex items-center gap-1.5 rounded-full border border-white/10 p-[6px] shadow-2xl backdrop-blur-md select-none">
        {/* Scale / Reset */}
        <span
          className="notranslate inline-flex"
          translate="no"
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
            as="button"
            disabled={!canZoomOut}
            roundedClass="rounded-full"
            interactive={canZoomOut}
            springScale={canZoomOut}
            className="text-text-primary notranslate flex h-10 w-16 items-center justify-center text-xs font-bold tracking-wider uppercase transition-opacity select-none disabled:pointer-events-none disabled:cursor-default disabled:opacity-40"
            onClick={() => {
              if (currentScaleRef.current > 1.01) {
                resetTransform();
              }
            }}
            magnetic={canZoomOut}
            magneticStrength={0.04}
          >
            <span ref={scaleTextRef} className="notranslate" translate="no">
              100%
            </span>
          </LiquidGlass>
        </span>

        {/* Zoom In */}
        <LiquidGlassButton
          onClick={() => zoomIn(0.15, 0)}
          disabled={!canZoomIn}
          magnetic={canZoomIn}
          magneticStrength={0.04}
          roundedClass="rounded-full"
          className="text-text-primary flex size-11 items-center justify-center p-0 transition-opacity disabled:pointer-events-none disabled:opacity-40"
          ariaLabel="Zoom In"
        >
          <Plus size={14} />
        </LiquidGlassButton>

        {/* Zoom Out */}
        <LiquidGlassButton
          onClick={() => zoomOut(0.15, 0)}
          disabled={!canZoomOut}
          magnetic={canZoomOut}
          magneticStrength={0.04}
          roundedClass="rounded-full"
          className="text-text-primary flex size-11 items-center justify-center p-0 transition-opacity disabled:pointer-events-none disabled:opacity-40"
          ariaLabel="Zoom Out"
        >
          <Minus size={14} />
        </LiquidGlassButton>

        {/* Separator */}
        <div className="mx-0.5 h-4 w-px bg-white/10" />

        {/* Close */}
        <Dialog.Close
          render={
            <LiquidGlassButton
              onClick={onClose}
              ariaLabel="Close lightbox"
              magnetic
              magneticStrength={0.04}
              roundedClass="rounded-full"
              className="text-text-primary flex size-11 items-center justify-center p-0"
            >
              <X size={14} />
            </LiquidGlassButton>
          }
        />
      </div>
    </div>
  );
});

export default LightboxControls;
