import { memo } from "react";
import { useControls } from "react-zoom-pan-pinch";

interface ZoomClickAreaProps {
  children: React.ReactNode;
  isZoomed: boolean;
  isPanning: boolean;
  wasPanningRef: { current: boolean };
}

const ZoomClickArea = memo(function ZoomClickArea({
  children,
  isZoomed,
  isPanning,
  wasPanningRef,
}: ZoomClickAreaProps) {
  const { resetTransform, centerView } = useControls();
  let cursorStyle = "zoom-in";
  if (isZoomed) {
    cursorStyle = isPanning ? "grabbing" : "grab";
  }

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
      className="focus-visible:ring-accent m-0 flex h-full w-full items-center justify-center border-0 bg-transparent p-0 focus-visible:ring-2 focus-visible:outline-none"
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

export default ZoomClickArea;
