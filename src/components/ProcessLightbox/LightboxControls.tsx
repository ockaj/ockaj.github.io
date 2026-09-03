import { memo, useRef, useCallback, useEffect } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useControls, useTransformEffect } from "react-zoom-pan-pinch";
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
  const scaleTextRef = useRef<HTMLSpanElement>(null);
  const zoomOutBtnRef = useRef<HTMLButtonElement>(null);
  const resetBtnRef = useRef<HTMLButtonElement>(null);
  const { zoomIn, zoomOut, resetTransform } = useControls();
  const isHoveredRef = useRef(false);
  const currentScaleRef = useRef(1);

  const updateControls = useCallback(() => {
    const scaleVal = currentScaleRef.current;
    const zoomed = scaleVal > 1.01;

    if (scaleTextRef.current) {
      if (zoomed && (isMobile || isHoveredRef.current)) {
        scaleTextRef.current.innerText = "Reset";
      } else {
        scaleTextRef.current.innerText = `${Math.round(scaleVal * 100)}%`;
      }
    }

    if (resetBtnRef.current) {
      resetBtnRef.current.dataset.zoomed = String(zoomed);
    }

    if (zoomOutBtnRef.current) {
      zoomOutBtnRef.current.disabled = !zoomed;
    }
  }, [isMobile]);

  const handleTransform = useCallback(
    ({ state }: { state: { scale: number } }) => {
      currentScaleRef.current = state.scale;
      updateControls();
    },
    [updateControls],
  );

  useTransformEffect(handleTransform);

  useEffect(() => {
    updateControls();
  }, [updateControls]);

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
            updateControls();
          }}
          onMouseLeave={() => {
            isHoveredRef.current = false;
            updateControls();
          }}
        >
          <LiquidGlass
            ref={resetBtnRef}
            as="button"
            data-zoomed="false"
            roundedClass="rounded-full"
            interactive
            springScale
            className="text-text-primary notranslate pointer-events-none flex h-10 w-16 cursor-default items-center justify-center text-xs font-bold tracking-wider uppercase opacity-80 transition-opacity select-none data-[zoomed=true]:pointer-events-auto data-[zoomed=true]:cursor-pointer data-[zoomed=true]:opacity-100"
            onClick={() => {
              if (currentScaleRef.current > 1.01) {
                resetTransform();
              }
            }}
            magnetic
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
          disabled={false}
          magnetic
          magneticStrength={0.04}
          roundedClass="rounded-full"
          className="text-text-primary flex size-11 items-center justify-center p-0"
          ariaLabel="Zoom In"
        >
          <Plus size={14} />
        </LiquidGlassButton>

        {/* Zoom Out */}
        <LiquidGlassButton
          ref={zoomOutBtnRef}
          onClick={() => zoomOut(0.15, 0)}
          disabled
          magnetic
          magneticStrength={0.04}
          roundedClass="rounded-full"
          className="text-text-primary flex size-11 items-center justify-center p-0 disabled:pointer-events-none disabled:opacity-40"
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
