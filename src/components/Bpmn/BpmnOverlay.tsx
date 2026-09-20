import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { LiquidGlassButton } from "../LiquidGlass/LiquidGlass";
import BpmnHotkeyToast from "./BpmnHotkeyToast";
import BpmnDiagram from "./BpmnDiagram";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { navigateTo, useModal } from "../../hooks/useAppNavigation";
import { SPRING } from "../../utils/springConfig";
import { createModalVariants } from "../../utils/motionVariants";

const bpmnModalVariants = createModalVariants(15);

const BPMN_KEYS = new Set(["b", "p", "m", "n"]);

export default function BpmnOverlay() {
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const { isOpen, open, close } = useModal("bpmn");
  const typedBufferRef = useRef<string[]>([]);
  const [showHotkeyTip, setShowHotkeyTip] = useState(false);
  const [hasDismissedTip, setHasDismissedTip] = useState(() => {
    return (
      typeof window !== "undefined" &&
      sessionStorage.getItem("bpmn_tip_dismissed") === "true"
    );
  });

  // Keyboard shortcut listener for 'B-P-M-N'
  useEffect(() => {
    if (isMobile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keypresses in input fields or textareas
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (BPMN_KEYS.has(key)) {
        typedBufferRef.current = [...typedBufferRef.current, key].slice(-4);
        if (typedBufferRef.current.join("") === "bpmn") {
          open();
          typedBufferRef.current = [];
          setShowHotkeyTip(false);
          setHasDismissedTip(true);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("bpmn_tip_dismissed", "true");
          }
        }
      } else {
        typedBufferRef.current = [];
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, open]);

  // Show a brief toast notification on how to trigger if user spends time on the site (once per session)
  useEffect(() => {
    if (isMobile || hasDismissedTip || isOpen) return;

    const showTipTimer = setTimeout(() => {
      setShowHotkeyTip(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("bpmn_tip_dismissed", "true");
      }
      setHasDismissedTip(true);
    }, 12000);

    return () => {
      clearTimeout(showTipTimer);
    };
  }, [isMobile, hasDismissedTip, isOpen]);

  const handleDismissToast = useCallback(() => {
    setShowHotkeyTip(false);
  }, []);

  const handleTaskClick = useCallback(
    (sectionId: string) => {
      close();
      navigateTo(sectionId);
    },
    [close],
  );

  return (
    <>
      {/* Subtle Toast Tip */}
      <AnimatePresence>
        {showHotkeyTip && !isOpen ? (
          <BpmnHotkeyToast onDismiss={handleDismissToast} />
        ) : null}
      </AnimatePresence>

      {/* Full Screen Blueprint BPMN Overlay */}
      <AnimatePresence>
        {isOpen && typeof document !== "undefined" ? (
          <Dialog.Root
            open={isOpen}
            modal
            disablePointerDismissal
            onOpenChange={(open) => {
              if (!open) {
                close();
              }
            }}
          >
            <Dialog.Portal keepMounted>
              <div className="fixed inset-0 z-120 flex items-center justify-center p-0 md:p-6 lg:p-8">
                {/* Backdrop */}
                <Dialog.Backdrop
                  onClick={close}
                  render={
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: 1,
                        transition: SPRING.modal,
                      }}
                      exit={{
                        opacity: 0,
                        transition: SPRING.exit,
                      }}
                      className="pointer-events-auto fixed inset-0 bg-black/80 backdrop-blur-md"
                    />
                  }
                />

                {/* Modal Container */}
                <Dialog.Popup
                  render={
                    <motion.div
                      custom={{ prefersReducedMotion, isMobile }}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={bpmnModalVariants}
                      className="pointer-events-auto relative z-10 flex size-full flex-col overflow-hidden rounded-none border-0 bg-surface/95 shadow-2xl backdrop-blur-2xl md:h-90vh md:max-w-85vw md:rounded-3xl md:border md:border-white/10 2xl:max-w-340"
                      style={{
                        boxShadow:
                          "inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 4px 20px rgba(0, 0, 0, 0.6)",
                      }}
                    />
                  }
                >
                  <div className="relative flex size-full flex-col">
                    {/* Specular sheen header overlay matching CV modal */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-32 bg-linear-to-b from-white/5 to-transparent" />

                    {/* Part 1: Gridless Header Area */}
                    <div className="relative z-30 flex w-full shrink-0 items-center justify-between border-b border-white/10 p-5 md:px-8 md:py-5">
                      <div>
                        <Dialog.Title className="font-display text-lg text-text-primary md:text-2xl">
                          Portfolio System Operation Blueprint
                        </Dialog.Title>
                        <p className="mt-1 max-w-xl text-sm leading-relaxed text-pretty text-muted">
                          Click any user task box in the upper lane to navigate
                          directly to that section. Press{" "}
                          <span className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono font-bold text-accent">
                            ESC
                          </span>{" "}
                          or click close to dismiss.
                        </p>
                      </div>
                      <Dialog.Close
                        render={
                          <LiquidGlassButton
                            onClick={close}
                            ariaLabel="Close model overlay"
                            className="size-10 shrink-0 p-0 md:size-11"
                          >
                            <X size={18} />
                          </LiquidGlassButton>
                        }
                      />
                    </div>

                    {/* Part 2: BPMN Diagram Core with Blueprint Grid */}
                    <div
                      className="custom-cv-scrollbar flex w-full flex-1 items-center justify-center overflow-auto p-4 select-none md:p-8"
                      style={{
                        backgroundImage: `
                          url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 33 L 40 47 M 33 40 L 47 40' stroke='hsla(244, 75%25, 76%25, 0.12)' stroke-width='1'/%3E%3C/svg%3E"),
                          radial-gradient(circle, hsl(var(--text) / 0.035) 0.75px, transparent 0.75px)
                        `,
                        backgroundSize: "80px 80px, 20px 20px",
                        backgroundPosition: "center, center",
                      }}
                    >
                      <div
                        className="notranslate mx-auto flex w-full max-w-7xl items-center justify-center"
                        translate="no"
                      >
                        <BpmnDiagram onTaskClick={handleTaskClick} />
                      </div>
                    </div>
                  </div>
                </Dialog.Popup>
              </div>
            </Dialog.Portal>
          </Dialog.Root>
        ) : null}
      </AnimatePresence>
    </>
  );
}
