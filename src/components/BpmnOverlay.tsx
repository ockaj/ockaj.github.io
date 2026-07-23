import { useEffect, useState, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  Variants,
} from "motion/react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { LiquidGlass, LiquidGlassButton } from "./LiquidGlass/LiquidGlass";
import BpmnNodeBadge from "./BpmnNodeBadge";
import BpmnDiagram from "./BpmnDiagram";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useOverlay, LABEL_MAP } from "../hooks/useAppNavigation";
import { SPRING } from "../utils/springConfig";

interface BpmnOverlayProps {
  onNavigate: (sectionLabel: string) => void;
}

const bpmnModalVariants: Variants = {
  hidden: (custom: { prefersReducedMotion: boolean; isMobile: boolean }) => ({
    opacity: 0,
    scale: custom.prefersReducedMotion ? 1 : custom.isMobile ? 0.96 : 0.95,
    y: custom.prefersReducedMotion ? 0 : 15,
    transition: custom.prefersReducedMotion ? { duration: 0.15 } : SPRING.exit,
  }),
  visible: (custom: { prefersReducedMotion: boolean; isMobile: boolean }) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: custom.prefersReducedMotion
      ? { duration: 0.15 }
      : custom.isMobile
        ? SPRING.modalMobile
        : SPRING.modal,
  }),
};

