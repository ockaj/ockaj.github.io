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

function getDialogHiddenScale(custom: {
  prefersReducedMotion: boolean;
  isMobile: boolean;
}) {
  if (custom.prefersReducedMotion) return 1;
  return custom.isMobile ? 0.92 : 0.96;
}

function getDialogVisibleTransition(custom: {
  prefersReducedMotion: boolean;
  isMobile: boolean;
}) {
  if (custom.prefersReducedMotion) return { duration: 0.15 };
  return custom.isMobile ? SPRING.modalMobile : SPRING.modal;
}

const dialogVariants: Variants = {
  hidden: (custom: { prefersReducedMotion: boolean; isMobile: boolean }) => ({
    scale: getDialogHiddenScale(custom),
    opacity: 0,
    transition: custom.prefersReducedMotion ? { duration: 0.15 } : SPRING.exit,
  }),
  visible: (custom: { prefersReducedMotion: boolean; isMobile: boolean }) => ({
    scale: 1,
    opacity: 1,
    transition: getDialogVisibleTransition(custom),
  }),
};

function ProcessLightbox({ item, onClose }: Readonly<ProcessLightboxProps>) {
  const prefersReducedMotion = useReducedMotion();

  // Close lightbox on back swipe / browser back button
  useOverlay(true, onClose, `lightbox-${item.id}`);

  const isMobile = useIsMobile();
  const [isZoomed, setIsZoomed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const wasPanningRef = useRef(false);

  if (typeof document === "undefined") return null;

  let cursorStyle = "zoom-in";
  if (isZoomed) {
    cursorStyle = isPanning ? "grabbing" : "grab";
  }

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
              className="pointer-events-auto fixed inset-0 z-[90] bg-black/80 backdrop-blur-md"
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
              className="pointer-events-auto fixed inset-0 z-[100] flex touch-none items-center justify-center p-0 md:p-6"
              custom={{ prefersReducedMotion, isMobile }}
              variants={dialogVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              style={{ transformOrigin: "center center" }}
              onClick={onClose}
            />
          }
        >
          <div
            className="bg-surface relative flex h-[100dvh] max-h-[100dvh] w-full max-w-7xl flex-col overflow-hidden rounded-none border-0 border-white/10 shadow-2xl md:aspect-[16/10] md:h-auto md:max-h-[85vh] md:rounded-3xl md:border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Specular sheen header overlay matching CV modal */}
            <div className="pointer-events-none absolute top-0 right-0 left-0 z-20 h-28 bg-gradient-to-b from-white/5 to-transparent" />
            {/* Full Viewport for Diagram (Responsive flex) */}
            <div
              className={cn(
                "bg-surface relative flex w-full flex-1 touch-none items-center justify-center overflow-hidden md:h-full",
                isZoomed ? "p-0" : "p-4 md:p-6",
              )}
            >
              <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={8}
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
            <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-20 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-5">
              <Dialog.Title
                id="lightbox-title"
                className="mb-1 text-sm font-semibold text-balance text-white"
              >
                {item.title}
              </Dialog.Title>
              <p className="text-xs text-pretty text-white/80">
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
