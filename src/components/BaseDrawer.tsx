import { useRef, ReactNode, memo } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { motion, useReducedMotion, Variants } from "motion/react";
import { X } from "lucide-react";
import { LiquidGlassButton } from "./LiquidGlass/LiquidGlass";
import { SPRING } from "../utils/springConfig";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useOverlay } from "../hooks/useAppNavigation";
import { cn } from "../utils/cn";

interface BaseDrawerProps {
  title: string;
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  maxWidthClass?: string;
  hashId?: string;
}

const drawerVariants: Variants = {
  hidden: (custom: { prefersReducedMotion: boolean; isMobile: boolean }) => ({
    x: custom.prefersReducedMotion ? 0 : "100%",
    opacity: custom.prefersReducedMotion ? 0 : 1,
    transition: custom.prefersReducedMotion ? { duration: 0.15 } : SPRING.exit,
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
  hashId = "drawer",
}: BaseDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  useOverlay(true, onClose, hashId);

  if (typeof document === "undefined") return null;

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
              ref={overlayRef}
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: SPRING.drawer,
              }}
              exit={{
                opacity: 0,
                transition: SPRING.exit,
              }}
              className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-none md:backdrop-blur-sm overscroll-contain"
            />
          }
        />

        {/* Drawer Body */}
        <Dialog.Popup
          render={
            <motion.div
              custom={{ prefersReducedMotion, isMobile }}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={drawerVariants}
              drag={isMobile ? "x" : false}
              dragConstraints={DRAG_CONSTRAINTS}
              dragElastic={DRAG_ELASTIC}
              onDragEnd={(_e, info) => {
                if (info.offset.x > 100 || info.velocity.x > 300) {
                  onClose();
                }
              }}
              className={cn(
                "fixed top-0 right-0 h-full w-full z-[100] bg-surface md:bg-surface/90 md:backdrop-blur-2xl border-l border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden overscroll-contain",
                maxWidthClass || "max-w-2xl",
                isMobile && "will-change-transform select-none touch-pan-y",
              )}
            />
          }
        >
          <div className="w-full h-full flex flex-col relative">
            {/* Specular sheen header overlay matching CV modal */}
            <div className="absolute top-0 left-0 right-0 h-28 pointer-events-none bg-gradient-to-b from-white/5 to-transparent z-20" />

            {/* Top bar */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 relative z-30">
              <Dialog.Title className="flex items-center gap-2 text-xs text-muted uppercase font-semibold">
                {icon ? icon : null}
                <span>{title}</span>
              </Dialog.Title>
              <Dialog.Close
                render={
                  <LiquidGlassButton
                    onClick={onClose}
                    ariaLabel="Close panel"
                    className="size-11 p-0"
                  >
                    <X size={16} />
                  </LiquidGlassButton>
                }
              />
            </div>

            {children}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
});

export default BaseDrawer;
