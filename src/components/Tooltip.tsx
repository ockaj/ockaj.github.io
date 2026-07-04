import {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  ReactNode,
  KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

// Coordinated delay manager module-level variables
let globalLastActiveTooltipTime = 0;
let globalActiveTooltipCount = 0;

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [status, setStatus] = useState<"hidden" | "scheduling" | "visible">(
    "hidden",
  );
  const [isInstant, setIsInstant] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, position: "top" });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Derive visibility for rendering and layout logic
  const visible = status === "visible";

  // Handle delayed scheduling
  useEffect(() => {
    if (status !== "scheduling") return;

    const timer = setTimeout(() => {
      globalActiveTooltipCount = globalActiveTooltipCount + 1;
      globalLastActiveTooltipTime = Date.now();
      setStatus("visible");
    }, 120);

    return () => clearTimeout(timer);
  }, [status]);

  // Handle global coordination cleanup on hide or unmount
  useEffect(() => {
    if (status !== "visible") return;

    return () => {
      globalActiveTooltipCount = Math.max(0, globalActiveTooltipCount - 1);
      globalLastActiveTooltipTime = Date.now();
    };
  }, [status]);

  const showTooltip = () => {
    const now = Date.now();
    const timeSinceLastActive = now - globalLastActiveTooltipTime;
    const isCloseSequence =
      globalActiveTooltipCount > 0 || timeSinceLastActive < 350;

    if (isCloseSequence) {
      globalActiveTooltipCount = globalActiveTooltipCount + 1;
      globalLastActiveTooltipTime = now;
      setIsInstant(true);
      setStatus("visible");
    } else {
      setIsInstant(false);
      setStatus("scheduling");
    }
  };

  const hideTooltip = () => {
    setStatus("hidden");
  };

  useLayoutEffect(() => {
    if (!visible) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const tooltip = tooltipRef.current;
      if (!trigger || !tooltip) return;

      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();

      let top = triggerRect.top - tooltipRect.height - 8;
      let left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
      let position = "top";

      // Flip to bottom if overflowing top of screen
      if (top < 8) {
        top = triggerRect.bottom + 8;
        position = "bottom";
      }

      // Adjust horizontal overflow
      const viewportWidth = window.innerWidth;
      if (left < 8) {
        left = 8;
      } else if (left + tooltipRect.width > viewportWidth - 8) {
        left = viewportWidth - tooltipRect.width - 8;
      }

      setCoords({
        top: top + window.scrollY,
        left: left + window.scrollX,
        position,
      });
    };

    let ticking = false;
    const throttledUpdate = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updatePosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    updatePosition();

    const handleScroll = () => {
      setStatus("hidden");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", throttledUpdate);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", throttledUpdate);
    };
  }, [visible]);

  const isPositioned = coords.top !== 0 || coords.left !== 0;

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (visible) {
        hideTooltip();
      } else {
        showTooltip();
      }
    }
  };

  return (
    <button
      ref={triggerRef}
      type="button"
      onPointerEnter={(e) => e.pointerType === "mouse" && showTooltip()}
      onPointerLeave={(e) => e.pointerType === "mouse" && hideTooltip()}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      onClick={() => (visible ? hideTooltip() : showTooltip())}
      onKeyDown={handleKeyDown}
      className="inline-flex cursor-help focus-visible:outline-none text-left bg-transparent border-0 p-0 m-0"
    >
      {children}
      {createPortal(
        <AnimatePresence>
          {visible ? (
            <motion.div
              ref={tooltipRef}
              role="tooltip"
              initial={{
                opacity: 0,
                scale: prefersReducedMotion ? 1 : 0.95,
                y: prefersReducedMotion
                  ? 0
                  : coords.position === "top"
                    ? 4
                    : -4,
              }}
              animate={{
                opacity: isPositioned ? 1 : 0,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: prefersReducedMotion ? 1 : 0.95,
                y: prefersReducedMotion
                  ? 0
                  : coords.position === "top"
                    ? 2
                    : -2,
              }}
              transition={
                prefersReducedMotion
                  ? { duration: 0.1 }
                  : isInstant
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 400, damping: 25, mass: 0.8 }
              }
              style={{
                position: "absolute",
                top: coords.top,
                left: coords.left,
                zIndex: 9999,
                transformOrigin:
                  coords.position === "top" ? "bottom center" : "top center",
              }}
              className="pointer-events-none px-3 py-1.5 rounded-xl border border-white/10 bg-surface/95 backdrop-blur-md shadow-xl text-[10px] font-normal text-text-primary tracking-normal max-w-xs leading-relaxed text-center"
            >
              {content}
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
    </button>
  );
}
