import { useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useModal } from "../hooks/useAppNavigation";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery";
import { LiquidGlassButton } from "../components/LiquidGlass/Button";
import TulipAsciiPlayer from "./TulipAsciiPlayer";

const TulipsOverlay = memo(function TulipsOverlay() {
  const { isOpen, close } = useModal("bpmn-process");
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleKeyDown = useCallback(
    (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    },
    [close],
  );

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Tulips"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.3 }}
          className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-black text-text-primary overscroll-none select-none touch-manipulation"
          style={{
            height: "100dvh",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {/* Accessible Screen Reader Announcement */}
          <div className="sr-only" aria-live="polite">
            ASCII animácia rozkvitajúcich tulipánov s odkazom: Ľúbim ťa nikolka
          </div>

          {/* Floating close button */}
          <div
            className="pointer-events-auto absolute top-0 right-0 z-30 p-4 sm:p-6"
            style={{
              paddingTop: "max(1rem, env(safe-area-inset-top, 0px))",
              paddingRight: "max(1rem, env(safe-area-inset-right, 0px))",
            }}
          >
            <LiquidGlassButton
              onClick={close}
              aria-label="Zatvoriť"
              className="flex size-11 min-h-11 min-w-11 items-center justify-center rounded-full text-white active:scale-95 touch-manipulation"
            >
              <X className="size-5" />
            </LiquidGlassButton>
          </div>

          {/* Upper Headline: Natural, harmonious position with comfortable space on phones and PC */}
          <div className="pointer-events-none relative z-20 flex shrink-0 flex-col items-center justify-center px-6 pt-[26vh] sm:pt-[18vh] md:pt-[15vh] pb-4 text-center">
            <h1
              className="text-center font-normal italic tracking-tight text-white drop-shadow-2xl text-5xl sm:text-7xl md:text-8xl"
              style={{
                fontFamily: '"Libre Caslon Condensed", serif',
                lineHeight: 1.15,
                textShadow: "0 0 40px rgba(244, 114, 182, 0.4)",
              }}
            >
              Ľúbim ťa nikolka
            </h1>
          </div>

          {/* Tulips growing from bottom: expands to all available height and scales up on big screens */}
          <div className="relative z-10 flex min-h-0 flex-1 w-full items-end justify-center overflow-hidden pb-0">
            <TulipAsciiPlayer className="size-full" />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
});

export default TulipsOverlay;
