import { useState, useRef, memo } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { motion, useReducedMotion, Variants } from "motion/react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useOverlay } from "../../hooks/useAppNavigation";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { SPRING } from "../../utils/springConfig";
import { cn } from "../../utils/cn";
import ZoomableImage from "./ZoomableImage";
import ZoomClickArea from "./ZoomClickArea";
import LightboxControls from "./LightboxControls";

interface ProcessLightboxProps {
  item: {
    id: number;
    title: string;
    description: string;
    image: string;
    type: string;
  };
  onClose: () => void;
}

const backdropVariants: Variants = {
  hidden: (custom: { prefersReducedMotion: boolean; isMobile: boolean }) => ({
    opacity: 0,
    transition: custom.prefersReducedMotion ? { duration: 0.15 } : SPRING.exit,
  }),
  visible: (custom: { prefersReducedMotion: boolean; isMobile: boolean }) => ({
    opacity: 1,
    transition: custom.prefersReducedMotion ? { duration: 0.15 } : SPRING.modal,
  }),
};

const dialogVariants: Variants = {
  hidden: (custom: { prefersReducedMotion: boolean; isMobile: boolean }) => ({
    scale: custom.prefersReducedMotion ? 1 : custom.isMobile ? 0.92 : 0.96,
    opacity: 0,
    transition: custom.prefersReducedMotion ? { duration: 0.15 } : SPRING.exit,
  }),
  visible: (custom: { prefersReducedMotion: boolean; isMobile: boolean }) => ({
    scale: 1,
    opacity: 1,
    transition: custom.prefersReducedMotion
      ? { duration: 0.15 }
      : custom.isMobile
        ? SPRING.modalMobile
        : SPRING.modal,
  }),
};

function ProcessLightbox({ item, onClose }: ProcessLightboxProps) {
  const prefersReducedMotion = useReducedMotion();

  // Close lightbox on back swipe / browser back button
  useOverlay(true, onClose, `lightbox-${item.id}`);

  const isMobile = useIsMobile();
  const [isZoomed, setIsZoomed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const wasPanningRef = useRef(false);

  if (typeof document === "undefined") return null;

  const cursorStyle = isZoomed ? (isPanning ? "grabbing" : "grab") : "zoom-in";

  return (
    <Dialog.Root
      open
      modal
      disablePointerDismissal
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <Dialog.Portal keepMounted>
        {/* Backdrop */}
        <Dialog.Backdrop
          onClick={onClose}
          render={
            <motion.div
              className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md pointer-events-auto"
              custom={{ prefersReducedMotion, isMobile }}
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            />
          }
        />

        {/* Modal Popup Container */}
        <Dialog.Popup
          render={
            <motion.div
              className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 touch-none pointer-events-auto"
              custom={{ prefersReducedMotion, isMobile }}
              variants={dialogVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={onClose}
            />
          }
        >
          <div
            className="relative max-w-7xl w-full h-[100dvh] md:h-auto md:aspect-[16/10] max-h-[100dvh] md:max-h-[85vh] rounded-none md:rounded-3xl overflow-hidden border-0 md:border border-white/10 flex flex-col bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Specular sheen header overlay matching CV modal */}
            <div className="absolute top-0 left-0 right-0 h-28 pointer-events-none bg-gradient-to-b from-white/5 to-transparent z-20" />
            {/* Full Viewport for Diagram (Responsive flex) */}
            <div
              className={cn(
                "flex-1 md:h-full w-full bg-surface overflow-hidden flex items-center justify-center relative touch-none",
                isZoomed ? "p-0" : "p-4 md:p-6",
              )}
            >
              <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={6}
                centerOnInit
                centerZoomedOut
                smooth
                disablePadding
                doubleClick={{ disabled: true }}
                wheel={{ step: 0.00125 }}
                zoomAnimation={{ disabled: true }}
                onTransform={(_ref, state) => {
                  const zoomed = state.scale > 1.01;
                  if (zoomed !== isZoomed) {
                    setIsZoomed(zoomed);
                  }
                }}
                onPanningStart={() => {
                  setIsPanning(true);
                  wasPanningRef.current = false;
                }}
                onPanning={() => {
                  wasPanningRef.current = true;
                }}
                onPanningStop={() => setIsPanning(false)}
              >
                {/* Floating Island Control Panel inside context to use useControls */}
                <LightboxControls
                  isMobile={isMobile}
                  isZoomed={isZoomed}
                  onClose={onClose}
                />

                <TransformComponent
                  wrapperStyle={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: cursorStyle,
                  }}
                  contentStyle={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: cursorStyle,
                  }}
                >
                  <ZoomClickArea
                    isZoomed={isZoomed}
                    isPanning={isPanning}
                    wasPanningRef={wasPanningRef}
                  >
                    <ZoomableImage
                      src={item.image}
                      alt={item.title}
                      isZoomed={isZoomed}
                      isPanning={isPanning}
                    />
                  </ZoomClickArea>
                </TransformComponent>
              </TransformWrapper>
            </div>

            {/* Bottom text info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-20 pointer-events-none">
              <Dialog.Title
                id="lightbox-title"
                className="text-sm font-semibold text-white mb-1 text-balance"
              >
                {item.title}
              </Dialog.Title>
              <p className="text-xs text-white/80 text-pretty">
                {item.description}
              </p>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default memo(ProcessLightbox);
