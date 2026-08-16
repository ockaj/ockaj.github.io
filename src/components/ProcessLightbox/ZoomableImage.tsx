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
  let cursorStyle = "zoom-in";
  if (isZoomed) {
    cursorStyle = isPanning ? "grabbing" : "grab";
  }

  return (
    <img
      src={src}
      alt={alt}
      style={{
        cursor: cursorStyle,
      }}
      className={cn(
        "pointer-events-auto max-h-full max-w-full touch-none border border-white/5 bg-white object-contain shadow-2xl outline outline-1 -outline-offset-1 outline-white/[0.08] select-none",
        isZoomed
          ? "rounded-none border-none p-0 outline-none"
          : "rounded-lg p-2 md:rounded-xl md:p-6",
      )}
      draggable={false}
    />
  );
});

export default ZoomableImage;
