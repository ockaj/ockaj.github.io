import { useEffect, useRef, ReactNode, memo } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion, Variants } from "motion/react";
import { X } from "lucide-react";
import { LiquidGlassButton } from "./LiquidGlass/LiquidGlass";
import { SPRING } from "../utils/springConfig";
import { useIsMobile } from "../hooks/useMediaQuery";
import FocusLock from "react-focus-lock";

interface BaseDrawerProps {
  title: string;
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  maxWidthClass?: string;
}

const drawerVariants: Variants = {
  hidden: (custom: { prefersReducedMotion: boolean; isMobile: boolean }) => ({
    x: custom.prefersReducedMotion ? 0 : "100%",
    opacity: custom.prefersReducedMotion ? 0 : 1,
    transition: custom.prefersReducedMotion
      ? { duration: 0.15 }
      : custom.isMobile
        ? SPRING.drawerMobile
        : SPRING.drawer,
  }),
  visible: (custom: { prefersReducedMotion: boolean; isMobile: boolean }) => ({
    x: 0,
    opacity: 1,
    transition: custom.prefersReducedMotion
      ? { duration: 0.15 }
      : custom.isMobile
        ? SPRING.drawerMobile
        : SPRING.drawer,
  }),
};

const DRAG_CONSTRAINTS = { left: 0, right: 0 } as const;
const DRAG_ELASTIC = { left: 0.05, right: 0.7 } as const;

const BaseDrawer = memo(function BaseDrawer({
  title,
  icon,
  onClose,
  children,
  maxWidthClass,
}: BaseDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const triggerRef = useRef<Element | null>(null);

  // Capture active element on mount and restore it on unmount
  useEffect(() => {
    if (typeof document !== "undefined") {
      triggerRef.current = document.activeElement;
    }
    return () => {
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus({ preventScroll: true });
      }
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.2, ease: "easeOut" } }}
        exit={{ opacity: 0, transition: { duration: 0.15, ease: "easeOut" } }}
        onClick={onClose}
        className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-none md:backdrop-blur-sm overscroll-contain"
      />

      {/* Drawer Body */}
      <motion.div
        custom={{ prefersReducedMotion, isMobile }}
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={drawerVariants}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        drag={isMobile ? "x" : false}
        dragConstraints={DRAG_CONSTRAINTS}
        dragElastic={DRAG_ELASTIC}
        onDragEnd={(_e, info) => {
          if (info.offset.x > 100 || info.velocity.x > 300) {
            onClose();
          }
        }}
        className={`fixed top-0 right-0 h-full w-full ${maxWidthClass || "max-w-2xl"} z-[100] bg-surface md:bg-surface/90 md:backdrop-blur-2xl border-l border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden ${isMobile ? "will-change-transform select-none touch-pan-y" : ""} overscroll-contain`}
      >
        <FocusLock returnFocus className="w-full h-full flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 relative z-20">
            <div
              className="flex items-center gap-2 text-xs text-muted uppercase font-semibold"
              id="drawer-title"
            >
              {icon && icon}
              <span>{title}</span>
            </div>
            <LiquidGlassButton
              onClick={onClose}
              ariaLabel="Close panel"
              className="size-11 p-0"
            >
              <X size={16} />
            </LiquidGlassButton>
          </div>

          {children}
        </FocusLock>
      </motion.div>
    </>,
    document.body,
  );
});

export default BaseDrawer;
