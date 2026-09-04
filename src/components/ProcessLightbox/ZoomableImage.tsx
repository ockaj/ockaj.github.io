import { memo } from "react";
import { useControls, useTransformContext } from "react-zoom-pan-pinch";

interface ZoomableImageProps {
  src: string;
  alt: string;
  wasPanningRef: { current: boolean };
}

const ZoomableImage = memo(function ZoomableImage({
  src,
  alt,
  wasPanningRef,
}: ZoomableImageProps) {
  const { resetTransform, centerView } = useControls();
  const libraryContext = useTransformContext();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (wasPanningRef.current) return;
      const isZoomed = libraryContext.state.scale > 1.01;
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
      className="focus-visible:ring-accent m-0 flex h-full w-full cursor-zoom-in items-center justify-center border-0 bg-transparent p-0 group-data-[zoomed=true]:cursor-grab focus-visible:ring-2 focus-visible:outline-none group-data-[zoomed=true]:active:cursor-grabbing"
      onClick={(e) => {
        e.stopPropagation();
        if (wasPanningRef.current) return;
        const isZoomed = libraryContext.state.scale > 1.01;
        if (isZoomed) {
          resetTransform(200);
        } else {
          centerView(2.5, 200);
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <img
        src={src}
        alt={alt}
        className="pointer-events-auto max-h-full max-w-full cursor-zoom-in touch-none rounded-lg border border-white/5 bg-white object-contain p-2 shadow-2xl outline outline-1 -outline-offset-1 outline-white/[0.08] select-none group-data-[zoomed=true]:cursor-grab group-data-[zoomed=true]:active:cursor-grabbing md:rounded-xl md:p-6"
        draggable={false}
      />
    </button>
  );
});

export default ZoomableImage;
