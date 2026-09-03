import { memo } from "react";
import { useControls, useTransformContext } from "react-zoom-pan-pinch";

interface ZoomClickAreaProps {
  children: React.ReactNode;
  wasPanningRef: { current: boolean };
}

const ZoomClickArea = memo(function ZoomClickArea({
  children,
  wasPanningRef,
}: ZoomClickAreaProps) {
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
      {children}
    </button>
  );
});

export default ZoomClickArea;
