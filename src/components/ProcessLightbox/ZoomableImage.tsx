import { memo } from "react";
import { cn } from "../../utils/cn";

interface ZoomableImageProps {
  src: string;
  alt: string;
  isZoomed: boolean;
  isPanning: boolean;
}

const ZoomableImage = memo(function ZoomableImage({
  src,
  alt,
  isZoomed,
  isPanning,
}: ZoomableImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        cursor: isZoomed ? (isPanning ? "grabbing" : "grab") : "zoom-in",
      }}
      className={cn(
        "max-w-full max-h-full object-contain select-none pointer-events-auto bg-white shadow-2xl border border-white/5 touch-none",
        isZoomed
          ? "p-0 rounded-none border-none"
          : "p-2 md:p-6 rounded-lg md:rounded-xl",
      )}
      draggable={false}
    />
  );
});

export default ZoomableImage;
