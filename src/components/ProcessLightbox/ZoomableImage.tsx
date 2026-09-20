import { memo } from "react";
import { useControls, useTransformContext } from "react-zoom-pan-pinch";

interface ZoomableImageProps {
  src: string;
  alt: string;
}

const ZoomableImage = memo(function ZoomableImage({
  src,
  alt,
}: ZoomableImageProps) {
  const { resetTransform, centerView } = useControls();
  const libraryContext = useTransformContext();

  const toggleZoom = () => {
    const isZoomed = libraryContext.state.scale > 1.01;
    if (isZoomed) {
      resetTransform(200);
    } else {
      centerView(2.5, 200);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleZoom();
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.detail === 0) {
      toggleZoom();
    }
  };

  return (
    <button
      type="button"
      aria-label="Toggle Zoom"
      className="m-0 flex size-full cursor-default items-center justify-center border-0 bg-transparent px-4 py-16 group-data-[zoomed=true]:cursor-grab focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none group-data-[zoomed=true]:active:cursor-grabbing md:px-16 md:py-20"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <img
        src={src}
        alt={alt}
        className="pointer-events-auto max-h-full max-w-full cursor-default touch-none rounded-lg border border-white/5 bg-white object-contain p-3 shadow-2xl outline-1 -outline-offset-1 outline-white/8 select-none group-data-[zoomed=true]:cursor-grab group-data-[zoomed=true]:active:cursor-grabbing md:rounded-xl md:p-8"
        draggable={false}
      />
    </button>
  );
});

export default ZoomableImage;
