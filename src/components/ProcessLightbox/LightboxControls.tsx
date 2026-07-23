import { memo, useRef, useCallback, useEffect } from "react";
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
            className={cn(
              "h-10 w-16 flex items-center justify-center text-[10px] tracking-wider uppercase select-none font-bold text-text-primary",
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

export default LightboxControls;
