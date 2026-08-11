import { memo, useRef, useCallback, useEffect } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useControls, useTransformEffect } from "react-zoom-pan-pinch";
import { Plus, Minus, X } from "lucide-react";
import { LiquidGlass, LiquidGlassButton } from "../LiquidGlass/LiquidGlass";
import { cn } from "../../utils/cn";

interface LightboxControlsProps {
  isMobile: boolean;
  isZoomed: boolean;
  onClose: () => void;
}

const LightboxControls = memo(function LightboxControls({
  isMobile,
  isZoomed,
  onClose,
}: LightboxControlsProps) {
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
    <div className="absolute top-4 left-1/2 z-[60] -translate-x-1/2 md:right-4 md:left-auto md:translate-x-0">
      <div className="bg-surface/80 inline-flex items-center gap-1.5 rounded-full border border-white/10 p-[6px] shadow-2xl backdrop-blur-md select-none">
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
            className={cn(
              "text-text-primary flex h-10 w-16 items-center justify-center text-xs font-bold tracking-wider uppercase select-none",
              isZoomed
                ? "pointer-events-auto cursor-pointer"
                : "pointer-events-none cursor-default",
            )}
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
          className="text-text-primary flex size-11 items-center justify-center p-0"
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
