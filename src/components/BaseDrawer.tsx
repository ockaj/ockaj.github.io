import { useRef, useState, ReactNode, memo } from "react";
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

interface DrawerCustom {
  prefersReducedMotion: boolean;
  isMobile: boolean;
  exitVelocityX?: number;
}

function getVisibleTransition(custom: DrawerCustom) {
  if (custom.prefersReducedMotion) return { duration: 0.15 };
  return SPRING.drawer;
}

function getHiddenTransition(custom: DrawerCustom) {
  if (custom.prefersReducedMotion) return { duration: 0.15 };
  if (custom.exitVelocityX !== undefined && custom.exitVelocityX > 0) {
    return {
      ...SPRING.exit,
      velocity: custom.exitVelocityX,
    };
  }
  return SPRING.exit;
}

const drawerVariants: Variants = {
  hidden: (custom: DrawerCustom) => ({
    x: custom.prefersReducedMotion ? 0 : "100%",
    opacity: custom.prefersReducedMotion ? 0 : 1,
    transition: getHiddenTransition(custom),
  }),
  visible: (custom: DrawerCustom) => ({
    x: 0,
    opacity: 1,
    transition: getVisibleTransition(custom),
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
  const [exitVelocityX, setExitVelocityX] = useState<number | undefined>(
    undefined,
  );

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
              className="fixed inset-0 z-[90] overscroll-contain bg-black/70 backdrop-blur-none md:backdrop-blur-sm"
            />
          }
        />

        {/* Drawer Body */}
        <Dialog.Popup
          render={
            <motion.div
              custom={{
                prefersReducedMotion: !!prefersReducedMotion,
                isMobile,
                exitVelocityX,
              }}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={drawerVariants}
              drag={isMobile ? "x" : false}
              dragConstraints={DRAG_CONSTRAINTS}
              dragElastic={DRAG_ELASTIC}
              onDragEnd={(_e, info) => {
                if (info.offset.x > 100 || info.velocity.x > 300) {
                  setExitVelocityX(info.velocity.x);
                  onClose();
                }
              }}
              className={cn(
                "bg-surface md:bg-surface/90 fixed top-0 right-0 z-[100] flex h-full w-full flex-col overflow-hidden overscroll-contain border-l border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.6)] md:backdrop-blur-2xl",
                maxWidthClass || "max-w-2xl",
                isMobile && "touch-pan-y will-change-transform select-none",
              )}
            />
          }
        >
          <div className="relative flex h-full w-full flex-col">
            {/* Specular sheen header overlay matching CV modal */}
            <div className="pointer-events-none absolute top-0 right-0 left-0 z-20 h-28 bg-gradient-to-b from-white/5 to-transparent" />

            {/* Top bar */}
            <div className="relative z-30 flex items-center justify-between border-b border-white/10 p-6">
              <Dialog.Title className="text-muted flex items-center gap-2 text-xs font-semibold uppercase">
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
