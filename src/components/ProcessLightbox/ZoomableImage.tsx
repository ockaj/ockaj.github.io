import { memo } from "react";

interface ZoomableImageProps {
  src: string;
  alt: string;
}

const ZoomableImage = memo(function ZoomableImage({
  src,
  alt,
}: ZoomableImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className="pointer-events-auto max-h-full max-w-full cursor-zoom-in touch-none rounded-lg border border-white/5 bg-white object-contain p-2 shadow-2xl outline outline-1 -outline-offset-1 outline-white/[0.08] select-none group-data-[zoomed=true]:cursor-grab group-data-[zoomed=true]:active:cursor-grabbing md:rounded-xl md:p-6"
      draggable={false}
    />
  );
});

export default ZoomableImage;
