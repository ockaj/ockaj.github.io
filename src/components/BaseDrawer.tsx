import { useRef, useState, ReactNode, memo } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { motion, useReducedMotion, Variants } from "motion/react";
import { X } from "lucide-react";
import { LiquidGlassButton } from "./LiquidGlass/LiquidGlass";
import { SPRING } from "../utils/springConfig";
import { useIsMobile, useIsTouchDevice } from "../hooks/useMediaQuery";
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
const DRAG_ELASTIC = { left: 0.05, right: 1 } as const;

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
  const isTouchDevice = useIsTouchDevice();
  const canDrag = isMobile || isTouchDevice;
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
              className="fixed inset-0 z-90 overscroll-contain bg-black/70 backdrop-blur-none md:backdrop-blur-sm"
            />
          }
        />

        {/* Drawer Body */}
        <Dialog.Popup
          render={
            <motion.div
              custom={{
                prefersReducedMotion: !!prefersReducedMotion,
                exitVelocityX,
              }}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={drawerVariants}
              drag={canDrag ? "x" : false}
              dragConstraints={DRAG_CONSTRAINTS}
              dragElastic={DRAG_ELASTIC}
              onDragEnd={(_e, info) => {
                const projectedX =
                  info.offset.x +
                  (info.velocity.x / 1000) * (0.998 / (1 - 0.998));
                if (projectedX > 160 || info.velocity.x > 450) {
                  setExitVelocityX(info.velocity.x);
                  onClose();
                }
              }}
              className={cn(
                "fixed top-0 right-0 z-100 flex size-full flex-col overflow-hidden overscroll-contain border-l border-white/10 bg-surface shadow-drawer md:bg-surface/90 md:backdrop-blur-2xl",
                maxWidthClass || "max-w-2xl",
                canDrag && "touch-pan-y will-change-transform select-none",
              )}
            />
          }
        >
          <div className="relative flex size-full flex-col">
            {/* Specular sheen header overlay matching CV modal */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28 bg-linear-to-b from-white/5 to-transparent" />

            {/* Top bar */}
            <div className="relative z-30 flex items-center justify-between border-b border-white/10 px-6 pb-6 pt-safe-6 md:pt-6">
              <Dialog.Title className="flex items-center gap-2 text-sm font-semibold text-text-primary/90">
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
