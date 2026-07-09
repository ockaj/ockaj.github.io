import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { createPortal } from "react-dom";
import FocusLock from "react-focus-lock";
import { X } from "lucide-react";
import { LiquidGlass, LiquidGlassButton } from "./LiquidGlass/LiquidGlass";
import BpmnNodeBadge from "./BpmnNodeBadge";
import BpmnDiagram from "./BpmnDiagram";
import { useIsMobile } from "../hooks/useMediaQuery";

export default function BpmnOverlay() {
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const typedBufferRef = useRef<string[]>([]);
  const [showHotkeyTip, setShowHotkeyTip] = useState(false);

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

      if (e.key === "Escape") {
        setIsOpen(false);
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

  // Show a brief toast notification on how to trigger if user spends time on the site
  useEffect(() => {
    if (isMobile) return;

    const timer = setTimeout(() => {
      setShowHotkeyTip(true);
      // Fade out after 6 seconds
      const fadeTimer = setTimeout(() => {
        setShowHotkeyTip(false);
      }, 6000);
      return () => clearTimeout(fadeTimer);
    }, 12000);

    return () => clearTimeout(timer);
  }, [isMobile]);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  const handleTaskClick = (sectionId: string) => {
    setIsOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
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
              interactive
              specularGlow
            >
              <BpmnNodeBadge type="script-task" className="flex-shrink-0" />
              <div className="flex-1 text-left">
                <p className="font-semibold text-text-primary text-[12px]">
                  Process Analyst Easter Egg
                </p>
                <p className="text-muted text-[11px] mt-0.5 leading-tight text-pretty">
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
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] bg-bg/95 backdrop-blur-2xl flex flex-col justify-between p-6 md:p-10 select-none overflow-y-auto"
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(102,103,171,0.06) 1.5px, transparent 1.5px)",
                  backgroundSize: "24px 24px",
                }}
              >
                <FocusLock
                  returnFocus
                  className="w-full h-full flex flex-col justify-between"
                >
                  {/* Header Area */}
                  <div className="flex items-start justify-between border-b border-white/5 pb-4 w-full">
                    <div>
                      <h1 className="text-xl md:text-3xl font-display text-text-primary">
                        Portfolio System Operation Blueprint
                      </h1>
                      <p className="text-xs text-muted max-w-xl leading-relaxed mt-1 text-pretty">
                        Click any visitor task box in the upper lane to navigate
                        directly to that section. Press{" "}
                        <span className="font-mono bg-white/5 border border-white/10 px-2 py-1 rounded-xl text-accent font-bold">
                          ESC
                        </span>{" "}
                        or click close to dismiss.
                      </p>
                    </div>
                    <LiquidGlassButton
                      onClick={() => setIsOpen(false)}
                      ariaLabel="Close model overlay"
                      className="size-11 p-0 flex-shrink-0"
                    >
                      <X size={18} />
                    </LiquidGlassButton>
                  </div>

                  {/* BPMN Diagram Core */}
                  <div className="flex-1 w-full max-w-6xl mx-auto flex items-center justify-center py-6 md:py-10 overflow-x-auto custom-cv-scrollbar">
                    <BpmnDiagram onTaskClick={handleTaskClick} />
                  </div>
                </FocusLock>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
