import { useRef, memo } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { motion, useReducedMotion, Variants } from "motion/react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useOverlay } from "../../hooks/useAppNavigation";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { SPRING } from "../../utils/springConfig";
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

const DOUBLE_CLICK_CONFIG = { disabled: true };
const WHEEL_CONFIG = { step: 0.00125 };
const ZOOM_ANIMATION_CONFIG = { disabled: true };
const TRANSFORM_CONTAINER_STYLE: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};
const DIALOG_POPUP_STYLE: React.CSSProperties = {
  transformOrigin: "center center",
};

function ProcessLightbox({ item, onClose }: Readonly<ProcessLightboxProps>) {
  const prefersReducedMotion = useReducedMotion();

  // Close lightbox on back swipe / browser back button
  useOverlay(true, onClose, `lightbox-${item.id}`);

  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const wasPanningRef = useRef(false);

  if (typeof document === "undefined") return null;

  return (
    <Dialog.Root
      open
      modal
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <Dialog.Portal keepMounted>
        <div className="fixed inset-0 z-[100] flex touch-none items-center justify-center p-0 md:p-6">
          {/* Backdrop */}
          <Dialog.Backdrop
            onClick={onClose}
            render={
              <motion.div
                className="pointer-events-auto fixed inset-0 bg-black/80 backdrop-blur-md"
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
                className="bg-surface relative z-10 flex h-[100dvh] max-h-[100dvh] w-full max-w-7xl flex-col overflow-hidden rounded-none border-0 border-white/10 shadow-2xl md:aspect-[16/10] md:h-auto md:max-h-[85vh] md:rounded-3xl md:border"
                custom={{ prefersReducedMotion, isMobile }}
                variants={dialogVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                style={DIALOG_POPUP_STYLE}
              />
            }
          >
            {/* Specular sheen header overlay matching CV modal */}
            <div className="pointer-events-none absolute top-0 right-0 left-0 z-20 h-28 bg-gradient-to-b from-white/5 to-transparent" />
            {/* Full Viewport for Diagram (Responsive flex) */}
            <div
              ref={containerRef}
              data-zoomed="false"
              className="bg-surface group relative flex w-full flex-1 cursor-zoom-in touch-none items-center justify-center overflow-hidden p-0 data-[zoomed=true]:cursor-grab data-[zoomed=true]:active:cursor-grabbing md:h-full"
            >
              <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={8}
                centerOnInit
                centerZoomedOut
                smooth
                disablePadding
                doubleClick={DOUBLE_CLICK_CONFIG}
                wheel={WHEEL_CONFIG}
                zoomAnimation={ZOOM_ANIMATION_CONFIG}
                onTransform={(_ref, state) => {
                  const zoomed = state.scale > 1.01;
                  if (
                    containerRef.current &&
                    (containerRef.current.dataset.zoomed === "true") !== zoomed
                  ) {
                    containerRef.current.dataset.zoomed = String(zoomed);
                  }
                }}
                onPanningStart={() => {
                  wasPanningRef.current = false;
                }}
                onPanning={() => {
                  wasPanningRef.current = true;
                }}
              >
                {/* Floating Island Control Panel inside context to use useControls */}
                <LightboxControls isMobile={isMobile} onClose={onClose} />

                <TransformComponent
                  wrapperClass="w-full h-full flex justify-center items-center cursor-zoom-in group-data-[zoomed=true]:cursor-grab group-data-[zoomed=true]:active:cursor-grabbing"
                  contentClass="w-full h-full flex justify-center items-center cursor-zoom-in group-data-[zoomed=true]:cursor-grab group-data-[zoomed=true]:active:cursor-grabbing"
                  wrapperStyle={TRANSFORM_CONTAINER_STYLE}
                  contentStyle={TRANSFORM_CONTAINER_STYLE}
                >
                  <ZoomClickArea wasPanningRef={wasPanningRef}>
                    <ZoomableImage src={item.image} alt={item.title} />
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
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default memo(ProcessLightbox);
