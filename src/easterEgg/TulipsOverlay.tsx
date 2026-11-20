import { motion, AnimatePresence } from "motion/react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useModal } from "../hooks/useAppNavigation";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery";
import { getBackdropTransition } from "../utils/motionVariants";
import { LiquidGlassButton } from "../components/LiquidGlass/Button";
import TulipAsciiPlayer from "./TulipAsciiPlayer";

export default function TulipsOverlay() {
  const { isOpen, close } = useModal("bpmn-process");
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <Dialog.Root
      open={isOpen}
      modal
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          close();
        }
      }}
    >
      <AnimatePresence>
        {isOpen ? (
          <Dialog.Portal keepMounted>
            <Dialog.Backdrop
              render={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: getBackdropTransition(prefersReducedMotion),
                  }}
                  exit={{
                    opacity: 0,
                    transition: getBackdropTransition(prefersReducedMotion),
                  }}
                  className="fixed inset-0 z-90 overscroll-none bg-black"
                />
              }
            />

            <Dialog.Viewport className="fixed inset-0 z-100 flex h-dvh flex-col overflow-hidden">
              <Dialog.Popup
                render={
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: 1,
                      transition: getBackdropTransition(prefersReducedMotion),
                    }}
                    exit={{
                      opacity: 0,
                      transition: getBackdropTransition(prefersReducedMotion),
                    }}
                    className="relative flex size-full touch-manipulation flex-col justify-between overflow-hidden overscroll-none bg-black text-text-primary select-none"
                    style={{
                      WebkitTapHighlightColor: "transparent",
                    }}
                  />
                }
              >
                <Dialog.Description className="sr-only">
                  ASCII animácia rozkvitajúcich tulipánov s odkazom: Ľúbim ťa
                  Nikolka
                </Dialog.Description>

                {/* Floating close button */}
                <div
                  className="pointer-events-auto absolute top-0 right-0 z-30 p-4 sm:p-6"
                  style={{
                    paddingTop: "max(1rem, env(safe-area-inset-top, 0px))",
                    paddingRight: "max(1rem, env(safe-area-inset-right, 0px))",
                  }}
                >
                  <Dialog.Close
                    render={
                      <LiquidGlassButton
                        ariaLabel="Zatvoriť"
                        className="size-11 p-0 text-white"
                      >
                        <X className="size-5" />
                      </LiquidGlassButton>
                    }
                  />
                </div>

                {/* Upper Headline */}
                <div className="pointer-events-none relative z-20 flex shrink-0 flex-col items-center justify-center px-6 pt-28 pb-4 text-center sm:pt-32 md:pt-28">
                  <Dialog.Title
                    render={
                      <h1
                        className="text-center text-5xl font-normal tracking-tight text-white italic drop-shadow-2xl sm:text-7xl md:text-8xl"
                        style={{
                          fontFamily: '"Libre Caslon Condensed", serif',
                          lineHeight: 1.15,
                          textShadow: "0 0 40px rgba(244, 114, 182, 0.4)",
                        }}
                      >
                        Ľúbim ťa Nikolka
                      </h1>
                    }
                  />
                </div>

                {/* Tulips growing from bottom */}
                <div className="relative z-10 flex min-h-0 w-full flex-1 items-end justify-center overflow-hidden pb-0">
                  <TulipAsciiPlayer className="size-full" />
                </div>
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
