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
  const cursorStyle = isZoomed ? (isPanning ? "grabbing" : "grab") : "zoom-in";

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
      className="w-full h-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent bg-transparent border-0 p-0 m-0"
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
