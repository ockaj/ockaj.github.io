import { Toast, type ToastManager } from "@base-ui/react/toast";
import { X } from "lucide-react";
import {
  InteractiveGlass,
  LiquidGlassButton,
} from "../LiquidGlass/LiquidGlass";
import BpmnNodeBadge from "./BpmnNodeBadge";
import { cn } from "../../utils/cn";

export interface BpmnHotkeyToastProps {
  readonly toastManager: ToastManager;
  readonly durationMs?: number;
}

const DEFAULT_DURATION_MS = 10000;

function BpmnHotkeyToastList() {
  const { toasts } = Toast.useToastManager();

  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className={cn(
        "pointer-events-auto rounded-xl focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none",
        "transition-slide duration-300 ease-expo-out",
        "data-starting-style:translate-y-5 data-starting-style:scale-95 data-starting-style:opacity-0",
        "data-ending-style:translate-y-5 data-ending-style:scale-95 data-ending-style:opacity-0",
        "data-[swipe-direction=right]:data-ending-style:translate-x-full data-[swipe-direction=right]:data-ending-style:translate-y-0 data-[swipe-direction=right]:data-ending-style:scale-100",
        "data-[swipe-direction=down]:data-ending-style:translate-y-full data-[swipe-direction=down]:data-ending-style:scale-100",
        "motion-reduce:duration-150 motion-reduce:ease-out motion-reduce:data-starting-style:translate-y-0 motion-reduce:data-starting-style:scale-100 motion-reduce:data-ending-style:translate-y-0 motion-reduce:data-ending-style:scale-100",
      )}
    >
      <Toast.Content>
        <InteractiveGlass
          as="div"
          roundedClass="rounded-xl"
          className="bg-surface/90 p-3"
          innerClassName="flex w-full items-center gap-3"
        >
          <BpmnNodeBadge type="script-task" className="shrink-0" />
          <div className="flex-1 text-left">
            <Toast.Title className="text-sm font-semibold text-pretty text-text-primary">
              Process Analyst Easter Egg
            </Toast.Title>
            <Toast.Description className="mt-0.5 text-sm leading-normal text-pretty text-muted">
              Type{" "}
              <span className="font-mono font-bold text-accent">B-P-M-N</span>{" "}
              on your keyboard to reveal the portfolio&apos;s meta-diagram.
            </Toast.Description>
          </div>
          <Toast.Close
            render={
              <LiquidGlassButton
                className="flex size-10 items-center justify-center text-muted hover:text-text-primary"
                roundedClass="rounded-full"
                ariaLabel="Dismiss tip"
                magnetic
                magneticStrength={0.03}
              >
                <X size={14} />
              </LiquidGlassButton>
            }
          />
        </InteractiveGlass>
      </Toast.Content>
    </Toast.Root>
  ));
}

export default function BpmnHotkeyToast({
  toastManager,
  durationMs = DEFAULT_DURATION_MS,
}: Readonly<BpmnHotkeyToastProps>) {
  return (
    <Toast.Provider toastManager={toastManager} timeout={durationMs} limit={1}>
      <Toast.Portal>
        <Toast.Viewport className="pointer-events-none fixed right-6 bottom-6 z-40 hidden max-w-sm text-sm md:block">
          <BpmnHotkeyToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}