export default function BpmnOverlay({ onNavigate }: BpmnOverlayProps) {
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const typedBufferRef = useRef<string[]>([]);
  const [showHotkeyTip, setShowHotkeyTip] = useState(false);
  const [hasDismissedTip, setHasDismissedTip] = useState(() => {
    return (
      typeof window !== "undefined" &&
      sessionStorage.getItem("bpmn_tip_dismissed") === "true"
    );
  });

  useOverlay(isOpen, () => setIsOpen(false), "bpmn");

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
      if (["b", "p", "m", "n"].includes(key)) {
        typedBufferRef.current = [...typedBufferRef.current, key].slice(-4);
        if (typedBufferRef.current.join("") === "bpmn") {
          setIsOpen(true);
          typedBufferRef.current = [];
        }
      } else {
        typedBufferRef.current = [];
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile]);

  // Show a brief toast notification on how to trigger if user spends time on the site (once per session)
  useEffect(() => {
    if (isMobile || hasDismissedTip) return;

    const timer = setTimeout(() => {
      setShowHotkeyTip(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("bpmn_tip_dismissed", "true");
      }
      setHasDismissedTip(true);
      // Fade out after 6 seconds
      const fadeTimer = setTimeout(() => {
        setShowHotkeyTip(false);
      }, 6000);
      return () => clearTimeout(fadeTimer);
    }, 12000);

    return () => clearTimeout(timer);
  }, [isMobile, hasDismissedTip]);

  const handleTaskClick = (sectionId: string) => {
    setIsOpen(false);
    const label = LABEL_MAP[sectionId];
    if (label) {
      setTimeout(() => {
        onNavigate(label);
      }, 100);
    }
  };

  return (
    <>
      {/* Subtle Toast Tip */}
      <AnimatePresence>
        {showHotkeyTip && !isOpen ? (
          <motion.div
            initial={{
              opacity: 0,
              y: prefersReducedMotion ? 0 : 30,
              scale: prefersReducedMotion ? 1 : 0.95,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: prefersReducedMotion ? 0 : 20,
              scale: prefersReducedMotion ? 1 : 0.95,
            }}
            className="hidden md:block fixed bottom-6 right-6 z-40 max-w-sm text-xs pointer-events-auto"
          >
            <LiquidGlass
              as="div"
              roundedClass="rounded-xl"
              className="p-3 bg-surface/90"
              innerClassName="flex items-center gap-3 w-full"
              specularGlow
            >
              <BpmnNodeBadge type="script-task" className="flex-shrink-0" />
              <div className="flex-1 text-left">
                <p className="font-semibold text-text-primary text-[12px]">
                  Process Analyst Easter Egg
                </p>
                <p className="text-muted text-[11px] mt-0.5 leading-normal text-pretty">
                  Type{" "}
                  <span className="font-mono text-accent font-bold">
                    B-P-M-N
                  </span>{" "}
                  on your keyboard to reveal the portfolio's meta-diagram.
                </p>
              </div>
              <LiquidGlassButton
                onClick={() => setShowHotkeyTip(false)}
                className="size-10 flex items-center justify-center text-muted hover:text-text-primary"
                roundedClass="rounded-full"
                ariaLabel="Dismiss tip"
                magnetic
                magneticStrength={0.03}
              >
                <X size={14} />
              </LiquidGlassButton>
            </LiquidGlass>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Full Screen Blueprint BPMN Overlay */}
      <AnimatePresence>
        {isOpen && typeof document !== "undefined" ? (
          <Dialog.Root
            open
            modal
            disablePointerDismissal
            onOpenChange={(open) => {
              if (!open) {
                setIsOpen(false);
              }
            }}
          >
            <Dialog.Portal keepMounted>
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-6 lg:p-8">
                {/* Backdrop */}
                <Dialog.Backdrop
                  onClick={() => setIsOpen(false)}
                  render={
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: 1,
                        transition: { duration: 0.2, ease: "easeOut" },
                      }}
                      exit={{
                        opacity: 0,
                        transition: { duration: 0.15, ease: "easeOut" },
                      }}
                      className="fixed inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
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
                      className="relative w-full h-full md:max-w-[85vw] 2xl:max-w-[1360px] md:h-[90vh] bg-surface/95 border-0 md:border md:border-white/10 rounded-none md:rounded-3xl backdrop-blur-2xl flex flex-col overflow-hidden z-10 pointer-events-auto shadow-2xl"
                      style={{
                        boxShadow:
                          "inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 4px 20px rgba(0, 0, 0, 0.6)",
                      }}
                    />
                  }
                >
                  <div className="w-full h-full flex flex-col relative">
                    {/* Specular sheen header overlay matching CV modal */}
                    <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none bg-gradient-to-b from-white/5 to-transparent z-20" />

                    {/* Part 1: Gridless Header Area */}
                    <div className="relative z-30 flex items-center justify-between border-b border-white/10 w-full p-5 md:px-8 md:py-5 flex-shrink-0">
                      <div>
                        <Dialog.Title className="text-lg md:text-2xl font-display text-text-primary">
                          Portfolio System Operation Blueprint
                        </Dialog.Title>
                        <p className="text-[11px] md:text-xs text-muted max-w-xl leading-relaxed mt-1 text-pretty">
                          Click any user task box in the upper lane to navigate
                          directly to that section. Press{" "}
                          <span className="font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-xl text-accent font-bold">
                            ESC
                          </span>{" "}
                          or click close to dismiss.
                        </p>
                      </div>
                      <Dialog.Close
                        render={
                          <LiquidGlassButton
                            onClick={() => setIsOpen(false)}
                            ariaLabel="Close model overlay"
                            className="size-10 md:size-11 p-0 flex-shrink-0"
                          >
                            <X size={18} />
                          </LiquidGlassButton>
                        }
                      />
                    </div>

                    {/* Part 2: BPMN Diagram Core with Blueprint Grid */}
                    <div
                      className="flex-1 w-full flex items-center justify-center p-4 md:p-8 overflow-auto custom-cv-scrollbar select-none"
                      style={{
                        backgroundImage: `
                          url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 33 L 40 47 M 33 40 L 47 40' stroke='hsla(244, 75%25, 76%25, 0.12)' stroke-width='1'/%3E%3C/svg%3E"),
                          radial-gradient(circle, hsl(var(--text) / 0.035) 0.75px, transparent 0.75px)
                        `,
                        backgroundSize: "80px 80px, 20px 20px",
                        backgroundPosition: "center, center",
                      }}
                    >
                      <div className="max-w-[1280px] w-full mx-auto flex items-center justify-center">
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
