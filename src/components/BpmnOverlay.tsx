import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { LiquidGlass, LiquidGlassButton } from "./LiquidGlass/LiquidGlass";
import BpmnNodeBadge from "./BpmnNodeBadge";
import BpmnDiagram from "./BpmnDiagram";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useOverlay } from "../hooks/useOverlay";
import { LABEL_MAP } from "../hooks/useNavigation";

interface BpmnOverlayProps {
  onNavigate: (sectionLabel: string) => void;
}

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

  // SVGs for the Interactive BPMN Diagram
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
          <Dialog.Root open onOpenChange={(open) => !open && setIsOpen(false)}>
            <Dialog.Portal keepMounted>
              <Dialog.Popup
                render={
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[120] bg-bg/96 backdrop-blur-2xl flex flex-col overflow-hidden"
                  />
                }
              >
                <div className="w-full h-full flex flex-col">
                  {/* Part 1: Gridless Header Area */}
                  <div className="flex items-start justify-between border-b border-white/5 pb-4 w-full p-6 md:p-10 flex-shrink-0">
                    <div>
                      <Dialog.Title className="text-xl md:text-3xl font-display text-text-primary">
                        Portfolio System Operation Blueprint
                      </Dialog.Title>
                      <p className="text-xs text-muted max-w-xl leading-relaxed mt-1 text-pretty">
                        Click any user task box in the upper lane to navigate
                        directly to that section. Press{" "}
                        <span className="font-mono bg-white/5 border border-white/10 px-2 py-1 rounded-xl text-accent font-bold">
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
                          className="size-11 p-0 flex-shrink-0"
                        >
                          <X size={18} />
                        </LiquidGlassButton>
                      }
                    />
                  </div>

                  {/* Part 2: BPMN Diagram Core with Blueprint Grid */}
                  <div
                    className="flex-1 w-full flex items-center justify-center p-6 md:p-10 overflow-auto custom-cv-scrollbar select-none"
                    style={{
                      backgroundImage: `
                        url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 33 L 40 47 M 33 40 L 47 40' stroke='hsla(244, 75%25, 76%25, 0.12)' stroke-width='1'/%3E%3C/svg%3E"),
                        radial-gradient(circle, hsl(var(--text) / 0.035) 0.75px, transparent 0.75px)
                      `,
                      backgroundSize: "80px 80px, 20px 20px",
                      backgroundPosition: "center, center",
                    }}
                  >
                    <div className="max-w-6xl w-full mx-auto flex items-center justify-center">
                      <BpmnDiagram onTaskClick={handleTaskClick} />
                    </div>
                  </div>
                </div>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        ) : null}
      </AnimatePresence>
    </>
  );
}
